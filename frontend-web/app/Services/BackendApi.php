<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

/**
 * frontend-web has NO database of its own for products/inquiries/orders/etc -
 * "backend" is the single source of truth. This class is the one place that
 * knows how to reach it, so every Controller calls BackendApi::get(...) /
 * post(...) instead of writing raw Http::... calls everywhere.
 *
 * How auth works here: after a user logs in (see AuthenticatedSessionController),
 * we store the Sanctum token backend gave us in the PHP session
 * (session('backend_token')). Every subsequent request to backend attaches
 * that token, the same way frontend-mobile would attach it as a mobile app.
 */
class BackendApi
{
    protected static function client(): PendingRequest
    {
        $client = Http::baseUrl(config('services.backend.url'))
            ->acceptJson();

        if ($token = session('backend_token')) {
            $client = $client->withToken($token);
        }

        return $client;
    }

    public static function get(string $path, array $query = [])
    {
        return static::client()->get($path, $query);
    }

    public static function post(string $path, array $data = [])
    {
        return static::client()->post($path, $data);
    }

    public static function put(string $path, array $data = [])
    {
        return static::client()->put($path, $data);
    }

    public static function delete(string $path)
    {
        return static::client()->delete($path);
    }
}
