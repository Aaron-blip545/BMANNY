<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConversationClosure extends Model
{
    protected $primaryKey = 'conversation_closure_id';

    protected $fillable = ['customer_user_id', 'inquiry_id', 'closed_by_user_id', 'closed_at'];

    protected $casts = ['closed_at' => 'datetime'];

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_user_id', 'user_id');
    }

    public function inquiry()
    {
        return $this->belongsTo(Inquiry::class, 'inquiry_id', 'inquiry_id');
    }

    public function closedBy()
    {
        return $this->belongsTo(User::class, 'closed_by_user_id', 'user_id');
    }
}
