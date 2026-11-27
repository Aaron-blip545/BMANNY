<?php

namespace Database\Seeders;

use App\Models\ProductPackage;
use App\Models\ProductType;
use Illuminate\Database\Seeder;

class AshigoPackageSeeder extends Seeder
{
    public function run(): void
    {
        $product = ProductType::where('name', 'AshigoPlus Coffee Drink Mix')->first();
        if (! $product) return;

        $baseIngredients = 'Corn coffee with malunggay and mangosteen.';
        $packages = [
            [
                'slug' => 'starter',
                'name' => 'Starter Package',
                'description' => 'A practical first run for a new brand.',
                'minimum_quantity' => 100,
                'packaging_details' => 'Stand-up pouch, 12 × 20 cm',
                'label_details' => 'Sticker label',
                'net_weight' => '120 g',
                'lead_time_text' => '10–15 business days',
                'initial_price' => 7900,
                'before_production_amount' => 3950,
                'before_production_label' => 'Before production (50%)',
                'before_pickup_amount' => 3950,
                'before_pickup_label' => 'Before pickup (50%)',
                'payment_terms' => '50% before production; 50% balance before pickup',
                'public_ingredients' => $baseIngredients,
                'cost_breakdown' => [
                    ['label' => 'Package price per pouch', 'amount' => 79, 'quantity' => '100–500 pouches (selectable MOQ)'],
                ],
                'package_notes' => 'FOB: CDO. VAT exclusive.',
                'allows_ingredient_request' => false,
            ],
            [
                'slug' => 'gold',
                'name' => 'Gold Package',
                'description' => 'For brands ready for full-color pouch packaging.',
                'minimum_quantity' => 5000,
                'packaging_details' => 'Stand-up pouch, 12 × 20 cm',
                'label_details' => 'Full-color pouch print',
                'net_weight' => '120 g',
                'lead_time_text' => '40–60 days after layout approval',
                'initial_price' => 80650,
                'before_production_amount' => 72400,
                'before_production_label' => 'Before production (Packaging + Cylinder)',
                'before_pickup_amount' => 8250,
                'before_pickup_label' => 'Before pickup (Production: 150 pouches)',
                'payment_terms' => 'Before production: Packaging (₱50,000) + Cylinder (₱22,400) paid upon ordering; Before pickup: Production payment per batch (MOQ 150 pouches × ₱55 = ₱8,250).',
                'public_ingredients' => $baseIngredients.' Plus up to 6 herbal ingredients, subject to Product Control review.',
                'cost_breakdown' => [
                    ['label' => 'Packaging cost', 'amount' => 50000, 'quantity' => '₱10 × 5,000 pouches (paid upon ordering)'],
                    ['label' => 'Cylinder cost', 'amount' => 22400, 'quantity' => 'One-time payment (paid upon ordering)'],
                    ['label' => 'Production payment', 'amount' => 8250, 'quantity' => '₱55 × 150 pouches per batch'],
                ],
                'package_notes' => 'Packaging is compulsory to be purchased first. Finished products can be produced with MOQ 150 pouches per batch. Remaining packaging will be kept on standby for the next batch order for a maximum storage period of two years; unused packaging after two years may be disposed of. FOB: CDO. VAT exclusive.',
                'allows_ingredient_request' => true,
            ],
            [
                'slug' => 'elite',
                'name' => 'Elite Package',
                'description' => 'For larger production requirements and premium presentation.',
                'minimum_quantity' => 10000,
                'packaging_details' => 'Stand-up pouch, 12 × 20 cm',
                'label_details' => 'Full-color pouch print',
                'net_weight' => '120 g',
                'lead_time_text' => '40–60 days after layout approval',
                'initial_price' => 139900,
                'before_production_amount' => 122400,
                'before_production_label' => 'Before production (Packaging + Cylinder)',
                'before_pickup_amount' => 17500,
                'before_pickup_label' => 'Before pickup (Production: 350 pouches)',
                'payment_terms' => 'Before production: Packaging (₱100,000) + Cylinder (₱22,400) paid upon ordering; Before pickup: Production payment per batch (MOQ 350 pouches × ₱50 = ₱17,500).',
                'public_ingredients' => $baseIngredients.' Plus up to 8 herbal ingredients, subject to Product Control review.',
                'cost_breakdown' => [
                    ['label' => 'Packaging cost', 'amount' => 100000, 'quantity' => '₱10 × 10,000 pouches (paid upon ordering)'],
                    ['label' => 'Cylinder cost', 'amount' => 22400, 'quantity' => 'One-time payment (paid upon ordering)'],
                    ['label' => 'Production payment', 'amount' => 17500, 'quantity' => '₱50 × 350 pouches per batch'],
                ],
                'package_notes' => 'Packaging is compulsory to be purchased first. Finished products can be produced with MOQ 350 pouches per batch. Remaining packaging will be kept on standby for the next batch order for a maximum storage period of two years; unused packaging after two years may be disposed of. FOB: CDO. VAT exclusive.',
                'allows_ingredient_request' => true,
            ],
        ];

        foreach ($packages as $data) {
            ProductPackage::updateOrCreate(['product_type_id'=>$product->product_type_id,'slug'=>$data['slug']], $data);
        }
    }
}
