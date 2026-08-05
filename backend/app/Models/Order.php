<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    // 1. Tell Laravel about your custom ID
    protected $primaryKey = 'order_id';

    // 2. Allow these columns to be filled
    protected $fillable = [
        'client_id',
        'quotation_id',
        'internal_tracking_number',
        'total_amount',
        'status',
    ];

    // 3. Link to the BusinessClient model
    public function client()
    {
        return $this->belongsTo(BusinessClient::class, 'client_id', 'client_id');
    }

    // 4. Link to the Quotation model
    public function quotation()
    {
        return $this->belongsTo(Quotation::class, 'quotation_id', 'quotation_id');
    }
}