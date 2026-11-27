<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryBatch extends Model
{
    use HasFactory;

    protected $primaryKey = 'batch_id';

    protected $fillable = [
        'order_id',
        'batch_number',
        'quantity',
        'fulfillment_type',
        'delivery_status',
        'scheduled_date',
        'dispatched_at',
        'delivered_at',
        'courier_name',
        'tracking_number',
        'remarks',
        'updated_by',
    ];

    protected $casts = [
        'batch_number'   => 'integer',
        'quantity'       => 'integer',
        'scheduled_date' => 'date:Y-m-d',
        'dispatched_at'  => 'datetime',
        'delivered_at'   => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id', 'order_id');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by', 'user_id');
    }
}
