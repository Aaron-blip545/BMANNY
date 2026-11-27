<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

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
        'initial_payment_amount',
        'balance_payment_amount',
        'item_details',
        'product_specification',
        'status',
        'valid_until',
        'payment_method',
        'payment_proof_path',
        'payment_submitted_at',
        'payment_rejection_reason',
    ];

    protected $casts = [
        'initial_payment_amount' => 'decimal:2',
        'balance_payment_amount' => 'decimal:2',
        'valid_until'            => 'date:Y-m-d',
        'payment_submitted_at'   => 'datetime',
        'product_specification'  => 'array',
    ];

    protected $appends = [
        'payment_proof_url',
        'is_expired',
    ];

    public function inquiry()
    {
        return $this->belongsTo(Inquiry::class, 'inquiry_id', 'inquiry_id');
    }

    public function order()
    {
        return $this->hasOne(Order::class, 'quotation_id', 'quotation_id');
    }

    public function getPaymentProofUrlAttribute(): ?string
    {
        return $this->payment_proof_path
            ? Storage::disk('public')->url($this->payment_proof_path)
            : null;
    }

    public function getIsExpiredAttribute(): bool
    {
        if ($this->status === 'expired') {
            return true;
        }
        if ($this->status !== 'sent' || $this->payment_submitted_at) {
            return false;
        }
        if (! $this->valid_until) {
            return false;
        }

        return $this->valid_until->copy()->endOfDay()->isPast();
    }

    /**
     * Mark any past-due unpaid 'sent' quotations as 'expired'.
     */
    public static function expireOverdue(): int
    {
        $overdue = static::with('inquiry')
            ->where('status', 'sent')
            ->whereNull('payment_submitted_at')
            ->whereNotNull('valid_until')
            ->whereDate('valid_until', '<', now()->toDateString())
            ->get();

        foreach ($overdue as $quote) {
            $quote->update(['status' => 'expired']);
            if ($quote->inquiry && $quote->inquiry->status === 'quotation_sent') {
                $prev = $quote->inquiry->status;
                $quote->inquiry->update([
                    'status'         => 'follow_up',
                    'status_remarks' => "Quotation #{$quote->quotation_id} expired on {$quote->valid_until->format('Y-m-d')}. Follow up or issue a revised quotation.",
                ]);
                $quote->inquiry->recordStatusChange(
                    $prev,
                    'follow_up',
                    'Quotation Expired',
                    "Quotation #{$quote->quotation_id} expired past its validity date ({$quote->valid_until->format('Y-m-d')})."
                );
                if ($quote->inquiry->client_id) {
                    \App\Services\ClientRiskService::evaluateClient((int) $quote->inquiry->client_id);
                }
            }
        }

        return $overdue->count();
    }
}
