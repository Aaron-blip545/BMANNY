<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductVariant extends Model
{
    use HasFactory, SoftDeletes;

    protected $primaryKey = 'variant_id';

    protected $fillable = [
        'product_type_id',
        'name',
        'size_value',
        'size_unit',
        'container_type',
        'is_available',
        'is_published',
        'notes',
    ];

    protected $casts = [
        'size_value'   => 'float',
        'is_available' => 'boolean',
        'is_published' => 'boolean',
    ];

    // Parent product type
    public function productType()
    {
        return $this->belongsTo(ProductType::class, 'product_type_id', 'product_type_id');
    }

    // All MOQ rules (history)
    public function moqRules()
    {
        return $this->hasMany(MoqRule::class, 'variant_id', 'variant_id')
            ->orderByDesc('effective_date');
    }

    // The single active/current MOQ rule (latest effective date)
    public function currentMoq()
    {
        return $this->hasOne(MoqRule::class, 'variant_id', 'variant_id')
            ->orderByDesc('effective_date')
            ->limit(1);
    }

    // Scope: only available variants
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    // Scope: only published variants (for mobile app)
    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    // Computed label: "500ml PET Bottle"
    public function getFullNameAttribute(): string
    {
        $parts = array_filter([$this->name, $this->container_type]);
        return implode(' ', $parts) ?: $this->name;
    }
}
