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
        'is_verified',
        'verification_status',
        'business_permit_path',
        'verification_submitted_at',
        'verification_reviewed_at',
        'verification_notes',
    ];

    /**
     * Keep the storage path private to the backend implementation while
     * giving web and mobile clients one display-ready image URL.
     */
    protected $casts = [
        'is_verified' => 'boolean',
        'verification_submitted_at' => 'datetime',
        'verification_reviewed_at' => 'datetime',
    ];

    protected $appends = [
        'profile_pic_url',
        'business_permit_url',
    ];

    public function getProfilePicUrlAttribute(): ?string
    {
        return $this->profile_pic
            ? Storage::disk('public')->url($this->profile_pic)
            : null;
    }

    public function getBusinessPermitUrlAttribute(): ?string
    {
        return $this->business_permit_path
            ? Storage::disk('public')->url($this->business_permit_path)
            : null;
    }

    // 3. Link this back to the User model (One-to-One or Many-to-One)
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
