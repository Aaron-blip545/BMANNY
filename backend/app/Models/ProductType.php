<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductType extends Model
{
    use HasFactory;

    protected $primaryKey = 'product_type_id';

    protected $fillable = [
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // A product type has many variants (including soft-deleted ones)
    public function variants()
    {
        return $this->hasMany(ProductVariant::class, 'product_type_id', 'product_type_id');
    }

    // Only non-deleted variants
    public function activeVariants()
    {
        return $this->hasMany(ProductVariant::class, 'product_type_id', 'product_type_id')
            ->whereNull('deleted_at');
    }

    // Scope: only active types
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
