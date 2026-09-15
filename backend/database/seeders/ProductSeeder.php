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
            'Container Materials' => 'Container material types including food-grade plastics, glass, metals, and eco-friendly options.',
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

            // ── Container Materials ────────────────────────────────────────────
            [
                'name'           => 'Plastic',
                'sku'            => 'CNT-PLS-001',
                'category_id'    => $categoryModels['Container Materials']->category_id,
                'price'          => 10.00,
                'stock_quantity' => 500,
                'product_image'  => null,
                'description'    => null,
            ],
            [
                'name'           => 'Glass',
                'sku'            => 'CNT-GLS-002',
                'category_id'    => $categoryModels['Container Materials']->category_id,
                'price'          => 22.00,
                'stock_quantity' => 200,
                'product_image'  => null,
                'description'    => null,
            ],
            [
                'name'           => 'Metal',
                'sku'            => 'CNT-MTL-003',
                'category_id'    => $categoryModels['Container Materials']->category_id,
                'price'          => 26.00,
                'stock_quantity' => 150,
                'product_image'  => null,
                'description'    => null,
            ],
            [
                'name'           => 'Paper',
                'sku'            => 'CNT-PPR-004',
                'category_id'    => $categoryModels['Container Materials']->category_id,
                'price'          => 12.00,
                'stock_quantity' => 300,
                'product_image'  => null,
                'description'    => null,
            ],
            [
                'name'           => 'Aluminum',
                'sku'            => 'CNT-ALU-005',
                'category_id'    => $categoryModels['Container Materials']->category_id,
                'price'          => 28.00,
                'stock_quantity' => 180,
                'product_image'  => null,
                'description'    => null,
            ],
            [
                'name'           => 'Biodegradable',
                'sku'            => 'CNT-BIO-006',
                'category_id'    => $categoryModels['Container Materials']->category_id,
                'price'          => 32.00,
                'stock_quantity' => 0, // OUT OF STOCK for testing
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
    }
}

