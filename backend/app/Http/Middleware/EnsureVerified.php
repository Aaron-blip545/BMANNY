<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * EnsureVerified
 *
 * Guards any route that requires a fully-verified business account
 * (e.g. submitting an inquiry, reordering).
 *
 * Unverified users can still:
 *   - Browse the product catalogue (public routes)
 *   - View their profile and verification status
 *
 * They cannot:
 *   - Submit inquiries
 *   - Place reorders
 *
 * This intentionally keeps them as trackable "leads" in the system
 * until an admin approves their business permit.
 */
class EnsureVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        $user   = $request->user();
        $client = $user?->businessClient;

        // Staff roles (admin, sales_agent, etc.) bypass this check entirely —
        // only customer accounts need business permit verification.
        if ($user && $user->role !== 'customer') {
            return $next($request);
        }

        if (! $client || ! $client->is_verified) {
            $status = $client?->verification_status ?? 'not_submitted';

            return response()->json([
                'message'             => match ($status) {
                    'not_submitted' => 'Your account is not yet verified. Please upload your business permit to submit inquiries.',
                    'pending'       => 'Your verification is under review. You will be notified once approved.',
                    'rejected'      => 'Your previous verification was rejected. Please re-upload a valid business permit.',
                    default         => 'Your account must be verified before you can submit inquiries.',
                },
                'verification_status' => $status,
                'requires_verification' => true,
            ], 403);
        }

        return $next($request);
    }
}
