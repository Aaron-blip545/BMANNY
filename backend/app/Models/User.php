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
        'registration_number',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Generate a unique registration number for a new user account.
     * Format: BMN-YYYYMMDD-XXXXX  (5 random uppercase alphanum chars)
     */
    public static function generateRegistrationNumber(): string
    {
        do {
            $suffix = strtoupper(substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 5));
            $number = 'BMN-' . now()->format('Ymd') . '-' . $suffix;
        } while (static::where('registration_number', $number)->exists());

        return $number;
    }

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

    public function appNotifications()
    {
        return $this->hasMany(AppNotification::class, 'user_id', 'user_id')->orderByDesc('created_at');
    }
}