<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $staffAccounts = [
            ['full_name' => 'Admin', 'email' => 'admin@gmail.com', 'role' => 'admin'],
            ['full_name' => 'Sales Agent', 'email' => 'salesagent@gmail.com', 'role' => 'sales_agent'],
            ['full_name' => 'Product Controller', 'email' => 'productcontroller@gmail.com', 'role' => 'product_controller'],
            ['full_name' => 'Order Manager', 'email' => 'ordermanager@gmail.com', 'role' => 'order_manager'],
        ];

        foreach ($staffAccounts as $account) {
            User::updateOrCreate(
                ['email' => $account['email']],
                [
                    ...$account,
                    'password' => Hash::make('password123'),
                    'is_active' => true,
                ],
            );
        }
    }
}
