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
        'item_details',
        'status',
        'valid_until',
        'payment_method',
        'payment_proof_path',
        'payment_submitted_at',
    ];

    protected $casts = [
        'payment_submitted_at' => 'datetime',
    ];

    // Always include the resolved proof-of-payment URL when this model is
    // serialized to JSON (mobile API responses, Inertia props, etc.) so
    // consumers never have to know about the underlying storage disk.
    protected $appends = [
        'payment_proof_url',
    ];

    public function inquiry()
    {
        return $this->belongsTo(Inquiry::class, 'inquiry_id', 'inquiry_id');
    }

    public function getPaymentProofUrlAttribute(): ?string
    {
        return $this->payment_proof_path
            ? Storage::disk('public')->url($this->payment_proof_path)
            : null;
    }
}
