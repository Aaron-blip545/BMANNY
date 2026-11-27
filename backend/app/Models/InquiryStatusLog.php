<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InquiryStatusLog extends Model
{
    use HasFactory;

    protected $primaryKey = 'log_id';

    protected $fillable = [
        'inquiry_id',
        'from_status',
        'to_status',
        'reason',
        'remarks',
        'changed_by',
    ];

    public function inquiry()
    {
        return $this->belongsTo(Inquiry::class, 'inquiry_id', 'inquiry_id');
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'changed_by', 'user_id');
    }
}
