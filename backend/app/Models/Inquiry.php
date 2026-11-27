<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Quotation;

class Inquiry extends Model
{
    // FIXED: was missing, like Quotation. Without this, Laravel assumes
    // the primary key column is called "id" - which doesn't exist here
    // (it's "inquiry_id") - breaking Inquiry::find() and route-model-binding
    // if either gets used later.
    protected $primaryKey = 'inquiry_id';

    protected $fillable = [
        'client_id',
        'subject',
        'message',
        'status',
        'inquiry_type',
        'packaging_balance_id',
        'reorder_batch_quantity',
        'source_order_id',
        'cancelled_at',
        'cancellation_reason',
        'lost_reason',
        'lost_at',
        'status_remarks',
        'cancelled_by',
    ];

    protected $casts = [
        'reorder_batch_quantity' => 'integer',
        'cancelled_at'           => 'datetime',
        'lost_at'                => 'datetime',
    ];


    // An Inquiry can have multiple customization requests (e.g., front logo, back print)
    public function customizations()
    {
        return $this->hasMany(InquiryCustomization::class, 'inquiry_id', 'inquiry_id');
    }

    public function client()
    {
        return $this->belongsTo(BusinessClient::class, 'client_id', 'client_id');
    }

    public function quotation()
    {
        return $this->hasOne(Quotation::class, 'inquiry_id', 'inquiry_id');
    }

    public function productRequestReview()
    {
        return $this->hasOne(ProductRequestReview::class, 'inquiry_id', 'inquiry_id');
    }

    public function followUps()
    {
        return $this->hasMany(InquiryFollowup::class, 'inquiry_id', 'inquiry_id')
            ->orderBy('completed_at')
            ->orderBy('follow_up_date');
    }

    public function packagingBalance()
    {
        return $this->belongsTo(ClientPackagingBalance::class, 'packaging_balance_id', 'balance_id');
    }

    public function sourceOrder()
    {
        return $this->belongsTo(Order::class, 'source_order_id', 'order_id');
    }

    public function statusLogs()
    {
        return $this->hasMany(InquiryStatusLog::class, 'inquiry_id', 'inquiry_id')
            ->orderByDesc('created_at')
            ->orderByDesc('log_id');
    }

    public function cancelledByUser()
    {
        return $this->belongsTo(User::class, 'cancelled_by', 'user_id');
    }

    public function recordStatusChange(?string $from, string $to, ?string $reason = null, ?string $remarks = null, ?int $actorId = null): InquiryStatusLog
    {
        return InquiryStatusLog::create([
            'inquiry_id'  => $this->inquiry_id,
            'from_status' => $from,
            'to_status'   => $to,
            'reason'      => $reason,
            'remarks'     => $remarks,
            'changed_by'  => $actorId,
        ]);
    }
}
