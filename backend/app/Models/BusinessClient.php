<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
    ];

    // 3. Link this back to the User model (One-to-One or Many-to-One)
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}