<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

// Replaces the old token-based check. Now that the web UI lives in the same
// app as the database, we use Laravel's standard session-based auth guard.
class EnsureBackendAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::guard('web')->check()) {
            return redirect()->route('login');
        }

        if ($request->user('web')?->role === 'customer') {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'Customer accounts can only sign in through the BMANNY mobile app.',
            ]);
        }

        $response = $next($request);

        // Authenticated pages must not be restored from the browser cache after
        // logout. A new request will then pass through this middleware again.
        $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, private');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', '0');

        return $response;
    }
}
