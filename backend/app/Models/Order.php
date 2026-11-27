<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

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
        'initial_payment_amount',
        'initial_payment_verified_at',
        'balance_payment_amount',
        'balance_payment_method',
        'balance_payment_proof_path',
        'balance_payment_submitted_at',
        'balance_payment_verified_at',
        'status',
        'priority',
        'estimated_completion_date',
        'estimated_delivery_date',
        'production_started_at',
        'packed_at',
        'ready_for_pickup_at',
        'dispatched_at',
        'delivered_at',
        'completed_at',
        // FIXED: these two columns exist on the orders table (added by the
        // 2026_08_18_072454_update_orders_status_and_tracking migration)
        // but were missing here, so any mass-assignment (Order::create(),
        // $order->update()) touching them would have silently been
        // ignored by Eloquent.
        'courier_name',
        'courier_tracking_number',
    ];

    protected $casts = [
        'initial_payment_verified_at' => 'datetime',
        'balance_payment_submitted_at' => 'datetime',
        'balance_payment_verified_at' => 'datetime',
        'estimated_completion_date' => 'date:Y-m-d',
        'estimated_delivery_date' => 'date:Y-m-d',
        'production_started_at' => 'datetime',
        'packed_at' => 'datetime',
        'ready_for_pickup_at' => 'datetime',
        'dispatched_at' => 'datetime',
        'delivered_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    protected $appends = ['balance_payment_proof_url'];

    public function getBalancePaymentProofUrlAttribute(): ?string
    {
        return $this->balance_payment_proof_path
            ? Storage::disk('public')->url($this->balance_payment_proof_path)
            : null;
    }

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

    // 5. Link to OrderItems
    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id', 'order_id');
    }

    // 6. Link to Production Schedules
    public function productionSchedules()
    {
        return $this->hasMany(ProductionSchedule::class, 'order_id', 'order_id')->orderByDesc('schedule_id');
    }

    public function latestProductionSchedule()
    {
        return $this->hasOne(ProductionSchedule::class, 'order_id', 'order_id')->latestOfMany('schedule_id');
    }

    // 7. Link to Delivery Batches
    public function deliveryBatches()
    {
        return $this->hasMany(DeliveryBatch::class, 'order_id', 'order_id')->orderBy('batch_number');
    }
}
