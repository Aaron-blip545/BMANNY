<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PackagingOption extends Model
{
    use HasFactory;

    protected $primaryKey = 'packaging_id';

    protected $fillable = [
        'name',
        'description',
        'is_available',
    ];

    protected $casts = [
        'is_available' => 'boolean',
    ];

    // Scope: only available options
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }
}
