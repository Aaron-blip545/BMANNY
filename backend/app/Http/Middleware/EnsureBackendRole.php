<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// Checks the authenticated user's role. Use like: ->middleware('backend.role:admin')
// You can allow multiple roles: ->middleware('backend.role:admin,sales_agent')
class EnsureBackendRole
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, $roles)) {
            abort(403, 'You do not have permission to view this page.');
        }

        return $next($request);
    }
}