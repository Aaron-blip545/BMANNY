<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveApiUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user?->is_active) {
            return response()->json([
                'message' => 'Your account has been deactivated. Contact an administrator.',
            ], 403);
        }

        return $next($request);
    }
}
