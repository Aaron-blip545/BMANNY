<?php

namespace App\Observers;

use App\Models\BusinessClient;
use App\Models\User;

class UserObserver
{
    /**
     * When a new User is created with role = 'customer', automatically
     * create a stub BusinessClient row for them.
     *
     * Why here? Every other creation path (web admin form, API /register)
     * goes through Eloquent User::create(), so a single observer covers
     * every case without touching multiple controllers.
     *
     * The stub values are intentionally generic — the customer (or admin)
     * can fill in the real business details later. What matters is that
     * the client_id exists so the customer can submit inquiries right away.
     */
    public function created(User $user): void
    {
        if ($user->role === 'customer') {
            BusinessClient::create([
                'user_id'          => $user->user_id,
                'business_name'    => $user->full_name . "'s Business",
                'business_type'    => 'General',
                'contact_person'   => $user->full_name,
                'business_address' => 'Address not set',
            ]);
        }
    }
}
