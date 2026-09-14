<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomizationCatalog extends Model
{
    use HasFactory;

    protected $primaryKey = 'customization_id';

    protected $fillable = [
        'name',
        'customization_type',
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
