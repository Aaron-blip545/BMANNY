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
        'batch_lot_number',
        'name',
        'description',
        'price',
        'stock_quantity',
        'reorder_level',
        'max_stock_level',
        'unit_of_measure',
        'expiration_date',
        'restock_lead_days',
        'product_image',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock_quantity' => 'float',
        'reorder_level' => 'float',
        'max_stock_level' => 'float',
        'expiration_date' => 'date:Y-m-d',
        'restock_lead_days' => 'integer',
    ];

    protected $appends = ['stock_status', 'expiry_status', 'days_until_expiry'];

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
        $max = $this->max_stock_level !== null ? (float) $this->max_stock_level : 0.0;

        if ($stock <= 0) {
            return 'out_of_stock';
        }
        if ($reorder > 0 && $stock <= $reorder) {
            return 'reorder';
        }
        if ($max > 0 && $stock > $max) {
            return 'overstock';
        }
        if ($stock <= 10) {
            return 'low_stock';
        }
        return 'in_stock';
    }

    public function getDaysUntilExpiryAttribute(): ?int
    {
        if (! $this->expiration_date) {
            return null;
        }

        return (int) now()->startOfDay()->diffInDays($this->expiration_date->startOfDay(), false);
    }

    public function getExpiryStatusAttribute(): string
    {
        $days = $this->days_until_expiry;
        if ($days === null) {
            return 'none';
        }
        if ($days < 0) {
            return 'expired';
        }
        if ($days <= 30) {
            return 'expiring_soon';
        }
        return 'fresh';
    }
}