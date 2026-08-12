<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// REPLACES Laravel's default 'auth' middleware for BMANNY pages.
// frontend-web doesn't authenticate against its own users table (see
// AuthenticatedSessionController) - it just checks whether this session
// is holding a valid token that backend gave us at login time.
class EnsureBackendAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! session('backend_token')) {
            return redirect()->route('login');
        }

        return $next($request);
    }
}