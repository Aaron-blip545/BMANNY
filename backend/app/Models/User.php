<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    // Custom Primary Key
    protected $primaryKey = 'user_id';

    // Specify custom column fillables
    protected $fillable = [
        'full_name',
        'email',
        'password',
        'phone_number',
        'role',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Tell Laravel Sanctum/Auth where the hashed password column lives
    public function getAuthPassword()
    {
        return $this->password;
    }

    // A customer User has one BusinessClient profile
    public function businessClient()
    {
        return $this->hasOne(BusinessClient::class, 'user_id', 'user_id');
    }
}