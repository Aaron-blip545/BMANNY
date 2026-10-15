<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductRecipe extends Model
{
    use HasFactory;

    protected $table = 'product_recipes';
    protected $primaryKey = 'recipe_id';

    protected $fillable = [
        'product_type_id',
        'product_id',
        'quantity_per_unit',
        'rate',
        'amount',
        'notes',
    ];

    protected $casts = [
        'quantity_per_unit' => 'decimal:6',
        'rate' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    /**
     * Parent Finished Product / Composite Item.
     */
    public function productType()
    {
        return $this->belongsTo(ProductType::class, 'product_type_id', 'product_type_id');
    }

    /**
     * Associated Raw Material (from products table).
     */
    public function rawMaterial()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }
}
