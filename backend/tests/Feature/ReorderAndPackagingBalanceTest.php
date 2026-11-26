<?php

namespace Tests\Feature;

use App\Models\BusinessClient;
use App\Models\ClientPackagingBalance;
use App\Models\Inquiry;
use App\Models\InquiryCustomization;
use App\Models\Order;
use App\Models\ProductRequestReview;
use App\Models\ProductType;
use App\Models\Quotation;
use App\Models\User;
use Database\Seeders\AshigoPackageSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ReorderAndPackagingBalanceTest extends TestCase
{
    use RefreshDatabase;

    private function seedAshigoPackages(): void
    {
        ProductType::create([
            'name' => 'AshigoPlus Coffee Drink Mix',
            'product_code' => 'FP-0001',
            'category_code' => 'Beverages',
            'base_price' => 79,
            'is_active' => true,
        ]);

        (new AshigoPackageSeeder())->run();
    }

    private function createUser(string $role, string $email): User
    {
        return User::create([
            'full_name' => ucfirst($role),
            'email' => $email,
            'password' => Hash::make('password123'),
            'role' => $role,
            'is_active' => true,
        ]);
    }

    private function completeInitialPackageOrder(User $sales, User $customer, string $slug, float $total): array
    {
        $client = $customer->businessClient()->first() ?? BusinessClient::create([
            'user_id' => $customer->user_id,
            'business_name' => 'Alpha Wellness',
            'contact_person' => 'Client One',
            'business_type' => 'Retail',
            'business_address' => 'CDO',
        ]);

        $inquiry = Inquiry::create([
            'client_id' => $client->client_id,
            'status' => 'for_quotation',
        ]);

        InquiryCustomization::create([
            'inquiry_id' => $inquiry->inquiry_id,
            'customization_type' => 'Package inquiry — '.ucfirst($slug).' Package',
            'selected_package' => $slug,
            'packaging_type' => 'Stand-up pouch, 12 × 20 cm',
            'serving_size' => '120 g',
            'client_notes' => 'Brand: Alpha Coffee',
        ]);

        ProductRequestReview::create([
            'inquiry_id' => $inquiry->inquiry_id,
            'status' => 'available',
        ]);

        $this->actingAs($sales, 'web')->post(route('quotations.store'), [
            'inquiry_id' => $inquiry->inquiry_id,
            'total_amount' => $total,
        ])->assertRedirect(route('inquiries.index'));

        $quotation = Quotation::where('inquiry_id', $inquiry->inquiry_id)->firstOrFail();
        $quotation->update([
            'payment_method' => 'bank_transfer',
            'payment_submitted_at' => now(),
        ]);

        $this->actingAs($sales, 'web')
            ->post(route('quotations.accept', $quotation->quotation_id))
            ->assertRedirect(route('quotations.index'));

        $order = Order::where('quotation_id', $quotation->quotation_id)->firstOrFail();

        return [$client, $order];
    }

    public function test_gold_initial_order_repeat_batch_refill_guard_and_replenishment(): void
    {
        $this->seedAshigoPackages();
        $sales = $this->createUser('sales_agent', 'sales@test.local');
        $orderManager = $this->createUser('order_manager', 'om@test.local');
        $customer = $this->createUser('customer', 'goldclient@test.local');

        // 1. Initial Gold order creates MOQ balance: 5,000 total, 150 used, 4,850 remaining
        [$client, $initialOrder] = $this->completeInitialPackageOrder($sales, $customer, 'gold', 80650.0);

        $balance = ClientPackagingBalance::where('client_id', $client->client_id)->firstOrFail();
        $this->assertEquals('gold', $balance->package_slug);
        $this->assertEquals(5000, $balance->total_pouches);
        $this->assertEquals(150, $balance->used_pouches);
        $this->assertEquals(4850, $balance->remaining_pouches);
        $this->assertTrue($balance->cylinder_paid);

        // Mobile API returns exact stored MOQ balance, locked until initial order is completed
        $balancesRes = $this->actingAs($customer, 'sanctum')->getJson('/api/packaging-balances');
        $balancesRes->assertOk();
        $this->assertEquals(4850, $balancesRes->json('0.remaining_pouches'));
        $this->assertFalse($balancesRes->json('0.needs_replenishment'));
        $this->assertFalse($balancesRes->json('0.can_reorder'));

        // Strict guard: reorder is BLOCKED until initial order is marked completed
        $this->actingAs($customer, 'sanctum')
            ->postJson("/api/packaging-balances/{$balance->balance_id}/reorder", [
                'batch_quantity' => 500,
            ])
            ->assertStatus(422);

        // Complete the initial order -> reorder now unlocks
        $initialOrder->update([
            'balance_payment_verified_at' => now(),
            'status' => 'completed',
        ]);

        $balancesUnlocked = $this->actingAs($customer, 'sanctum')->getJson('/api/packaging-balances');
        $this->assertTrue($balancesUnlocked->json('0.can_reorder'));

        // Strict guard: refill is REJECTED while remaining_pouches > 0
        $this->actingAs($customer, 'sanctum')
            ->postJson("/api/packaging-balances/{$balance->balance_id}/reorder", [
                'batch_quantity' => 150,
                'request_replenishment' => true,
            ])
            ->assertStatus(422);

        // 2. Client reorders a custom batch of 500 pouches (500 x ₱55 = ₱27,500; ₱0 packaging & cylinder)
        $reorderRes = $this->actingAs($customer, 'sanctum')
            ->postJson("/api/packaging-balances/{$balance->balance_id}/reorder", [
                'batch_quantity' => 500,
            ]);
        $reorderRes->assertStatus(201);

        $reorderInquiry = Inquiry::findOrFail($reorderRes->json('inquiry.inquiry_id'));
        $this->assertEquals('reorder_batch', $reorderInquiry->inquiry_type);
        $this->assertEquals(500, $reorderInquiry->reorder_batch_quantity);
        $this->assertEquals('available', $reorderInquiry->productRequestReview?->status);

        // Sales creates quotation: 100% before production (₱27,500), ₱0 before pickup
        $this->actingAs($sales, 'web')->post(route('quotations.store'), [
            'inquiry_id' => $reorderInquiry->inquiry_id,
            'total_amount' => 27500,
        ])->assertRedirect(route('inquiries.index'));

        $reorderQuote = Quotation::where('inquiry_id', $reorderInquiry->inquiry_id)->firstOrFail();
        $this->assertEquals(27500.0, (float) $reorderQuote->initial_payment_amount);
        $this->assertEquals(0.0, (float) $reorderQuote->balance_payment_amount);

        $reorderQuote->update([
            'payment_method' => 'bank_transfer',
            'payment_submitted_at' => now(),
        ]);

        $this->actingAs($sales, 'web')
            ->post(route('quotations.accept', $reorderQuote->quotation_id))
            ->assertRedirect(route('quotations.index'));

        $balance->refresh();
        $this->assertEquals(650, $balance->used_pouches);
        $this->assertEquals(4350, $balance->remaining_pouches);

        // Order Manager can mark the 100%-upfront repeat-batch order completed without a second balance proof
        $reorderOrder = Order::where('quotation_id', $reorderQuote->quotation_id)->firstOrFail();
        $this->actingAs($orderManager, 'web')
            ->patch(route('orders.update-status', $reorderOrder->order_id), ['status' => 'completed'])
            ->assertRedirect(route('orders.index'));
        $this->assertEquals('completed', $reorderOrder->fresh()->status);

        // 3. Client uses remaining 4,350 pouches to reach 0 -> refill unlocks!
        $balance->deductBatch(4350);
        $this->assertEquals(0, $balance->remaining_pouches);
        $this->assertEquals('depleted', $balance->status);

        // Now packaging replenishment succeeds: ₱50,000 packaging (₱0 cylinder) + 150 x ₱55 = ₱58,250
        $refillRes = $this->actingAs($customer, 'sanctum')
            ->postJson("/api/packaging-balances/{$balance->balance_id}/reorder", [
                'batch_quantity' => 150,
                'request_replenishment' => true,
            ]);
        $refillRes->assertStatus(201);

        $refillInquiry = Inquiry::findOrFail($refillRes->json('inquiry.inquiry_id'));
        $this->assertEquals('packaging_replenishment', $refillInquiry->inquiry_type);

        $this->actingAs($sales, 'web')->post(route('quotations.store'), [
            'inquiry_id' => $refillInquiry->inquiry_id,
            'total_amount' => 58250,
        ])->assertRedirect(route('inquiries.index'));

        $refillQuote = Quotation::where('inquiry_id', $refillInquiry->inquiry_id)->firstOrFail();
        $this->assertEquals(50000.0, (float) $refillQuote->initial_payment_amount);
        $this->assertEquals(8250.0, (float) $refillQuote->balance_payment_amount);

        $refillQuote->update([
            'payment_method' => 'bank_transfer',
            'payment_submitted_at' => now(),
        ]);

        $this->actingAs($sales, 'web')
            ->post(route('quotations.accept', $refillQuote->quotation_id))
            ->assertRedirect(route('quotations.index'));

        $balance->refresh();
        $this->assertEquals(5000, $balance->total_pouches);
        $this->assertEquals(150, $balance->used_pouches);
        $this->assertEquals(4850, $balance->remaining_pouches);
        $this->assertEquals('active', $balance->status);
    }

    public function test_elite_initial_order_and_500_pouch_repeat_batch(): void
    {
        $this->seedAshigoPackages();
        $sales = $this->createUser('sales_agent', 'sales2@test.local');
        $customer = $this->createUser('customer', 'eliteclient@test.local');

        [$client, $eliteOrder] = $this->completeInitialPackageOrder($sales, $customer, 'elite', 139900.0);
        $eliteOrder->update([
            'balance_payment_verified_at' => now(),
            'status' => 'completed',
        ]);

        $balance = ClientPackagingBalance::where('client_id', $client->client_id)->firstOrFail();
        $this->assertEquals('elite', $balance->package_slug);
        $this->assertEquals(10000, $balance->total_pouches);
        $this->assertEquals(350, $balance->used_pouches);
        $this->assertEquals(9650, $balance->remaining_pouches);

        // Reorder 500 pouches -> 500 x ₱50 = ₱25,000
        $reorderRes = $this->actingAs($customer, 'sanctum')
            ->postJson("/api/packaging-balances/{$balance->balance_id}/reorder", [
                'batch_quantity' => 500,
            ]);
        $reorderRes->assertStatus(201);

        $reorderInquiry = Inquiry::findOrFail($reorderRes->json('inquiry.inquiry_id'));
        $this->actingAs($sales, 'web')->post(route('quotations.store'), [
            'inquiry_id' => $reorderInquiry->inquiry_id,
            'total_amount' => 25000,
        ])->assertRedirect(route('inquiries.index'));

        $quote = Quotation::where('inquiry_id', $reorderInquiry->inquiry_id)->firstOrFail();
        $this->assertEquals(25000.0, (float) $quote->initial_payment_amount);
        $this->assertEquals(0.0, (float) $quote->balance_payment_amount);

        $quote->update([
            'payment_method' => 'bank_transfer',
            'payment_submitted_at' => now(),
        ]);

        $this->actingAs($sales, 'web')
            ->post(route('quotations.accept', $quote->quotation_id))
            ->assertRedirect(route('quotations.index'));

        $balance->refresh();
        $this->assertEquals(850, $balance->used_pouches);
        $this->assertEquals(9150, $balance->remaining_pouches);
    }
}
