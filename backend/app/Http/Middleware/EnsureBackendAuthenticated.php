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

        return $next($request);
    }
}
