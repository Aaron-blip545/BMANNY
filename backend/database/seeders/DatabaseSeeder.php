<?php
 
namespace Database\Seeders;
 
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
 
class UserSeeder extends Seeder
{
    public function run(): void
    {
        // firstOrCreate means running this seeder again later won't errorx
        // on a duplicate email or create a second copy.
        User::firstOrCreate(
            ['email' => 'admin@bmanny.com'],
            [
                'full_name' => 'Admin User',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'is_active' => true,
            ]
        );
 
        $this->command->info('Admin account ready: admin@bmanny.com / password123');
    }
}
 