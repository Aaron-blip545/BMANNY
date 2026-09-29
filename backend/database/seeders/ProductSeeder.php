<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create categories for Raw Materials used in Product Customization
        $categories = [
            'Flavors' => 'Raw flavor extracts, concentrates, and natural flavor ingredients.',
            'Packaging Types' => 'Primary packaging containers, pouches, cans, boxes, and bulk packs.',
        ];

        $categoryModels = [];
        foreach ($categories as $name => $description) {
            $categoryModels[$name] = Category::firstOrCreate(
                ['name' => $name],
                ['description' => $description]
            );
        }

        // 2. Raw Material inventory items based on product customization options
        $materials = [
            // ── Flavors ────────────────────────────────────────────────────────
            [
                'name'           => 'Vanilla',
                'sku'            => 'FLV-VAN-001',
                'category_id'    => $categoryModels['Flavors']->category_id,
                'price'          => 45.00,
                'stock_quantity' => 150,
                'product_image'  => null,
                'description'    => null,
            ],
            [
                'name'           => 'Chocolate',
                'sku'            => 'FLV-CHO-002',
                'category_id'    => $categoryModels['Flavors']->category_id,
                'price'          => 50.00,
                'stock_quantity' => 200,
                'product_image'  => null,
                'description'    => null,
            ],
            [
                'name'           => 'Strawberry',
                'sku'            => 'FLV-STR-003',
                'category_id'    => $categoryModels['Flavors']->category_id,
                'price'          => 48.00,
                'stock_quantity' => 85,
                'product_image'  => null,
                'description'    => null,
            ],
            [
                'name'           => 'Caramel',
                'sku'            => 'FLV-CRM-004',
                'category_id'    => $categoryModels['Flavors']->category_id,
                'price'          => 52.00,
                'stock_quantity' => 120,
                'product_image'  => null,
                'description'    => null,
            ],
            [
                'name'           => 'Mocha',
                'sku'            => 'FLV-MOC-005',
                'category_id'    => $categoryModels['Flavors']->category_id,
                'price'          => 55.00,
                'stock_quantity' => 90,
                'product_image'  => null,
                'description'    => null,
            ],
            [
                'name'           => 'Hazelnut',
                'sku'            => 'FLV-HAZ-006',
                'category_id'    => $categoryModels['Flavors']->category_id,
                'price'          => 58.00,
                'stock_quantity' => 0, // OUT OF STOCK for testing
                'product_image'  => null,
                'description'    => null,
            ],
            [
                'name'           => 'Original',
                'sku'            => 'FLV-ORI-007',
                'category_id'    => $categoryModels['Flavors']->category_id,
                'price'          => 40.00,
                'stock_quantity' => 300,
                'product_image'  => null,
                'description'    => null,
            ],
            [
                'name'           => 'Matcha',
                'sku'            => 'FLV-MAT-008',
                'category_id'    => $categoryModels['Flavors']->category_id,
                'price'          => 65.00,
                'stock_quantity' => 45,
                'product_image'  => null,
                'description'    => null,
            ],
            [
                'name'           => 'Coconut',
                'sku'            => 'FLV-COC-009',
                'category_id'    => $categoryModels['Flavors']->category_id,
                'price'          => 45.00,
                'stock_quantity' => 0, // OUT OF STOCK for testing
                'product_image'  => null,
                'description'    => null,
            ],

            // ── Packaging Types ────────────────────────────────────────────────
            [
                'name'           => 'Pouch',
                'sku'            => 'PKG-PCH-001',
                'category_id'    => $categoryModels['Packaging Types']->category_id,
                'price'          => 15.00,
                'stock_quantity' => 500,
                'product_image'  => null,
                'description'    => null,
            ],
            [
                'name'           => 'Box',
                'sku'            => 'PKG-BOX-002',
                'category_id'    => $categoryModels['Packaging Types']->category_id,
                'price'          => 25.00,
                'stock_quantity' => 350,
                'product_image'  => null,
                'description'    => null,
            ],
            [
                'name'           => 'Can',
                'sku'            => 'PKG-CAN-003',
                'category_id'    => $categoryModels['Packaging Types']->category_id,
                'price'          => 30.00,
                'stock_quantity' => 200,
                'product_image'  => null,
                'description'    => null,
            ],
            [
                'name'           => 'Bottle',
                'sku'            => 'PKG-BTL-004',
                'category_id'    => $categoryModels['Packaging Types']->category_id,
                'price'          => 20.00,
                'stock_quantity' => 400,
                'product_image'  => null,
                'description'    => null,
            ],
            [
                'name'           => 'Jar',
                'sku'            => 'PKG-JAR-005',
                'category_id'    => $categoryModels['Packaging Types']->category_id,
                'price'          => 28.00,
                'stock_quantity' => 150,
                'product_image'  => null,
                'description'    => null,
            ],
            [
                'name'           => 'Sachet',
                'sku'            => 'PKG-SCH-006',
                'category_id'    => $categoryModels['Packaging Types']->category_id,
                'price'          => 8.00,
                'stock_quantity' => 600,
                'product_image'  => null,
                'description'    => null,
            ],
            [
                'name'           => 'Tin',
                'sku'            => 'PKG-TIN-007',
                'category_id'    => $categoryModels['Packaging Types']->category_id,
                'price'          => 35.00,
                'stock_quantity' => 0, // OUT OF STOCK for testing
                'product_image'  => null,
                'description'    => null,
            ],
            [
                'name'           => 'Bag',
                'sku'            => 'PKG-BAG-008',
                'category_id'    => $categoryModels['Packaging Types']->category_id,
                'price'          => 12.00,
                'stock_quantity' => 250,
                'product_image'  => null,
                'description'    => null,
            ],
        ];

        $validSkus = array_column($materials, 'sku');

        // Remove any old finished products that are not raw materials
        Product::whereNotIn('sku', $validSkus)->delete();

        // Remove any old categories not in raw material categories
        Category::whereNotIn('name', array_keys($categories))->delete();

        // Ensure all existing product descriptions are cleared
        Product::query()->update(['description' => null]);

        foreach ($materials as $m) {
            Product::updateOrCreate(
                ['sku' => $m['sku']],
                $m
            );
        }

        // 3. Catalog Products (Product Management / Mobile App Customization Catalog)
        $catalogProducts = [
            [
                'name'               => 'Citrus Energy Shot',
                'category_code'      => 'Beverage',
                'suggested_srp'      => 85.00,
                'description'        => '60ml functional beverage base',
                'shelf_life'         => '12 Months',
                'storage_conditions' => 'Refrigerate after opening',
                'lead_time_days'     => 14,
                'formulation_notes'  => 'Standard concentrated citrus formula with natural caffeine.',
                'image_url'          => null,
                'is_active'          => true,
            ],
            [
                'name'               => 'Daily Collagen Blend',
                'category_code'      => 'Supplement',
                'suggested_srp'      => 210.00,
                'description'        => 'Powdered supplement, unflavored base',
                'shelf_life'         => '24 Months',
                'storage_conditions' => 'Cool, dry place away from sunlight',
                'lead_time_days'     => 10,
                'formulation_notes'  => 'Hydrolyzed bovine collagen peptides type I & III.',
                'image_url'          => null,
                'is_active'          => true,
            ],
            [
                'name'               => 'Matte Lip Balm',
                'category_code'      => 'Cosmetic',
                'suggested_srp'      => 65.00,
                'description'        => 'Tinted base, tube packaging',
                'shelf_life'         => '18 Months',
                'storage_conditions' => 'Room temperature (below 30°C)',
                'lead_time_days'     => 7,
                'formulation_notes'  => 'Beeswax and shea butter hydrating base.',
                'image_url'          => null,
                'is_active'          => false,
            ],
            [
                'name'               => 'Sparkling Botanical Water',
                'category_code'      => 'Beverage',
                'suggested_srp'      => 55.00,
                'description'        => '250ml carbonated base',
                'shelf_life'         => '12 Months',
                'storage_conditions' => 'Keep cool',
                'lead_time_days'     => 14,
                'formulation_notes'  => 'Infused sparkling botanical base, zero sugar.',
                'image_url'          => null,
                'is_active'          => true,
            ],
            [
                'name'               => 'Premium Coffee Protein',
                'category_code'      => 'Supplement',
                'suggested_srp'      => 180.00,
                'description'        => 'High-quality protein powder infused with premium coffee extract',
                'shelf_life'         => '24 Months',
                'storage_conditions' => 'Cool dry place',
                'lead_time_days'     => 14,
                'formulation_notes'  => 'Whey protein isolate with 100% Arabica instant coffee powder.',
                'image_url'          => null,
                'is_active'          => true,
            ],
            [
                'name'               => 'Organic Coffee Energy',
                'category_code'      => 'Beverage',
                'suggested_srp'      => 95.00,
                'description'        => 'Organic coffee-based energy supplement made from 100% natural ingredients',
                'shelf_life'         => '12 Months',
                'storage_conditions' => 'Keep chilled',
                'lead_time_days'     => 10,
                'formulation_notes'  => 'Cold extracted organic robusta and guarana extract.',
                'image_url'          => null,
                'is_active'          => true,
            ],
        ];

        foreach ($catalogProducts as $cp) {
            $type = \App\Models\ProductType::updateOrCreate(
                ['name' => $cp['name']],
                $cp
            );

            \App\Models\ProductVariant::firstOrCreate(
                ['product_type_id' => $type->product_type_id, 'name' => 'Standard'],
                ['is_available' => true, 'is_published' => true]
            );
        }
    }
}

