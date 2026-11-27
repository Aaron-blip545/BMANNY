<?php

namespace Tests\Feature;

use App\Models\BusinessClient;
use App\Models\ClientPackagingBalance;
use App\Models\Inquiry;
use App\Models\InquiryCustomization;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductPackage;
use App\Models\ProductRecipe;
use App\Models\ProductType;
use App\Models\Quotation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class BomInventoryDeductionTest extends TestCase
{
    use RefreshDatabase;

    private function seedAshigoWithBom(float $cornStock = 50.0, float $malunggayStock = 20.0): array
    {
        $sales = User::create([
            'full_name' => 'Sales Agent',
            'email' => 'sales.bom@example.com',
            'password' => Hash::make('Password123!'),
            'role' => 'sales_agent',
            'is_active' => true,
        ]);

        $orderManager = User::create([
            'full_name' => 'Order Manager',
            'email' => 'om.bom@example.com',
            'password' => Hash::make('Password123!'),
            'role' => 'order_manager',
            'is_active' => true,
        ]);

        $customer = User::create([
            'full_name' => 'BOM Client',
            'email' => 'client.bom@example.com',
            'password' => Hash::make('Password123!'),
            'role' => 'customer',
            'is_active' => true,
        ]);

        $client = $customer->businessClient()->first() ?? BusinessClient::create([
            'user_id' => $customer->user_id,
            'business_name' => 'BOM Coffee Co.',
            'contact_person' => 'BOM Client',
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
            'payment_terms' => '50% before production; 50% balance before pickup',
            'is_active' => true,
        ]);

        ProductPackage::create([
            'product_type_id' => $productType->product_type_id,
            'slug' => 'gold',
            'name' => 'Gold Package',
            'minimum_quantity' => 5000,
            'packaging_details' => 'Stand-up pouch, 12 × 20 cm',
            'label_details' => 'Full-color pouch print',
            'net_weight' => '120 g',
            'lead_time_text' => '40–60 days after layout approval',
            'initial_price' => 80650,
            'payment_terms' => 'Before production + Before pickup',
            'is_active' => true,
        ]);

        $corn = Product::create([
            'sku' => 'RM-0001',
            'name' => 'Corn Coffee Powder',
            'price' => 300,
            'stock_quantity' => $cornStock,
            'reorder_level' => 5,
            'unit_of_measure' => 'kg',
        ]);

        $malunggay = Product::create([
            'sku' => 'RM-0002',
            'name' => 'Malunggay Extract',
            'price' => 500,
            'stock_quantity' => $malunggayStock,
            'reorder_level' => 2,
            'unit_of_measure' => 'kg',
        ]);

        // BOM: 0.025 kg corn + 0.010 kg malunggay per pouch
        ProductRecipe::create([
            'product_type_id' => $productType->product_type_id,
            'product_id' => $corn->product_id,
            'quantity_per_unit' => 0.025,
            'rate' => 300,
            'amount' => 7.50,
        ]);

        ProductRecipe::create([
            'product_type_id' => $productType->product_type_id,
            'product_id' => $malunggay->product_id,
            'quantity_per_unit' => 0.010,
            'rate' => 500,
            'amount' => 5.00,
        ]);

        return [$sales, $orderManager, $client, $productType, $corn, $malunggay];
    }

    public function test_starter_bom_deducts_on_payment_confirmation_and_does_not_double_deduct(): void
    {
        [$sales, $orderManager, $client, , $corn, $malunggay] = $this->seedAshigoWithBom(50.0, 20.0);

        $inquiry = Inquiry::create([
            'client_id' => $client->client_id,
            'status' => 'quotation_sent',
        ]);

        InquiryCustomization::create([
            'inquiry_id' => $inquiry->inquiry_id,
            'customization_type' => 'Package inquiry — Starter Package',
            'selected_package' => 'starter',
            'packaging_type' => 'Stand-up pouch, 12 × 20 cm',
            'serving_size' => '120 g × 200 pouches',
            'client_notes' => 'Brand: Morning Glow | Finished Product: AshigoPlus Coffee Drink Mix (FP-0001) | MOQ: 200 pouches',
        ]);

        $quotation = Quotation::create([
            'inquiry_id' => $inquiry->inquiry_id,
            'total_amount' => 15800,
            'initial_payment_amount' => 7900,
            'balance_payment_amount' => 7900,
            'status' => 'sent',
            'payment_method' => 'bank_transfer',
            'payment_submitted_at' => now(),
        ]);

        // 200 pouches * (0.025 kg corn, 0.010 kg malunggay) = 5.0 kg corn, 2.0 kg malunggay
        $res = $this->actingAs($sales, 'web')->post("/quotations/{$quotation->quotation_id}/accept");
        $res->assertRedirect(route('quotations.index'));

        $corn->refresh();
        $malunggay->refresh();
        $this->assertEquals(45.0, (float) $corn->stock_quantity);
        $this->assertEquals(18.0, (float) $malunggay->stock_quantity);

        $order = Order::where('quotation_id', $quotation->quotation_id)->firstOrFail();
        $this->assertNotNull($order->inventory_deducted_at);

        // Moving to in_production must NOT deduct a second time
        $statusRes = $this->actingAs($orderManager, 'web')->patch("/orders/{$order->order_id}/status", [
            'status' => 'in_production',
        ]);
        $statusRes->assertRedirect(route('orders.index'));

        $corn->refresh();
        $malunggay->refresh();
        $this->assertEquals(45.0, (float) $corn->stock_quantity);
        $this->assertEquals(18.0, (float) $malunggay->stock_quantity);
    }

    public function test_gold_initial_order_deducts_first_batch_150_and_reorder_deducts_batch_qty(): void
    {
        [$sales, , $client, , $corn, $malunggay] = $this->seedAshigoWithBom(50.0, 20.0);

        $inquiry = Inquiry::create([
            'client_id' => $client->client_id,
            'status' => 'quotation_sent',
        ]);

        InquiryCustomization::create([
            'inquiry_id' => $inquiry->inquiry_id,
            'customization_type' => 'Package inquiry — Gold Package',
            'selected_package' => 'gold',
            'packaging_type' => 'Stand-up pouch, 12 × 20 cm',
            'serving_size' => '120 g × 5,000 pouches',
            'client_notes' => 'Brand: Gold Roast | Finished Product: AshigoPlus Coffee Drink Mix (FP-0001) | MOQ: 5,000 pouches',
        ]);

        $quotation = Quotation::create([
            'inquiry_id' => $inquiry->inquiry_id,
            'total_amount' => 80650,
            'initial_payment_amount' => 72400,
            'balance_payment_amount' => 8250,
            'status' => 'sent',
            'payment_method' => 'bank_transfer',
            'payment_submitted_at' => now(),
        ]);

        // Gold initial batch = 150 pouches -> 3.75 kg corn, 1.50 kg malunggay
        $this->actingAs($sales, 'web')->post("/quotations/{$quotation->quotation_id}/accept")
            ->assertRedirect(route('quotations.index'));

        $corn->refresh();
        $malunggay->refresh();
        $this->assertEquals(46.25, (float) $corn->stock_quantity);
        $this->assertEquals(18.5, (float) $malunggay->stock_quantity);

        // Repeat-batch reorder of 250 pouches -> 6.25 kg corn, 2.50 kg malunggay
        $balance = ClientPackagingBalance::where('client_id', $client->client_id)->firstOrFail();
        $reorderInquiry = Inquiry::create([
            'client_id' => $client->client_id,
            'inquiry_type' => 'reorder_batch',
            'packaging_balance_id' => $balance->balance_id,
            'reorder_batch_quantity' => 250,
            'status' => 'quotation_sent',
        ]);

        InquiryCustomization::create([
            'inquiry_id' => $reorderInquiry->inquiry_id,
            'customization_type' => 'Repeat Batch Reorder — Gold Package',
            'selected_package' => 'gold',
            'packaging_type' => 'Stand-up pouch, 12 × 20 cm',
            'serving_size' => '120 g × 250 pouches',
            'client_notes' => 'Brand: Gold Roast | Finished Product: AshigoPlus Coffee Drink Mix (FP-0001)',
        ]);

        $reorderQuote = Quotation::create([
            'inquiry_id' => $reorderInquiry->inquiry_id,
            'total_amount' => 13750,
            'initial_payment_amount' => 13750,
            'balance_payment_amount' => 0,
            'status' => 'sent',
            'payment_method' => 'bank_transfer',
            'payment_submitted_at' => now(),
        ]);

        $this->actingAs($sales, 'web')->post("/quotations/{$reorderQuote->quotation_id}/accept")
            ->assertRedirect(route('quotations.index'));

        $corn->refresh();
        $malunggay->refresh();
        $this->assertEquals(40.0, (float) $corn->stock_quantity);
        $this->assertEquals(16.0, (float) $malunggay->stock_quantity);
    }

    public function test_insufficient_bom_stock_blocks_payment_acceptance_and_rolls_back(): void
    {
        [$sales, , $client, , $corn, $malunggay] = $this->seedAshigoWithBom(1.0, 20.0);

        $inquiry = Inquiry::create([
            'client_id' => $client->client_id,
            'status' => 'quotation_sent',
        ]);

        InquiryCustomization::create([
            'inquiry_id' => $inquiry->inquiry_id,
            'customization_type' => 'Package inquiry — Starter Package',
            'selected_package' => 'starter',
            'packaging_type' => 'Stand-up pouch, 12 × 20 cm',
            'serving_size' => '120 g × 200 pouches',
            'client_notes' => 'Brand: Low Stock Test | Finished Product: AshigoPlus Coffee Drink Mix (FP-0001)',
        ]);

        $quotation = Quotation::create([
            'inquiry_id' => $inquiry->inquiry_id,
            'total_amount' => 15800,
            'initial_payment_amount' => 7900,
            'balance_payment_amount' => 7900,
            'status' => 'sent',
            'payment_method' => 'bank_transfer',
            'payment_submitted_at' => now(),
        ]);

        // Requires 5.0 kg corn, only 1.0 kg available -> rolls back cleanly
        $res = $this->actingAs($sales, 'web')->post("/quotations/{$quotation->quotation_id}/accept");
        $res->assertSessionHasErrors('inventory');

        $this->assertDatabaseCount('orders', 0);
        $this->assertEquals('sent', $quotation->fresh()->status);
        $this->assertEquals(1.0, (float) $corn->fresh()->stock_quantity);
        $this->assertEquals(20.0, (float) $malunggay->fresh()->stock_quantity);
    }

    public function test_global_bom_is_unlimited_and_inquiry_review_enforces_gold_6_elite_8_limits(): void
    {
        [$sales, , $client, $productType, $corn, $malunggay] = $this->seedAshigoWithBom(50.0, 20.0);

        $pc = User::create([
            'full_name' => 'Product Controller',
            'email' => 'pc.bom@example.com',
            'password' => Hash::make('Password123!'),
            'role' => 'product_controller',
            'is_active' => true,
        ]);

        $ginger = Product::create([
            'sku' => 'RM-0003',
            'name' => 'Ginger Extract',
            'price' => 400,
            'stock_quantity' => 15.0,
            'reorder_level' => 2,
            'unit_of_measure' => 'kg',
        ]);

        // 1. Global Main BOM in Product Management allows > 8 distinct items (no +6/+8 cap)
        $nineGlobalItems = [
            ['product_id' => $corn->product_id, 'quantity_per_unit' => 0.025],
            ['product_id' => $malunggay->product_id, 'quantity_per_unit' => 0.010],
            ['product_id' => $ginger->product_id, 'quantity_per_unit' => 0.001],
        ];
        for ($i = 4; $i <= 9; $i++) {
            $extra = Product::create([
                'sku' => "RM-000{$i}",
                'name' => "Extra Herb {$i}",
                'price' => 100,
                'stock_quantity' => 10.0,
                'reorder_level' => 1,
                'unit_of_measure' => 'kg',
            ]);
            $nineGlobalItems[] = ['product_id' => $extra->product_id, 'quantity_per_unit' => 0.001];
        }
        $this->actingAs($pc, 'web')
            ->post("/product-controller/products/{$productType->product_type_id}/bom", [
                'items' => $nineGlobalItems,
            ])
            ->assertSessionHasNoErrors();

        // Reset global base BOM back to corn (0.025) + malunggay (0.010) for exact math check
        $this->actingAs($pc, 'web')
            ->post("/product-controller/products/{$productType->product_type_id}/bom", [
                'items' => [
                    ['product_id' => $corn->product_id, 'quantity_per_unit' => 0.025],
                    ['product_id' => $malunggay->product_id, 'quantity_per_unit' => 0.010],
                ],
            ])
            ->assertSessionHasNoErrors();

        // 2. Starter inquiry review rejects custom herbal BOM add-ons
        $starterInq = Inquiry::create(['client_id' => $client->client_id, 'status' => 'new']);
        InquiryCustomization::create([
            'inquiry_id' => $starterInq->inquiry_id,
            'customization_type' => 'Package inquiry — Starter Package',
            'selected_package' => 'starter',
            'packaging_type' => 'Stand-up pouch, 12 × 20 cm',
            'serving_size' => '120 g × 100 pouches',
        ]);
        $starterReview = \App\Models\ProductRequestReview::create([
            'inquiry_id' => $starterInq->inquiry_id,
            'status' => 'pending',
        ]);
        $this->actingAs($pc, 'web')
            ->patch("/product-controller/requests/{$starterReview->product_request_review_id}", [
                'status' => 'available',
                'response_notes' => 'Available',
                'custom_bom_items' => [['product_id' => $ginger->product_id, 'quantity_per_unit' => 0.010]],
            ])
            ->assertSessionHasErrors('custom_bom_items');

        // 3. Gold inquiry review rejects 7 herbal add-ons (max 6), accepts valid add-on, and deducts on payment
        $goldInq = Inquiry::create(['client_id' => $client->client_id, 'status' => 'new']);
        InquiryCustomization::create([
            'inquiry_id' => $goldInq->inquiry_id,
            'customization_type' => 'Package inquiry — Gold Package',
            'selected_package' => 'gold',
            'packaging_type' => 'Stand-up pouch, 12 × 20 cm',
            'serving_size' => '120 g × 5,000 pouches',
            'client_notes' => 'Brand: Gold Ginger | Finished Product: AshigoPlus Coffee Drink Mix (FP-0001)',
        ]);
        $goldReview = \App\Models\ProductRequestReview::create([
            'inquiry_id' => $goldInq->inquiry_id,
            'status' => 'pending',
        ]);

        $sevenItems = array_fill(0, 7, ['product_id' => $ginger->product_id, 'quantity_per_unit' => 0.005]);
        $this->actingAs($pc, 'web')
            ->patch("/product-controller/requests/{$goldReview->product_request_review_id}", [
                'status' => 'available',
                'response_notes' => 'Too many',
                'custom_bom_items' => $sevenItems,
            ])
            ->assertSessionHasErrors('custom_bom_items');

        $this->actingAs($pc, 'web')
            ->patch("/product-controller/requests/{$goldReview->product_request_review_id}", [
                'status' => 'available',
                'response_notes' => 'Approved with ginger extract add-on.',
                'custom_bom_items' => [['product_id' => $ginger->product_id, 'quantity_per_unit' => 0.010]],
            ])
            ->assertSessionHasNoErrors();

        $quote = Quotation::create([
            'inquiry_id' => $goldInq->inquiry_id,
            'total_amount' => 80650,
            'initial_payment_amount' => 72400,
            'balance_payment_amount' => 8250,
            'status' => 'sent',
            'payment_method' => 'bank_transfer',
            'payment_submitted_at' => now(),
        ]);

        // Paying Gold order (150 batch) deducts Global Base (corn 3.75, malunggay 1.50) + Client Ginger (1.50)
        $this->actingAs($sales, 'web')->post("/quotations/{$quote->quotation_id}/accept")
            ->assertRedirect(route('quotations.index'));

        $this->assertEquals(46.25, (float) $corn->fresh()->stock_quantity);
        $this->assertEquals(18.5, (float) $malunggay->fresh()->stock_quantity);
        $this->assertEquals(13.5, (float) $ginger->fresh()->stock_quantity);
    }
}
