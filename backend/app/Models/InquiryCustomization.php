<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InquiryCustomization extends Model
{
    use HasFactory;

    protected $primaryKey = 'customization_id';

    protected $fillable = [
        'inquiry_id',
        'customization_type',
        'packaging_type',
        'packaging_finish',
        'serving_size',
        'formulation_notes',
        'client_notes',
    ];

    public function inquiry()
    {
        return $this->belongsTo(Inquiry::class, 'inquiry_id', 'inquiry_id');
    }
}