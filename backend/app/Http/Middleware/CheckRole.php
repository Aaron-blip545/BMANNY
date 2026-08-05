<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        // Check if user is logged in and if their role matches any allowed role
        if (!$user || !in_array($user->role, $roles)) {
            return response()->json([
                'message' => 'Unauthorized. Your role (' . ($user->role ?? 'None') . ') does not have permission to perform this action.'
            ], 403);
        }

        return $next($request);
    }
}