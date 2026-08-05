<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inquiry extends Model
{
   // An Inquiry can have multiple customization requests (e.g., front logo, back print)
    public function customizations()
    {
        return $this->hasMany(InquiryCustomization::class, 'inquiry_id', 'inquiry_id');
    }
}
