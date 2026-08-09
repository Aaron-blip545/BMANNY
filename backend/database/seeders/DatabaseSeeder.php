<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Roles & Staff Users
        User::create([
            'full_name' => 'Admin User',
            'email' => 'admin123@gmail.com',
            'password_hash' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        User::create([
            'full_name' => 'Sales Agent',
            'email' => 'sales123@gmail.com',
            'password_hash' => Hash::make('password123'),
            'role' => 'sales_agent',
        ]);

        User::create([
            'full_name' => 'Order Manager',
            'email' => 'manager123@gmail.com',
            'password_hash' => Hash::make('password123'),
            'role' => 'order_manager',
        ]);

        User::create([
            'full_name' => 'Test Client',
            'email' => 'client123@gmail.com',
            'password_hash' => Hash::make('password123'),
            'role' => 'customer',
        ]);

        // 2. Seed Product Categories
        $coffeeCategory = Category::create([
            'category_name' => 'Coffee & Beverages',
            'description' => 'Custom formulated health and wellness beverages',
        ]);

        $supplementsCategory = Category::create([
            'category_name' => 'Supplements & Capsules',
            'description' => 'Nutraceuticals and beauty supplements',
        ]);

        // 3. Seed BMANNY Products
        Product::create([
            'category_id' => $coffeeCategory->category_id,
            'sku' => 'BM-COF-001',
            'name' => 'Herbal Slimming Coffee Mix',
            'description' => 'Premium 10-in-1 herbal coffee blend for rebranding.',
            'price' => 150.00,
            'stock_quantity' => 5000,
        ]);

        Product::create([
            'category_id' => $supplementsCategory->category_id,
            'sku' => 'BM-CAP-001',
            'name' => 'Glutathione Whitening Capsules',
            'description' => '500mg L-Glutathione capsules in customizable bottles.',
            'price' => 350.00,
            'stock_quantity' => 2500,
        ]);
    }
}