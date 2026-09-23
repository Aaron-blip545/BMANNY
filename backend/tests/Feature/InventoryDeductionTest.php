<?php

namespace Tests\Feature;

use App\Models\BusinessClient;
use App\Models\Category;
use App\Models\Inquiry;
use App\Models\InquiryCustomization;
use App\Models\Order;
use App\Models\Product;
use App\Models\Quotation;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryDeductionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    private function createOrderManager(): User
    {
        return User::factory()->create([
            'role'      => 'order_manager',
            'is_active' => true,
        ]);
    }

    private function setupCustomizedOrder(int $orderedQty, int $flavorStock, int $packagingStock, int $containerStock): array
    {
        $flavorsCat = Category::create(['name' => 'Flavors', 'description' => 'Flavors']);
        $pkgCat     = Category::create(['name' => 'Packaging Types', 'description' => 'Packaging']);
        $cntCat     = Category::create(['name' => 'Container Materials', 'description' => 'Containers']);

        $flavorProduct = Product::create([
            'name'           => 'Vanilla',
            'sku'            => 'FLV-VAN-001',
            'category_id'    => $flavorsCat->category_id,
            'price'          => 45.00,
            'stock_quantity' => $flavorStock,
        ]);

        $packagingProduct = Product::create([
            'name'           => 'Pouch',
            'sku'            => 'PKG-PCH-001',
            'category_id'    => $pkgCat->category_id,
            'price'          => 15.00,
            'stock_quantity' => $packagingStock,
        ]);

        $containerProduct = Product::create([
            'name'           => 'Plastic',
            'sku'            => 'CNT-PLS-001',
            'category_id'    => $cntCat->category_id,
            'price'          => 10.00,
            'stock_quantity' => $containerStock,
        ]);

        $user = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        $client = BusinessClient::create([
            'user_id'          => $user->user_id,
            'business_name'    => 'Acme Food Labs',
            'business_type'    => 'Corporation',
            'contact_person'   => 'John Doe',
            'business_address' => '123 Test St',
        ]);

        $inquiry = Inquiry::create([
            'client_id' => $client->client_id,
            'status'    => 'responded',
        ]);

        $customization = InquiryCustomization::create([
            'inquiry_id'         => $inquiry->inquiry_id,
            'customization_type' => 'Custom Rebrand & Packaging',
            'packaging_type'     => 'Pouch',
            'packaging_finish'   => 'Plastic',
            'serving_size'       => "500g × {$orderedQty} units",
            'client_notes'       => 'Flavor: Vanilla | Brand: Acme Brand',
        ]);

        $quotation = Quotation::create([
            'inquiry_id'           => $inquiry->inquiry_id,
            'total_amount'         => 5000.00,
            'status'               => 'accepted',
            'payment_method'       => 'gcash',
            'payment_submitted_at' => now(),
        ]);

        $order = Order::create([
            'client_id'    => $client->client_id,
            'quotation_id' => $quotation->quotation_id,
            'total_amount' => 5000.00,
            'status'       => 'approved',
        ]);

        return compact('order', 'flavorProduct', 'packagingProduct', 'containerProduct');
    }

    public function test_inventory_service_calculates_required_materials_accurately(): void
    {
        $data = $this->setupCustomizedOrder(150, 200, 300, 400);
        $order = $data['order'];

        $required = InventoryService::calculateRequiredMaterials($order);

        $this->assertCount(3, $required);
        $this->assertEquals(150, $required[$data['flavorProduct']->product_id]['quantity']);
        $this->assertEquals(150, $required[$data['packagingProduct']->product_id]['quantity']);
        $this->assertEquals(150, $required[$data['containerProduct']->product_id]['quantity']);
    }

    public function test_inventory_deduction_succeeds_when_stock_is_sufficient(): void
    {
        $manager = $this->createOrderManager();
        $data = $this->setupCustomizedOrder(100, 150, 200, 250);
        $order = $data['order'];

        $response = $this->actingAs($manager, 'web')->patch(route('orders.update-status', $order->order_id), [
            'status' => 'in_production',
        ]);

        $response->assertRedirect(route('orders.index'));
        $response->assertSessionHas('success');

        $this->assertEquals('in_production', $order->fresh()->status);
        $this->assertEquals(50, $data['flavorProduct']->fresh()->stock_quantity);      // 150 - 100
        $this->assertEquals(100, $data['packagingProduct']->fresh()->stock_quantity);  // 200 - 100
        $this->assertEquals(150, $data['containerProduct']->fresh()->stock_quantity);  // 250 - 100
    }

    public function test_inventory_deduction_fails_when_stock_is_insufficient(): void
    {
        $manager = $this->createOrderManager();
        // Vanilla has only 20 in stock, but order needs 100
        $data = $this->setupCustomizedOrder(100, 20, 200, 250);
        $order = $data['order'];

        $response = $this->actingAs($manager, 'web')->patch(route('orders.update-status', $order->order_id), [
            'status' => 'in_production',
        ]);

        $response->assertRedirect(route('orders.index'));
        $response->assertSessionHas('error');
        $response->assertSessionHasErrors(['inventory']);

        // Order status must remain 'approved'
        $this->assertEquals('approved', $order->fresh()->status);

        // No inventory deducted
        $this->assertEquals(20, $data['flavorProduct']->fresh()->stock_quantity);
        $this->assertEquals(200, $data['packagingProduct']->fresh()->stock_quantity);
        $this->assertEquals(250, $data['containerProduct']->fresh()->stock_quantity);
    }

    public function test_re_updating_in_production_order_does_not_deduct_twice(): void
    {
        $manager = $this->createOrderManager();
        $data = $this->setupCustomizedOrder(50, 100, 100, 100);
        $order = $data['order'];

        // First transition: approved -> in_production
        $this->actingAs($manager, 'web')->patch(route('orders.update-status', $order->order_id), [
            'status' => 'in_production',
        ]);

        $this->assertEquals(50, $data['flavorProduct']->fresh()->stock_quantity);

        // Second update while already in_production
        $this->actingAs($manager, 'web')->patch(route('orders.update-status', $order->order_id), [
            'status' => 'in_production',
        ]);

        // Stock quantity should stay at 50, not deducted again to 0
        $this->assertEquals(50, $data['flavorProduct']->fresh()->stock_quantity);
    }

    public function test_direct_order_items_deducted_properly(): void
    {
        $manager = $this->createOrderManager();
        $cat = Category::create(['name' => 'General', 'description' => 'General']);
        $product = Product::create([
            'name'           => 'Custom Extract',
            'sku'            => 'EXT-001',
            'category_id'    => $cat->category_id,
            'price'          => 100.00,
            'stock_quantity' => 80,
        ]);

        $user = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        $client = BusinessClient::create([
            'user_id'          => $user->user_id,
            'business_name'    => 'Extract Co',
            'business_type'    => 'Corporation',
            'contact_person'   => 'Jane Doe',
            'business_address' => '456 Main St',
        ]);

        $inquiry = Inquiry::create([
            'client_id' => $client->client_id,
            'status'    => 'responded',
        ]);

        $quotation = Quotation::create([
            'inquiry_id'           => $inquiry->inquiry_id,
            'total_amount'         => 3000.00,
            'status'               => 'accepted',
            'payment_method'       => 'gcash',
            'payment_submitted_at' => now(),
        ]);

        $order = Order::create([
            'client_id'    => $client->client_id,
            'quotation_id' => $quotation->quotation_id,
            'total_amount' => 3000.00,
            'status'       => 'approved',
        ]);

        \App\Models\OrderItem::create([
            'order_id'   => $order->order_id,
            'product_id' => $product->product_id,
            'quantity'   => 30,
            'unit_price' => 100.00,
        ]);

        $this->actingAs($manager, 'web')->patch(route('orders.update-status', $order->order_id), [
            'status' => 'in_production',
        ]);

        $this->assertEquals('in_production', $order->fresh()->status);
        $this->assertEquals(50, $product->fresh()->stock_quantity); // 80 - 30 = 50
    }
}
