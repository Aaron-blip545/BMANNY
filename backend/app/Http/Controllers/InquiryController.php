<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Inquiry;
use App\Models\InquiryCustomization;
use App\Services\NotificationService;
use Illuminate\Support\Facades\DB;

class InquiryController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            // FIXED: was 'exists:users,user_id' - an inquiry belongs to a
            // business_clients row (client_id), not a raw users row.
            'client_id' => 'required|exists:business_clients,client_id',
            'customizations' => 'required|array',
            'customizations.*.packaging_type' => 'required|string', // Sachet, Pouch, Bottle, Box
            'customizations.*.packaging_finish' => 'nullable|string', // Matte, Glossy, Foil
            'customizations.*.serving_size' => 'nullable|string',
            'customizations.*.formulation_notes' => 'nullable|string',
            'customizations.*.client_notes' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            // Create Parent B2B Inquiry
            $inquiry = Inquiry::create([
                // FIXED: column is client_id (see inquiries migration)
                'client_id' => $request->client_id,
                // FIXED: 'Pending Review' isn't in the inquiries.status enum
                // (pending, reviewed, responded, closed) - insert would fail.
                'status' => 'pending',
            ]);

            // Save Customization & Packaging Requirements
            foreach ($request->customizations as $cust) {
                InquiryCustomization::create([
                    'inquiry_id' => $inquiry->inquiry_id,
                    'customization_type' => $cust['customization_type'] ?? 'Custom Rebrand & Packaging',
                    'packaging_type' => $cust['packaging_type'],
                    'packaging_finish' => $cust['packaging_finish'] ?? null,
                    'serving_size' => $cust['serving_size'] ?? null,
                    'formulation_notes' => $cust['formulation_notes'] ?? null,
                    'client_notes' => $cust['client_notes'] ?? null,
                ]);
            }

            DB::commit();

            // Notify sales agents and admin about the new inquiry
            $clientName = $request->user()->businessClient?->business_name ?? $request->user()->full_name;
            NotificationService::sendToRoles(
                ['sales_agent', 'admin'],
                'inquiry',
                'New Inquiry Received',
                "New rebranding inquiry submitted by {$clientName}",
                [
                    'inquiry_id' => $inquiry->inquiry_id,
                    'client_id'  => $request->client_id,
                ]
            );

            return response()->json([
                'message' => 'Rebranding inquiry and customization specs submitted successfully.',
                'inquiry' => $inquiry->load('customizations'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'error' => 'Failed to process inquiry.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Return all inquiries belonging to the authenticated customer.
     * Used by the mobile app so customers can track their submissions.
     */
    public function myInquiries(Request $request)
    {
        $user   = $request->user();
        $client = $user->businessClient;

        if (! $client) {
            return response()->json([]);
        }

        // Compute a per-client sequential number using a window function so
        // the customer always sees Inquiry #1, #2, #3 — not the global IDs
        // (which include every other customer's inquiries in the sequence).
        $inquiries = Inquiry::with(['customizations', 'quotation.order'])
            ->where('client_id', $client->client_id)
            ->orderBy('created_at')
            ->get()
            ->values()
            ->map(function ($inquiry, $index) {
                $firstCust = $inquiry->customizations->first();
                $brandName = null;
                if ($firstCust && $firstCust->client_notes) {
                    if (preg_match('/Brand:\s*([^|]+)/i', $firstCust->client_notes, $matches)) {
                        $brandName = trim($matches[1]);
                    }
                }

                return [
                    'inquiry_id'           => $inquiry->inquiry_id,
                    'client_inquiry_number'=> $index + 1,   // 1-based per-client sequence
                    'brand_name'           => $brandName,
                    'status'               => $inquiry->status,
                    'created_at'           => $inquiry->created_at,
                    'customizations'       => $inquiry->customizations->map(fn ($c) => [
                        'packaging_type' => $c->packaging_type,
                        'serving_size'   => $c->serving_size,
                        'client_notes'   => $c->client_notes,
                    ])->values(),
                    'has_quotation'        => $inquiry->quotation !== null,
                    'has_order'            => $inquiry->quotation?->order !== null,
                    'quotation_id'         => $inquiry->quotation?->quotation_id,
                    'quotation_amount'     => $inquiry->quotation?->total_amount,
                    'quotation_status'     => $inquiry->quotation?->status,
                    'payment_submitted_at' => $inquiry->quotation?->payment_submitted_at,
                    'cancelled_at'         => $inquiry->cancelled_at,
                ];
            })
            ->reverse()
            ->values();

        return response()->json($inquiries);
    }

    /**
     * Let a customer cancel their own inquiry - but only while it hasn't
     * been quoted yet. Once a quotation exists, the sales agent has
     * already done work on it, so cancellation has to go through them
     * instead (e.g. via chat) rather than silently disappearing here.
     */
    public function cancel(Request $request, $inquiry_id)
    {
        $client = $request->user()->businessClient;

        if (! $client) {
            return response()->json(['message' => 'No business client profile found.'], 422);
        }

        $inquiry = Inquiry::with('quotation')->findOrFail($inquiry_id);

        if ((int) $inquiry->client_id !== (int) $client->client_id) {
            return response()->json(['message' => 'This inquiry does not belong to you.'], 403);
        }

        if ($inquiry->quotation !== null || ! in_array($inquiry->status, ['pending', 'reviewed'], true)) {
            return response()->json(['message' => 'This inquiry has already been quoted and can no longer be cancelled here.'], 422);
        }

        $inquiry->update([
            'status' => 'closed',
            'cancelled_at' => now(),
        ]);

        return response()->json([
            'message' => 'Inquiry cancelled.',
            'inquiry' => $inquiry->fresh(),
        ]);
    }
}
