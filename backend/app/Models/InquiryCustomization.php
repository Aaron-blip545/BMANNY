<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InquiryCustomization extends Model
{
    use HasFactory;

    // 1. Tell Laravel about the custom primary key
    protected $primaryKey = 'customization_id';

    // 2. Allow these rebranding columns to be filled
    protected $fillable = [
        'inquiry_id',
        'customization_type',
        'placement',
        'design_file_path',
        'client_notes',
    ];

    // 3. Link back to the parent Inquiry
    public function inquiry()
    {
        return $this->belongsTo(Inquiry::class, 'inquiry_id', 'inquiry_id');
    }
}