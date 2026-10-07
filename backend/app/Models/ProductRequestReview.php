<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductRequestReview extends Model
{
    use HasFactory;

    protected $primaryKey = 'product_request_review_id';

    protected $fillable = [
        'inquiry_id', 'requested_by', 'product_type_id', 'requested_variant_id',
        'suggested_variant_id', 'suggested_packaging_id', 'status', 'request_notes',
        'response_notes', 'reviewed_by', 'reviewed_at',
    ];

    protected $casts = ['reviewed_at' => 'datetime'];

    public function inquiry() { return $this->belongsTo(Inquiry::class, 'inquiry_id', 'inquiry_id'); }
    public function productType() { return $this->belongsTo(ProductType::class, 'product_type_id', 'product_type_id'); }
    public function requestedVariant() { return $this->belongsTo(ProductVariant::class, 'requested_variant_id', 'variant_id'); }
    public function suggestedVariant() { return $this->belongsTo(ProductVariant::class, 'suggested_variant_id', 'variant_id'); }
    public function suggestedPackaging() { return $this->belongsTo(PackagingOption::class, 'suggested_packaging_id', 'packaging_id'); }
    public function requester() { return $this->belongsTo(User::class, 'requested_by', 'user_id'); }
    public function reviewer() { return $this->belongsTo(User::class, 'reviewed_by', 'user_id'); }
}
