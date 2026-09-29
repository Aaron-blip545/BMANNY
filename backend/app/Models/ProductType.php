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
        'category_code',
        'description',
        'shelf_life',
        'storage_conditions',
        'lead_time_days',
        'suggested_srp',
        'formulation_notes',
        'image_url',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'suggested_srp' => 'decimal:2',
        'lead_time_days' => 'integer',
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
