<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('user.{id}', function ($user, $id) {
    // The project uses user_id as its primary key. A user may only subscribe
    // to their own private notification / chat channel.
    return (int) $user->user_id === (int) $id;
});
