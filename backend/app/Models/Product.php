<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    // 1. Tell Laravel about the custom ID
    protected $primaryKey = 'product_id';

    // 2. Protect the inventory data
    protected $fillable = [
        'category_id',
        'sku',
        'name',
        'description',
        'price',
        'stock_quantity',
        'product_image',
    ];

    // 3. Link this product back to its parent category
    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id', 'category_id');
    }
}