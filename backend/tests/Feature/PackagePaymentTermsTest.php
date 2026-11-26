<?php

namespace Tests\Feature;

use App\Models\BusinessClient;
use App\Models\Inquiry;
use App\Models\InquiryCustomization;
use App\Models\Order;
use App\Models\ProductPackage;
use App\Models\ProductRequestReview;
use App\Models\ProductType;
use App\Models\Quotation;
use App\Models\User;
use Database\Seeders\AshigoPackageSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PackagePaymentTermsTest extends TestCase
{
    use RefreshDatabase;

    private function seedAshigoPackages(): ProductType
    {
        $product = ProductType::create([
            'name' => 'AshigoPlus Coffee Drink Mix',
            'product_code' => 'FP-0001',
            'category_code' => 'Beverages',
            'base_price' => 79,
            'is_active' => true,
        ]);

        (new AshigoPackageSeeder())->run();

        return $product;
    }

    private function createSalesUser(): User
    {
        return User::create([
            'full_name' => 'Sales Agent',
            'email' => 'sales@test.local',
            'password' => Hash::make('password123'),
            'role' => 'sales_agent',
            'is_active' => true,
        ]);
    }

    private function createCustomerWithInquiry(string $packageSlug): array
    {
        $user = User::create([
            'full_name' => 'Test Client',
            'email' => $packageSlug.'@test.local',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'is_active' => true,
        ]);

        $client = $user->businessClient()->first() ?? BusinessClient::create([
            'user_id' => $user->user_id,
            'business_name' => 'Test Brand Co',
            'contact_person' => 'Test Client',
            'business_type' => 'Retail',
            'business_address' => 'CDO',
        ]);

        $inquiry = Inquiry::create([
            'client_id' => $client->client_id,
            'status' => 'for_quotation',
        ]);

        InquiryCustomization::create([
            'inquiry_id' => $inquiry->inquiry_id,
            'customization_type' => 'Package inquiry',
            'selected_package' => $packageSlug,
            'packaging_type' => 'Stand-up pouch, 12 × 20 cm',
            'serving_size' => '120 g',
        ]);

        ProductRequestReview::create([
            'inquiry_id' => $inquiry->inquiry_id,
            'status' => 'available',
        ]);

        return [$user, $client, $inquiry];
    }

    public function test_products_api_exposes_package_specific_payment_milestones(): void
    {
        $this->seedAshigoPackages();

        $response = $this->getJson('/api/products');
        $response->assertOk();

        $products = $response->json('data') ?? $response->json();
        $ashigo = collect($products)->firstWhere('name', 'AshigoPlus Coffee Drink Mix');
        $this->assertNotNull($ashigo);

        $packages = collect($ashigo['packages'])->keyBy('slug');

        $this->assertEquals(7900.0, $packages['starter']['initial_price']);
        $this->assertEquals(3950.0, $packages['starter']['before_production_amount']);
        $this->assertEquals(3950.0, $packages['starter']['before_pickup_amount']);

        $this->assertEquals(80650.0, $packages['gold']['initial_price']);
        $this->assertEquals(72400.0, $packages['gold']['before_production_amount']);
        $this->assertEquals(8250.0, $packages['gold']['before_pickup_amount']);

        $this->assertEquals(139900.0, $packages['elite']['initial_price']);
        $this->assertEquals(122400.0, $packages['elite']['before_production_amount']);
        $this->assertEquals(17500.0, $packages['elite']['before_pickup_amount']);
    }

    public function test_gold_and_elite_quotations_and_orders_use_package_milestones(): void
    {
        $this->seedAshigoPackages();
        $sales = $this->createSalesUser();

        foreach ([
            ['slug' => 'gold', 'total' => 80650.0, 'initial' => 72400.0, 'balance' => 8250.0],
            ['slug' => 'elite', 'total' => 139900.0, 'initial' => 122400.0, 'balance' => 17500.0],
        ] as $case) {
            [$customer, , $inquiry] = $this->createCustomerWithInquiry($case['slug']);

            $this->actingAs($sales, 'web')->post(route('quotations.store'), [
                'inquiry_id' => $inquiry->inquiry_id,
                'total_amount' => $case['total'],
            ])->assertRedirect(route('inquiries.index'));

            $quotation = Quotation::where('inquiry_id', $inquiry->inquiry_id)->firstOrFail();
            $this->assertEquals($case['initial'], (float) $quotation->initial_payment_amount);
            $this->assertEquals($case['balance'], (float) $quotation->balance_payment_amount);

            // Mobile API returns exact initial payment due (not 50%)
            $inquiriesResponse = $this->actingAs($customer, 'sanctum')->getJson('/api/inquiries/my-inquiries');
            $inquiriesResponse->assertOk();
            $item = collect($inquiriesResponse->json())->firstWhere('inquiry_id', $inquiry->inquiry_id);
            $this->assertEquals($case['initial'], (float) $item['quotation_payment_due_amount']);
            $this->assertEquals($case['balance'], (float) $item['quotation_balance_due_amount']);

            // Simulate client submitting payment proof and Sales accepting quotation
            $quotation->update([
                'payment_method' => 'bank_transfer',
                'payment_submitted_at' => now(),
            ]);

            $this->actingAs($sales, 'web')
                ->post(route('quotations.accept', $quotation->quotation_id))
                ->assertRedirect(route('quotations.index'));

            $order = Order::where('quotation_id', $quotation->quotation_id)->firstOrFail();
            $this->assertEquals($case['total'], (float) $order->total_amount);
            $this->assertEquals($case['initial'], (float) $order->initial_payment_amount);
            $this->assertEquals($case['balance'], (float) $order->balance_payment_amount);
        }
    }

    public function test_legacy_quotation_without_milestones_falls_back_to_fifty_fifty(): void
    {
        $sales = $this->createSalesUser();
        [$customer, , $inquiry] = $this->createCustomerWithInquiry('starter');

        $quotation = Quotation::create([
            'inquiry_id' => $inquiry->inquiry_id,
            'total_amount' => 10000,
            'status' => 'sent',
            'payment_method' => 'bank_transfer',
            'payment_submitted_at' => now(),
        ]);

        $inquiriesResponse = $this->actingAs($customer, 'sanctum')->getJson('/api/inquiries/my-inquiries');
        $inquiriesResponse->assertOk();
        $item = collect($inquiriesResponse->json())->firstWhere('inquiry_id', $inquiry->inquiry_id);
        $this->assertEquals(5000.0, (float) $item['quotation_payment_due_amount']);
        $this->assertEquals(5000.0, (float) $item['quotation_balance_due_amount']);

        $this->actingAs($sales, 'web')
            ->post(route('quotations.accept', $quotation->quotation_id))
            ->assertRedirect(route('quotations.index'));

        $order = Order::where('quotation_id', $quotation->quotation_id)->firstOrFail();
        $this->assertEquals(5000.0, (float) $order->initial_payment_amount);
        $this->assertEquals(5000.0, (float) $order->balance_payment_amount);
    }
}
