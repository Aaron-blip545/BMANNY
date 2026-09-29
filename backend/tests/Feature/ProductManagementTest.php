<?php

namespace Tests\Feature;

use App\Models\ProductType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $productController;
    private User $admin;
    private User $salesAgent;

    protected function setUp(): void
    {
        parent::setUp();

        $this->productController = User::factory()->create([
            'role' => 'product_controller',
            'is_active' => true,
        ]);

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->salesAgent = User::factory()->create([
            'role' => 'sales_agent',
            'is_active' => true,
        ]);
    }

    public function test_product_controller_can_view_product_management_page(): void
    {
        ProductType::create([
            'name' => 'Citrus Energy Shot',
            'category_code' => 'Beverage',
            'suggested_srp' => 85.00,
            'description' => '60ml functional beverage base',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->productController, 'web')
            ->get('/product-controller/products');

        $response->assertStatus(200);
    }

    public function test_product_controller_can_create_product_and_it_appears_in_mobile_api(): void
    {
        $response = $this->actingAs($this->productController, 'web')
            ->post('/product-controller/products', [
                'name' => 'Immunity Booster Juice',
                'category_code' => 'Beverage',
                'suggested_srp' => 125.00,
                'description' => '100ml cold pressed base with vitamin C',
                'shelf_life' => '6 Months',
                'storage_conditions' => 'Keep refrigerated',
                'lead_time_days' => 10,
                'is_active' => true,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('product_types', [
            'name' => 'Immunity Booster Juice',
            'category_code' => 'Beverage',
            'is_active' => true,
        ]);

        // Verify mobile app API endpoint returns the newly added product
        $apiResponse = $this->getJson('/api/products');
        $apiResponse->assertStatus(200);
        $apiResponse->assertJsonFragment([
            'name' => 'Immunity Booster Juice',
            'category' => 'Beverage',
            'price' => '₱125.00',
        ]);
    }

    public function test_inactive_product_is_hidden_from_mobile_api(): void
    {
        $product = ProductType::create([
            'name' => 'Secret Formula Beta',
            'category_code' => 'Supplement',
            'suggested_srp' => 300.00,
            'is_active' => false,
        ]);

        $apiResponse = $this->getJson('/api/products');
        $apiResponse->assertStatus(200);
        $apiResponse->assertJsonMissing([
            'name' => 'Secret Formula Beta',
        ]);

        // Toggle to active
        $this->actingAs($this->productController, 'web')
            ->patch("/product-controller/products/{$product->product_type_id}/toggle-status");

        $this->assertTrue($product->fresh()->is_active);

        // Now visible in mobile API
        $apiResponse = $this->getJson('/api/products');
        $apiResponse->assertStatus(200);
        $apiResponse->assertJsonFragment([
            'name' => 'Secret Formula Beta',
        ]);
    }

    public function test_product_controller_can_update_and_delete_product(): void
    {
        $product = ProductType::create([
            'name' => 'Old Product Name',
            'category_code' => 'Cosmetic',
            'suggested_srp' => 50.00,
            'is_active' => true,
        ]);

        // Update
        $this->actingAs($this->productController, 'web')
            ->put("/product-controller/products/{$product->product_type_id}", [
                'name' => 'Updated Product Name',
                'category_code' => 'Cosmetic',
                'suggested_srp' => 75.00,
                'description' => 'Updated description',
                'is_active' => true,
            ]);

        $this->assertDatabaseHas('product_types', [
            'product_type_id' => $product->product_type_id,
            'name' => 'Updated Product Name',
        ]);

        // Delete
        $this->actingAs($this->productController, 'web')
            ->delete("/product-controller/products/{$product->product_type_id}");

        $this->assertDatabaseMissing('product_types', [
            'product_type_id' => $product->product_type_id,
        ]);
    }
}
