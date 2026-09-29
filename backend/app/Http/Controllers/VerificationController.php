<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BusinessClient;
use App\Services\NotificationService;

class VerificationController extends Controller
{
    /**
     * Return the current verification status for the authenticated customer.
     * The mobile app calls this on the Profile screen to show the badge.
     */
    public function status(Request $request)
    {
        $user   = $request->user();
        $client = $user->businessClient;

        if (! $client) {
            return response()->json(['message' => 'No business profile found.'], 422);
        }

        return response()->json([
            'registration_number'       => $user->registration_number,
            'is_verified'               => (bool) $client->is_verified,
            'verification_status'       => $client->verification_status,
            'business_permit_url'       => $client->business_permit_url,
            'verification_submitted_at' => $client->verification_submitted_at,
            'verification_reviewed_at'  => $client->verification_reviewed_at,
            'verification_notes'        => $client->verification_notes,
        ]);
    }

    /**
     * Upload a business permit image and set the verification workflow
     * to "pending" so an admin can review it.
     *
     * Customers may re-submit if their previous attempt was rejected.
     */
    public function submitPermit(Request $request)
    {
        $request->validate([
            'business_permit' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,pdf',
                'max:10240',   // 10 MB
            ],
        ]);

        $user   = $request->user();
        $client = $user->businessClient;

        if (! $client) {
            return response()->json(['message' => 'No business profile found.'], 422);
        }

        // Block re-submission if already approved.
        if ($client->verification_status === 'approved') {
            return response()->json(['message' => 'Your account is already verified.'], 422);
        }

        // Store the permit in a private "permits" disk folder.
        $path = $request->file('business_permit')
            ->store('business-permits', 'public');

        $client->update([
            'business_permit_path'      => $path,
            'verification_status'       => 'pending',
            'verification_submitted_at' => now(),
            'verification_reviewed_at'  => null,
            'verification_notes'        => null,
        ]);

        // Notify admins that a new permit is waiting for review.
        NotificationService::sendToRoles(
            ['admin'],
            'verification',
            'Verification Request',
            "{$client->business_name} has submitted a business permit for verification.",
            [
                'client_id' => $client->client_id,
                'user_id'   => $user->user_id,
            ]
        );

        return response()->json([
            'message'             => 'Business permit submitted. An admin will review it shortly.',
            'verification_status' => $client->fresh()->verification_status,
            'business_permit_url' => $client->fresh()->business_permit_url,
        ]);
    }

    // ─── Admin-only endpoints ───────────────────────────────────────────────

    /**
     * Return all accounts with a pending or already-reviewed permit so
     * admins can manage the verification queue.  Used in the web dashboard.
     */
    public function index(Request $request)
    {
        $status = $request->query('status', 'pending'); // pending | approved | rejected | all

        $query = BusinessClient::with('user')
            ->whereIn('verification_status', $status === 'all'
                ? ['pending', 'approved', 'rejected']
                : [$status]
            )
            ->orderByDesc('verification_submitted_at');

        return response()->json($query->paginate(20));
    }

    /**
     * Approve a business client's permit, granting full inquiry access.
     */
    public function approve(Request $request, $client_id)
    {
        $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $client = BusinessClient::with('user')->findOrFail($client_id);

        $client->update([
            'is_verified'              => true,
            'verification_status'      => 'approved',
            'verification_reviewed_at' => now(),
            'verification_notes'       => $request->notes,
        ]);

        // Notify the customer.
        NotificationService::sendToUsers(
            [$client->user_id],
            'verification',
            'Account Verified ✅',
            'Congratulations! Your business permit has been approved. You can now submit inquiries.',
            ['client_id' => $client->client_id]
        );

        return response()->json([
            'message' => 'Account approved successfully.',
            'client'  => $client->fresh(),
        ]);
    }

    /**
     * Reject a permit and optionally provide a reason so the customer
     * knows what to fix before re-submitting.
     */
    public function reject(Request $request, $client_id)
    {
        $request->validate([
            'notes' => ['required', 'string', 'max:500'],
        ]);

        $client = BusinessClient::with('user')->findOrFail($client_id);

        $client->update([
            'is_verified'              => false,
            'verification_status'      => 'rejected',
            'verification_reviewed_at' => now(),
            'verification_notes'       => $request->notes,
        ]);

        // Notify the customer with the rejection reason.
        NotificationService::sendToUsers(
            [$client->user_id],
            'verification',
            'Verification Rejected',
            "Your verification was not approved: {$request->notes}. Please re-submit with a valid permit.",
            ['client_id' => $client->client_id]
        );

        return response()->json([
            'message' => 'Account verification rejected.',
            'client'  => $client->fresh(),
        ]);
    }
}
