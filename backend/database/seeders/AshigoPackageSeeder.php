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
            ['slug'=>'starter','name'=>'Starter Package','description'=>'A practical first run for a new brand.','minimum_quantity'=>100,'packaging_details'=>'Stand-up pouch, 12 × 20 cm','label_details'=>'Sticker label','net_weight'=>'120 g','lead_time_text'=>'10–15 business days','initial_price'=>7900,'payment_terms'=>'50% before production; 50% balance before pickup','public_ingredients'=>$baseIngredients,'cost_breakdown'=>[['label'=>'Package price per pouch','amount'=>79,'quantity'=>'100 pouches'],['label'=>'Initial payment before production','amount'=>7900,'quantity'=>'50% of total order']],'package_notes'=>'FOB: CDO. VAT exclusive.','allows_ingredient_request'=>false],
            ['slug'=>'gold','name'=>'Gold Package','description'=>'For brands ready for full-color pouch packaging.','minimum_quantity'=>5000,'packaging_details'=>'Stand-up pouch, 12 × 20 cm','label_details'=>'Full-color pouch print','net_weight'=>'120 g','lead_time_text'=>'40–60 days after layout approval','initial_price'=>99900,'payment_terms'=>'50% before production; 50% balance before pickup.','public_ingredients'=>$baseIngredients.' Plus up to 6 herbal ingredients, subject to Product Control review.','cost_breakdown'=>[['label'=>'Packaging cost','amount'=>50000,'quantity'=>'₱10 × 5,000 pouches'],['label'=>'Cylinder cost','amount'=>22400,'quantity'=>'One-time payment'],['label'=>'Production payment','amount'=>27500,'quantity'=>'₱55 × 500 pouches']],'package_notes'=>'Packaging is purchased first. Remaining packaging may be stored for the next batch order, subject to the stated storage period. FOB: CDO. VAT exclusive.','allows_ingredient_request'=>true],
            ['slug'=>'elite','name'=>'Elite Package','description'=>'For larger production requirements and premium presentation.','minimum_quantity'=>10000,'packaging_details'=>'Stand-up pouch, 12 × 20 cm','label_details'=>'Full-color pouch print','net_weight'=>'120 g','lead_time_text'=>'40–60 days after layout approval','initial_price'=>142400,'payment_terms'=>'50% before production; 50% balance before pickup.','public_ingredients'=>$baseIngredients.' Plus up to 8 herbal ingredients, subject to Product Control review.','cost_breakdown'=>[['label'=>'Packaging cost','amount'=>100000,'quantity'=>'₱10 × 10,000 pouches'],['label'=>'Cylinder cost','amount'=>22400,'quantity'=>'One-time payment'],['label'=>'Production payment','amount'=>20000,'quantity'=>'₱50 × 400 pouches']],'package_notes'=>'Packaging is purchased first. Remaining packaging may be stored for the next batch order, subject to the stated storage period. FOB: CDO. VAT exclusive.','allows_ingredient_request'=>true],
        ];

        foreach ($packages as $data) {
            ProductPackage::updateOrCreate(['product_type_id'=>$product->product_type_id,'slug'=>$data['slug']], $data);
        }
    }
}
