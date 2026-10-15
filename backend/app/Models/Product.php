<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $primaryKey = 'product_id';

    protected $fillable = [
        'category_id',
        'sku',
        'name',
        'description',
        'price',
        'stock_quantity',
        'reorder_level',
        'unit_of_measure',
        'product_image',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock_quantity' => 'float',
        'reorder_level' => 'float',
    ];

    /**
     * Category relation
     */
    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id', 'category_id');
    }

    /**
     * BOM Recipe entries where this raw material is used
     */
    public function recipes()
    {
        return $this->hasMany(ProductRecipe::class, 'product_id', 'product_id');
    }

    /**
     * Finished products that use this raw material
     */
    public function finishedProducts()
    {
        return $this->belongsToMany(ProductType::class, 'product_recipes', 'product_id', 'product_type_id');
    }

    /**
     * Determine stock alert status
     */
    public function getStockStatusAttribute(): string
    {
        $stock = (float) $this->stock_quantity;
        $reorder = (float) $this->reorder_level;

        if ($stock <= 0) {
            return 'out_of_stock';
        }
        if ($reorder > 0 && $stock <= $reorder) {
            return 'reorder';
        }
        if ($stock <= 10) {
            return 'low_stock';
        }
        return 'in_stock';
    }
}