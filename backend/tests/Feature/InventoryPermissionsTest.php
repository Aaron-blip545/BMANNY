<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryPermissionsTest extends TestCase
{
    use RefreshDatabase;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->category = Category::create([
            'name'        => 'Flavors',
            'description' => 'Flavor raw materials',
        ]);
    }

    private function createUserWithRole(string $role): User
    {
        return User::factory()->create([
            'role'      => $role,
            'is_active' => true,
        ]);
    }

    private function createSampleProduct(): Product
    {
        return Product::create([
            'name'           => 'Dark Chocolate',
            'sku'            => 'FLV-DC-001',
            'category_id'    => $this->category->category_id,
            'price'          => 50.00,
            'stock_quantity' => 100,
            'description'    => 'Rich dark chocolate flavor powder',
        ]);
    }

    public function test_sales_agent_can_view_inventory_but_cannot_add_edit_or_delete(): void
    {
        $salesAgent = $this->createUserWithRole('sales_agent');
        $product = $this->createSampleProduct();

        // 1. Can view inventory
        $response = $this->actingAs($salesAgent, 'web')->get(route('products.index'));
        $response->assertStatus(200);

        // 2. Cannot add raw materials
        $addResponse = $this->actingAs($salesAgent, 'web')->post(route('products.store'), [
            'name'           => 'Hazelnut',
            'sku'            => 'FLV-HN-001',
            'category_id'    => $this->category->category_id,
            'price'          => 60.00,
            'stock_quantity' => 50,
        ]);
        $addResponse->assertStatus(403);

        // 3. Cannot edit/add quantity to existing raw materials
        $editResponse = $this->actingAs($salesAgent, 'web')->put(route('products.update', $product->product_id), [
            'name'           => 'Dark Chocolate Updated',
            'sku'            => 'FLV-DC-001',
            'category_id'    => $this->category->category_id,
            'price'          => 55.00,
            'stock_quantity' => 200,
        ]);
        $editResponse->assertStatus(403);

        // 4. Cannot delete raw materials
        $deleteResponse = $this->actingAs($salesAgent, 'web')->delete(route('products.destroy', $product->product_id));
        $deleteResponse->assertStatus(403);
    }

    public function test_order_manager_can_view_inventory_but_cannot_add_edit_or_delete(): void
    {
        $orderManager = $this->createUserWithRole('order_manager');
        $product = $this->createSampleProduct();

        // 1. Can view inventory
        $response = $this->actingAs($orderManager, 'web')->get(route('products.index'));
        $response->assertStatus(200);

        // 2. Cannot add raw materials
        $addResponse = $this->actingAs($orderManager, 'web')->post(route('products.store'), [
            'name'           => 'Hazelnut',
            'sku'            => 'FLV-HN-001',
            'category_id'    => $this->category->category_id,
            'price'          => 60.00,
            'stock_quantity' => 50,
        ]);
        $addResponse->assertStatus(403);

        // 3. Cannot edit/add quantity to existing raw materials
        $editResponse = $this->actingAs($orderManager, 'web')->put(route('products.update', $product->product_id), [
            'name'           => 'Dark Chocolate Updated',
            'sku'            => 'FLV-DC-001',
            'category_id'    => $this->category->category_id,
            'price'          => 55.00,
            'stock_quantity' => 200,
        ]);
        $editResponse->assertStatus(403);

        // 4. Cannot delete raw materials
        $deleteResponse = $this->actingAs($orderManager, 'web')->delete(route('products.destroy', $product->product_id));
        $deleteResponse->assertStatus(403);
    }

    public function test_product_controller_can_view_add_edit_and_delete_raw_materials(): void
    {
        $productController = $this->createUserWithRole('product_controller');
        $product = $this->createSampleProduct();

        // 1. Can view inventory
        $response = $this->actingAs($productController, 'web')->get(route('products.index'));
        $response->assertStatus(200);

        // 2. Can add raw materials
        $addResponse = $this->actingAs($productController, 'web')->post(route('products.store'), [
            'name'           => 'Hazelnut',
            'sku'            => 'FLV-HN-001',
            'category_id'    => $this->category->category_id,
            'price'          => 60.00,
            'stock_quantity' => 50,
        ]);
        $addResponse->assertRedirect();
        $this->assertDatabaseHas('products', ['sku' => 'FLV-HN-001']);

        // 3. Can edit/add quantity to existing raw materials
        $editResponse = $this->actingAs($productController, 'web')->put(route('products.update', $product->product_id), [
            'name'           => 'Dark Chocolate Updated',
            'sku'            => 'FLV-DC-001',
            'category_id'    => $this->category->category_id,
            'price'          => 55.00,
            'stock_quantity' => 250,
        ]);
        $editResponse->assertRedirect();
        $this->assertDatabaseHas('products', [
            'product_id'     => $product->product_id,
            'stock_quantity' => 250,
        ]);

        // 4. Can delete raw materials
        $deleteResponse = $this->actingAs($productController, 'web')->delete(route('products.destroy', $product->product_id));
        $deleteResponse->assertRedirect();
        $this->assertDatabaseMissing('products', ['product_id' => $product->product_id]);
    }

    public function test_admin_can_view_add_edit_and_delete_raw_materials(): void
    {
        $admin = $this->createUserWithRole('admin');
        $product = $this->createSampleProduct();

        // 1. Can view inventory
        $response = $this->actingAs($admin, 'web')->get(route('products.index'));
        $response->assertStatus(200);

        // 2. Can add raw materials
        $addResponse = $this->actingAs($admin, 'web')->post(route('products.store'), [
            'name'           => 'Matcha Powder',
            'sku'            => 'FLV-MAT-001',
            'category_id'    => $this->category->category_id,
            'price'          => 75.00,
            'stock_quantity' => 80,
        ]);
        $addResponse->assertRedirect();
        $this->assertDatabaseHas('products', ['sku' => 'FLV-MAT-001']);

        // 3. Can edit/add quantity to existing raw materials
        $editResponse = $this->actingAs($admin, 'web')->put(route('products.update', $product->product_id), [
            'name'           => 'Dark Chocolate Premium',
            'sku'            => 'FLV-DC-001',
            'category_id'    => $this->category->category_id,
            'price'          => 60.00,
            'stock_quantity' => 300,
        ]);
        $editResponse->assertRedirect();
        $this->assertDatabaseHas('products', [
            'product_id'     => $product->product_id,
            'stock_quantity' => 300,
        ]);

        // 4. Can delete raw materials
        $deleteResponse = $this->actingAs($admin, 'web')->delete(route('products.destroy', $product->product_id));
        $deleteResponse->assertRedirect();
        $this->assertDatabaseMissing('products', ['product_id' => $product->product_id]);
    }

    public function test_customer_and_guest_cannot_access_inventory(): void
    {
        $customer = $this->createUserWithRole('customer');
        $product = $this->createSampleProduct();

        // Guest is redirected to login
        $guestResponse = $this->get(route('products.index'));
        $guestResponse->assertRedirect(route('login'));

        // Customer is redirected to login with notice
        $customerResponse = $this->actingAs($customer, 'web')->get(route('products.index'));
        $customerResponse->assertRedirect(route('login'));
    }
}
