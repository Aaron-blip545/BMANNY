<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductPackage;
use App\Models\ProductRecipe;
use App\Models\ProductType;
use Illuminate\Database\Seeder;

class SampleCategoryProductsSeeder extends Seeder
{
    public function run(): void
    {
        // Deactivate blank/test duplicates so each category displays 1 clean product
        ProductType::whereIn('product_type_id', [1, 5, 7])->update(['is_active' => false]);

        $matAcai = Product::where('sku', 'R-ACAI-EXT')->first() ?? Product::where('stock_quantity', '>', 5)->first();
        $matBottle = Product::where('sku', 'PKG-BTL-004')->first();
        $matPouch = Product::where('sku', 'PKG-PCH-001')->first();
        $matMatcha = Product::where('sku', 'FLV-MAT-008')->first();
        $matStrawberry = Product::where('sku', 'FLV-STR-003')->first();
        $matOriginal = Product::where('sku', 'FLV-ORI-007')->first();

        $samples = [
            [
                'id'           => 2,
                'name'         => 'Herbal Wellness Capsule',
                'code'         => 'FP-CAPS-002',
                'category'     => 'Supplements & Wellbeing',
                'srp'          => 380.00,
                'net_weight'   => '30 capsules (500 mg)',
                'shelf_life'   => '24 Months',
                'packaging'    => 'HDPE Supplement Bottle (30 caps)',
                'label'        => 'Waterproof wrap-around sticker label',
                'description'  => 'Sample herbal dietary supplement capsule formulated with natural botanical extracts for daily immunity and wellness support. Ideal for private-label health brands.',
                'ingredients'  => 'Botanical herbal extract blend in vegetable capsules (sample formulation).',
                'starter_unit' => 85,
                'gold_total'   => 95000,
                'elite_total'  => 138000,
                'recipes'      => array_filter([
                    $matAcai ? ['product' => $matAcai, 'qty' => 0.015] : null,
                    $matBottle ? ['product' => $matBottle, 'qty' => 1.0] : null,
                ]),
            ],
            [
                'id'           => 3,
                'name'         => 'Soothing Herbal Liniment Oil',
                'code'         => 'FP-OIL-003',
                'category'     => 'Beauty & Personal Care',
                'srp'          => 250.00,
                'net_weight'   => '60 mL',
                'shelf_life'   => '24 Months',
                'packaging'    => 'Amber Glass / PET Bottle, 60 mL',
                'label'        => 'Oil-resistant glossy sticker label',
                'description'  => 'Sample topical herbal liniment oil crafted for fast-absorbing muscle relaxation and soothing aromatherapy. Ready for custom brand labeling.',
                'ingredients'  => 'Herbal essential oil blend with soothing menthol and botanical carrier oil (sample formulation).',
                'starter_unit' => 65,
                'gold_total'   => 82000,
                'elite_total'  => 124000,
                'recipes'      => array_filter([
                    $matOriginal ? ['product' => $matOriginal, 'qty' => 0.06] : null,
                    $matBottle ? ['product' => $matBottle, 'qty' => 1.0] : null,
                ]),
            ],
            [
                'id'           => 4,
                'name'         => 'Herbal Detox Juice Drink',
                'code'         => 'FP-JUICE-004',
                'category'     => 'Detox & Nutrition',
                'srp'          => 320.00,
                'net_weight'   => '120 g (10 sachets)',
                'shelf_life'   => '12 Months',
                'packaging'    => 'Stand-up pouch, 12 × 20 cm',
                'label'        => 'Matte laminated sticker / full-color pouch',
                'description'  => 'Sample refreshing herbal detox powdered juice drink blend enriched with fruit and botanical extracts for daily cleansing and hydration.',
                'ingredients'  => 'Botanical detox blend with berry and green tea extracts (sample formulation).',
                'starter_unit' => 75,
                'gold_total'   => 92000,
                'elite_total'  => 135000,
                'recipes'      => array_filter([
                    $matStrawberry ? ['product' => $matStrawberry, 'qty' => 0.012] : null,
                    $matMatcha ? ['product' => $matMatcha, 'qty' => 0.005] : null,
                    $matPouch ? ['product' => $matPouch, 'qty' => 1.0] : null,
                ]),
            ],
        ];

        foreach ($samples as $item) {
            $pt = ProductType::find($item['id']);
            if (! $pt) {
                $pt = new ProductType();
            }

            $pt->fill([
                'name'                    => $item['name'],
                'product_code'            => $item['code'],
                'category_code'           => $item['category'],
                'suggested_srp'           => $item['srp'],
                'net_weight'              => $item['net_weight'],
                'shelf_life'              => $item['shelf_life'],
                'storage_conditions'      => 'Store in a cool, dry place away from direct sunlight.',
                'lead_time_days'          => 14,
                'packaging_specification' => $item['packaging'],
                'label_specification'     => $item['label'],
                'description'             => $item['description'],
                'is_active'               => true,
            ]);
            $pt->save();

            // Seed Starter / Gold / Elite packages
            $starterPrice = $item['starter_unit'] * 100;
            $packages = [
                [
                    'slug'                      => 'starter',
                    'name'                      => 'Starter Package',
                    'description'               => 'A practical first run for a new brand.',
                    'minimum_quantity'          => 100,
                    'packaging_details'         => $item['packaging'],
                    'label_details'             => 'Sticker label',
                    'net_weight'                => $item['net_weight'],
                    'lead_time_text'            => '10–15 business days',
                    'initial_price'             => $starterPrice,
                    'payment_terms'             => '50% before production; 50% balance before pickup.',
                    'public_ingredients'        => $item['ingredients'],
                    'cost_breakdown'            => [
                        ['label' => 'Package price per unit', 'amount' => $item['starter_unit'], 'quantity' => '100 units'],
                        ['label' => 'Initial batch total', 'amount' => $starterPrice, 'quantity' => '50% down payment to start'],
                    ],
                    'package_notes'             => 'Sample catalog package for demonstration. FOB: CDO. VAT exclusive.',
                    'allows_ingredient_request' => false,
                    'is_active'                 => true,
                ],
                [
                    'slug'                      => 'gold',
                    'name'                      => 'Gold Package',
                    'description'               => 'For growing brands ready for custom full-color packaging.',
                    'minimum_quantity'          => 5000,
                    'packaging_details'         => $item['packaging'],
                    'label_details'             => 'Full-color custom print',
                    'net_weight'                => $item['net_weight'],
                    'lead_time_text'            => '40–60 days after layout approval',
                    'initial_price'             => $item['gold_total'],
                    'payment_terms'             => '50% before production; 50% balance before pickup.',
                    'public_ingredients'        => $item['ingredients'] . ' Plus up to 6 herbal add-ons, subject to Product Control review.',
                    'cost_breakdown'            => [
                        ['label' => 'Packaging & print setup', 'amount' => round($item['gold_total'] * 0.7), 'quantity' => '5,000 units MOQ'],
                        ['label' => 'Initial production batch', 'amount' => round($item['gold_total'] * 0.3), 'quantity' => 'First run'],
                    ],
                    'package_notes'             => 'Remaining packaging may be stored for reorder batches. FOB: CDO. VAT exclusive.',
                    'allows_ingredient_request' => true,
                    'is_active'                 => true,
                ],
                [
                    'slug'                      => 'elite',
                    'name'                      => 'Elite Package',
                    'description'               => 'For high-volume brands with premium custom formulation options.',
                    'minimum_quantity'          => 10000,
                    'packaging_details'         => $item['packaging'],
                    'label_details'             => 'Premium full-color custom print',
                    'net_weight'                => $item['net_weight'],
                    'lead_time_text'            => '40–60 days after layout approval',
                    'initial_price'             => $item['elite_total'],
                    'payment_terms'             => '50% before production; 50% balance before pickup.',
                    'public_ingredients'        => $item['ingredients'] . ' Plus up to 8 herbal add-ons, subject to Product Control review.',
                    'cost_breakdown'            => [
                        ['label' => 'Packaging & print setup', 'amount' => round($item['elite_total'] * 0.72), 'quantity' => '10,000 units MOQ'],
                        ['label' => 'Initial production batch', 'amount' => round($item['elite_total'] * 0.28), 'quantity' => 'First run'],
                    ],
                    'package_notes'             => 'Remaining packaging may be stored for reorder batches. FOB: CDO. VAT exclusive.',
                    'allows_ingredient_request' => true,
                    'is_active'                 => true,
                ],
            ];

            foreach ($packages as $pkgData) {
                ProductPackage::updateOrCreate(
                    ['product_type_id' => $pt->product_type_id, 'slug' => $pkgData['slug']],
                    $pkgData
                );
            }

            // Seed sample base BOM recipes if none exist yet
            if (ProductRecipe::where('product_type_id', $pt->product_type_id)->whereNull('package_slug')->count() === 0) {
                foreach ($item['recipes'] as $rec) {
                    $mat = $rec['product'];
                    $rate = (float) $mat->price;
                    $qty = (float) $rec['qty'];
                    ProductRecipe::create([
                        'product_type_id'   => $pt->product_type_id,
                        'product_id'        => $mat->product_id,
                        'package_slug'      => null,
                        'quantity_per_unit' => $qty,
                        'rate'              => $rate,
                        'amount'            => round($qty * $rate, 2),
                        'notes'             => 'Sample BOM recipe for demonstration',
                    ]);
                }
            }
        }
    }
}
