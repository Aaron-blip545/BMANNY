<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MessageModeration extends Model
{
    protected $primaryKey = 'message_moderation_id';

    protected $fillable = ['message_id', 'hidden_by_user_id', 'reason', 'hidden_at'];

    protected $casts = ['hidden_at' => 'datetime'];

    public function message()
    {
        return $this->belongsTo(Message::class, 'message_id', 'message_id');
    }

    public function hiddenBy()
    {
        return $this->belongsTo(User::class, 'hidden_by_user_id', 'user_id');
    }
}
