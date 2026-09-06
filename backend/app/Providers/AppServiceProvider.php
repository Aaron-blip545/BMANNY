<?php

namespace App\Providers;

use App\Models\User;
use App\Observers\UserObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Auto-create a BusinessClient stub when a customer User is created.
        // Covers both the web admin form and the API /register route.
        User::observe(UserObserver::class);

        // Per-user limits protect normal users from a noisy client without
        // making everyone on the same office Wi-Fi share one quota.
        $keyFor = static function (Request $request): string {
            return (string) (
                $request->user()?->user_id
                ?? $request->user('web')?->user_id
                ?? $request->ip()
            );
        };

        RateLimiter::for('auth', static fn (Request $request) => Limit::perMinute(5)
            ->by(strtolower((string) $request->input('email')) . '|' . $request->ip()));

        RateLimiter::for('write', static fn (Request $request) => Limit::perMinute(30)->by($keyFor($request)));
        RateLimiter::for('upload', static fn (Request $request) => Limit::perMinute(10)->by($keyFor($request)));
        RateLimiter::for('chat', static fn (Request $request) => Limit::perMinute(30)->by($keyFor($request)));
    }
}
