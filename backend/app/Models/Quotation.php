<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Quotation extends Model
{
    // FIXED: this was an empty stub. Every other model in this project
    // declares its primary key explicitly - Quotation was the odd one out,
    // which is what let QuotationController's whereHas('inquiry') call
    // silently have no relationship to actually use.
    protected $primaryKey = 'quotation_id';

    protected $fillable = [
        'inquiry_id',
        'total_amount',
        'item_details',
        'status',
        'valid_until',
    ];

    public function inquiry()
    {
        return $this->belongsTo(Inquiry::class, 'inquiry_id', 'inquiry_id');
    }
}
