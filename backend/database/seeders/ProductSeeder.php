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
        ];

        // Remove legacy Packaging Types products & category from raw materials inventory
        $packagingCat = Category::whereRaw('LOWER(name) = ?', ['packaging types'])->first();
        if ($packagingCat) {
            Product::where('category_id', $packagingCat->category_id)->delete();
            $packagingCat->delete();
        }
        Product::where('sku', 'like', 'PKG-%')->delete();

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
        ];

        foreach ($materials as $m) {
            Product::updateOrCreate(
                ['sku' => $m['sku']],
                $m
            );
        }

        // Finished-product catalog entries (AshigoPlus) are maintained by RawMaterialsAndBomSeeder & AshigoPackageSeeder.

        // Remove generic demo records that do not have official BMANNY images.
        \App\Models\ProductType::whereIn('name', [
            'Daily Collagen Blend',
            'Matte Lip Balm',
            'Sparkling Botanical Water',
        ])->delete();
    }
}

