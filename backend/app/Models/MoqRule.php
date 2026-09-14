<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MoqRule extends Model
{
    use HasFactory, SoftDeletes;

    protected $primaryKey = 'moq_rule_id';

    protected $fillable = [
        'variant_id',
        'min_quantity',
        'effective_date',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'min_quantity'   => 'integer',
        'effective_date' => 'date',
    ];

    // The variant this MOQ applies to
    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id', 'variant_id');
    }

    // The user (Product Controller) who set this MOQ
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by', 'user_id');
    }

    // Scope: current active rule (latest effective_date <= today)
    public function scopeCurrent($query)
    {
        return $query->where('effective_date', '<=', now()->toDateString())
            ->orderByDesc('effective_date')
            ->limit(1);
    }
}
