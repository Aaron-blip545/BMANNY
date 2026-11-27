<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class BusinessClient extends Model
{
    use HasFactory;

    // 1. Tell Laravel about your custom ID
    protected $primaryKey = 'client_id';

    // 2. Allow these specific columns to be filled with data
    protected $fillable = [
        'user_id',
        'business_name',
        'business_type',
        'contact_person',
        'business_address',
        'profile_pic',
        'is_flagged_nuisance',
        'nuisance_strikes',
        'nuisance_reason',
        'nuisance_flagged_at',
        'nuisance_flagged_by',
    ];

    protected $casts = [
        'is_flagged_nuisance' => 'boolean',
        'nuisance_strikes'    => 'integer',
        'nuisance_flagged_at' => 'datetime',
    ];

    protected $appends = [
        'profile_pic_url',
    ];

    public function getProfilePicUrlAttribute(): ?string
    {
        return $this->profile_pic
            ? Storage::disk('public')->url($this->profile_pic)
            : null;
    }

    // 3. Link this back to the User model (One-to-One or Many-to-One)
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function flaggedByUser()
    {
        return $this->belongsTo(User::class, 'nuisance_flagged_by', 'user_id');
    }
}
