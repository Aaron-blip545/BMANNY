<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    // 1. Tell Laravel about the custom ID
    protected $primaryKey = 'category_id';

    // 2. Allow these columns to be filled
    protected $fillable = [
        'name',
        'description',
    ];

    // 3. A category can have multiple products
    public function products()
    {
        return $this->hasMany(Product::class, 'category_id', 'category_id');
    }
}