<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Category; // 1. Pull in the model you just built!

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        // 2. Create our first categories using the Model
        Category::create([
            'name' => 'Boxy Crop Tees',
            'description' => 'Structured, minimalist crop fit apparel.'
        ]);

        Category::create([
            'name' => 'Heavyweight Hoodies',
            'description' => 'Thick, durable pullover hoodies.'
        ]);

        Category::create([
            'name' => 'Accessories',
            'description' => 'Caps, bags, and additional items.'
        ]);
    }
}