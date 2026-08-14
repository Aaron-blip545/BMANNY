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
}
