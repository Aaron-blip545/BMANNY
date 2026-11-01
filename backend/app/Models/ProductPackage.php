<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class ProductPackage extends Model { protected $primaryKey = 'product_package_id'; protected $fillable = ['product_type_id','slug','name','description','minimum_quantity','packaging_details','label_details','net_weight','lead_time_text','initial_price','payment_terms','public_ingredients','cost_breakdown','package_notes','allows_ingredient_request','is_active']; protected $casts = ['initial_price'=>'decimal:2','cost_breakdown'=>'array','allows_ingredient_request'=>'boolean','is_active'=>'boolean']; public function productType(){ return $this->belongsTo(ProductType::class,'product_type_id','product_type_id'); } }
