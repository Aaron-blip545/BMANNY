<?php

namespace Database\Seeders;

use App\Models\ProductType;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;

class BmannyCatalogSeeder extends Seeder
{
    /**
     * Public BMANNY rebrandable product families.
     * Prices remain zero because every toll-manufacturing order is quoted
     * according to its formulation, packaging, MOQ, and customization.
     */
    public function run(): void
    {
        $products = [
            [
                'name' => 'Coffee Mix',
                'category_code' => 'Health & Wellness',
                'description' => 'Antioxidant-packed coffee base for total body wellness and rebranding.',
                'formulation_notes' => 'Available for custom branding and packaging quotation.',
                'image_url' => 'https://bmanny.com/wp-content/uploads/2026/03/purple-corn-rebrand.png',
            ],
            [
                'name' => 'Herbal Capsule',
                'category_code' => 'Supplements & Wellbeing',
                'description' => 'Herbal food supplement capsule base for wellness-focused brands.',
                'formulation_notes' => 'Available for custom branding and packaging quotation.',
                'image_url' => 'https://bmanny.com/wp-content/uploads/2026/03/adult-brand.png',
            ],
            [
                'name' => 'Liniment Oil',
                'category_code' => 'Beauty & Personal Care',
                'description' => 'Soothing herbal liniment oil formulation for muscle-relief product brands.',
                'formulation_notes' => 'Available for custom branding and packaging quotation.',
                'image_url' => 'https://bmanny.com/wp-content/uploads/2026/03/ashigo-max.png',
            ],
            [
                'name' => 'Juice Drink',
                'category_code' => 'Detox & Nutrition',
                'description' => 'Detox and nutrition juice drink base for private-label product lines.',
                'formulation_notes' => 'Available for custom branding and packaging quotation.',
                'image_url' => 'https://bmanny.com/wp-content/uploads/2026/02/Ashigo-Clenz.png',
            ],
            [
                'name' => 'Soya Drink',
                'category_code' => 'Detox & Nutrition',
                'description' => 'Soya-based drink for immune-system and detox-support product lines.',
                'formulation_notes' => 'Available for custom branding and packaging quotation.',
                'image_url' => 'https://bmanny.com/wp-content/uploads/2026/03/soya-zoya.png',
            ],
        ];

        foreach ($products as $productData) {
            $product = ProductType::updateOrCreate(
                ['name' => $productData['name']],
                [
                    ...$productData,
                    'suggested_srp' => 0,
                    'shelf_life' => 'To be confirmed during quotation',
                    'storage_conditions' => 'To be confirmed during quotation',
                    'lead_time_days' => 14,
                    'is_active' => true,
                ],
            );

            $variant = ProductVariant::firstOrCreate(
                ['product_type_id' => $product->product_type_id, 'name' => 'Standard'],
                ['is_available' => true, 'is_published' => true],
            );

            if (! $variant->sku) {
                $variant->update(['sku' => sprintf('BMN-%04d-%04d', $product->product_type_id, $variant->variant_id)]);
            }
        }
    }
}
