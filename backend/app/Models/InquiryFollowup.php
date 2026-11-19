<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InquiryFollowup extends Model
{
    protected $fillable = [
        'inquiry_id',
        'created_by',
        'follow_up_date',
        'note',
        'completed_at',
        'completion_note',
        'reminded_at',
    ];

    protected $casts = [
        'follow_up_date' => 'datetime',
        'completed_at' => 'datetime',
        'reminded_at' => 'datetime',
    ];

    public function inquiry()
    {
        return $this->belongsTo(Inquiry::class, 'inquiry_id', 'inquiry_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by', 'user_id');
    }
}
