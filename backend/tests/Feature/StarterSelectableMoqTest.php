<?php

namespace Tests\Feature;

use App\Models\BusinessClient;
use App\Models\Inquiry;
use App\Models\InquiryCustomization;
use App\Models\ProductPackage;
use App\Models\ProductRequestReview;
use App\Models\ProductType;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StarterSelectableMoqTest extends TestCase
{
    use RefreshDatabase;

    private function createCustomerWithClient(): array
    {
        $user = User::create([
            'full_name' => 'Starter Client',
            'email' => 'starter.client@example.com',
            'password' => Hash::make('Password123!'),
            'role' => 'customer',
            'is_active' => true,
        ]);

        $client = $user->businessClient()->first() ?? BusinessClient::create([
            'user_id' => $user->user_id,
            'business_name' => 'Starter Coffee Co.',
            'contact_person' => 'Starter Client',
        ]);

        return [$user, $client];
    }

    public function test_starter_inquiry_enforces_100_to_500_moq_range(): void
    {
        [$user, $client] = $this->createCustomerWithClient();

        // Valid: 300 pouches
        $ok = $this->actingAs($user, 'sanctum')->postJson('/api/inquiries', [
            'client_id' => $client->client_id,
            'customizations' => [[
                'selected_package' => 'starter',
                'requested_quantity' => 300,
                'packaging_type' => 'Stand-up pouch, 12 × 20 cm',
                'packaging_finish' => 'Sticker label',
                'serving_size' => '120 g × 300 pouches',
                'client_notes' => 'Brand: Starter Brew | MOQ: 300 pouches',
            ]],
        ]);
        $ok->assertStatus(201);

        // Invalid: below 100
        $tooLow = $this->actingAs($user, 'sanctum')->postJson('/api/inquiries', [
            'client_id' => $client->client_id,
            'customizations' => [[
                'selected_package' => 'starter',
                'requested_quantity' => 50,
                'packaging_type' => 'Stand-up pouch, 12 × 20 cm',
                'serving_size' => '120 g × 50 pouches',
            ]],
        ]);
        $tooLow->assertStatus(422);

        // Invalid: above 500
        $tooHigh = $this->actingAs($user, 'sanctum')->postJson('/api/inquiries', [
            'client_id' => $client->client_id,
            'customizations' => [[
                'selected_package' => 'starter',
                'requested_quantity' => 600,
                'packaging_type' => 'Stand-up pouch, 12 × 20 cm',
                'serving_size' => '120 g × 600 pouches',
            ]],
        ]);
        $tooHigh->assertStatus(422);
    }

    public function test_starter_quotation_scales_50_50_milestones_dynamically(): void
    {
        [, $client] = $this->createCustomerWithClient();

        $sales = User::create([
            'full_name' => 'Sales Agent',
            'email' => 'sales.starter@example.com',
            'password' => Hash::make('Password123!'),
            'role' => 'sales_agent',
            'is_active' => true,
        ]);

        $productType = ProductType::create([
            'product_code' => 'FP-0001',
            'name' => 'AshigoPlus Coffee Drink Mix',
            'is_active' => true,
        ]);

        ProductPackage::create([
            'product_type_id' => $productType->product_type_id,
            'slug' => 'starter',
            'name' => 'Starter Package',
            'minimum_quantity' => 100,
            'packaging_details' => 'Stand-up pouch, 12 × 20 cm',
            'label_details' => 'Sticker label',
            'net_weight' => '120 g',
            'lead_time_text' => '10–15 business days',
            'initial_price' => 7900,
            'before_production_amount' => 3950,
            'before_production_label' => 'Before production (50%)',
            'before_pickup_amount' => 3950,
            'before_pickup_label' => 'Before pickup (50%)',
            'payment_terms' => '50% before production; 50% balance before pickup',
            'is_active' => true,
        ]);

        $inquiry = Inquiry::create([
            'client_id' => $client->client_id,
            'status' => 'new',
        ]);

        InquiryCustomization::create([
            'inquiry_id' => $inquiry->inquiry_id,
            'customization_type' => 'Package inquiry — Starter Package',
            'selected_package' => 'starter',
            'packaging_type' => 'Stand-up pouch, 12 × 20 cm',
            'serving_size' => '120 g × 300 pouches',
            'client_notes' => 'Brand: Starter Brew | MOQ: 300 pouches',
        ]);

        ProductRequestReview::create([
            'inquiry_id' => $inquiry->inquiry_id,
            'status' => 'available',
            'reviewed_by' => $sales->user_id,
            'reviewed_at' => now(),
        ]);

        // 300 pouches * ₱79 = ₱23,700 -> 50% / 50% = ₱11,850 / ₱11,850
        $res = $this->actingAs($sales, 'web')->post('/quotations', [
            'inquiry_id' => $inquiry->inquiry_id,
            'total_amount' => 23700,
            'item_details' => 'Starter Package (300 pouches)',
        ]);

        $res->assertRedirect(route('inquiries.index'));
        $this->assertDatabaseHas('quotations', [
            'inquiry_id' => $inquiry->inquiry_id,
            'total_amount' => 23700.00,
            'initial_payment_amount' => 11850.00,
            'balance_payment_amount' => 11850.00,
        ]);

        // Verify InventoryService extracts 300 pouches for BOM deduction
        $this->assertSame(300, InventoryService::parseQuantity('120 g × 300 pouches'));
    }
}
