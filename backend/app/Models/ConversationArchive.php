<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConversationArchive extends Model
{
    protected $primaryKey = 'conversation_archive_id';

    protected $fillable = ['user_id', 'customer_user_id', 'inquiry_id', 'archived_at'];

    protected $casts = ['archived_at' => 'datetime'];

    public function inquiry()
    {
        return $this->belongsTo(Inquiry::class, 'inquiry_id', 'inquiry_id');
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_user_id', 'user_id');
    }
}
