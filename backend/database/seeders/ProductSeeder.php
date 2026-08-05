<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Category; // Pulling in Category to link them

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Dynamically find the category we just created
        $boxyCategory = Category::where('name', 'Boxy Crop Tees')->first();

        // 2. Only create products if that category exists
        if ($boxyCategory) {
            Product::create([
                'category_id' => $boxyCategory->category_id,
                'sku' => 'BXC-001-BLK',
                'name' => 'Signature Black Boxy Crop',
                'description' => 'A heavy-cotton, structured minimalist tee.',
                'price' => 850.00,
                'stock_quantity' => 50,
            ]);

            Product::create([
                'category_id' => $boxyCategory->category_id,
                'sku' => 'BXC-002-WHT',
                'name' => 'Essential White Boxy Crop',
                'description' => 'A heavy-cotton, structured white tee.',
                'price' => 850.00,
                'stock_quantity' => 35,
            ]);
        }
    }
}