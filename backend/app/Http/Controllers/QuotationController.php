<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Quotation;
use App\Models\Inquiry;

class QuotationController extends Controller
{
    // 1. Admin generates the formal quote (Web Portal)
    public function store(Request $request)
    {
        // Create the quotation
        $quotation = Quotation::create([
            'inquiry_id' => $request->inquiry_id,
            'total_amount' => $request->total_amount,
            'valid_until' => $request->valid_until,
            // FIXED: 'Pending Approval' isn't in the quotations.status enum
            // (draft, sent, accepted, rejected). 'sent' matches the actual
            // meaning here: the quote has just gone out to the client.
            'status' => 'sent'
        ]);

        // Automatically update the parent inquiry status to show it has been quoted
        // FIXED: 'Quoted' isn't in the inquiries.status enum (pending,
        // reviewed, responded, closed). 'responded' is the closest valid
        // match - the sales agent has now responded with a price.
        Inquiry::where('inquiry_id', $request->inquiry_id)->update(['status' => 'responded']);

        return response()->json([
            'message' => 'Quotation successfully generated and sent to client.',
            'quotation' => $quotation
        ], 201);
    }

    /**
     * 2. Client fetches their own quotations (Mobile App).
     *
     * FIXED: this used to take a `$client_id` route parameter, but the
     * route (`GET /quotations/my-quotes`) never passed one - calling this
     * endpoint would throw a "Too few arguments" error every time. It now
     * derives the client from the authenticated user, the same way
     * InquiryController::myInquiries() does.
     */
    public function myQuotes(Request $request)
    {
        $client = $request->user()->businessClient;

        if (! $client) {
            return response()->json([]);
        }

        $quotations = Quotation::whereHas('inquiry', function ($query) use ($client) {
            $query->where('client_id', $client->client_id);
        })
            ->with('inquiry.customizations')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($quotations);
    }

    /**
     * 3. Client submits proof of payment for a quotation that was sent to
     * them. This only records the payment as "submitted" - it does NOT
     * create the Order. The Sales Agent still has to review the proof and
     * explicitly accept the quotation (see
     * Web\SalesAgentController::acceptQuotation) before an Order exists.
     */
    public function submitPayment(Request $request, $quotation_id)
    {
        $client = $request->user()->businessClient;

        if (! $client) {
            return response()->json(['message' => 'No business client profile found.'], 422);
        }

        $quotation = Quotation::with('inquiry')->findOrFail($quotation_id);

        if (! $quotation->inquiry || (int) $quotation->inquiry->client_id !== (int) $client->client_id) {
            return response()->json(['message' => 'This quotation does not belong to you.'], 403);
        }

        if ($quotation->status !== 'sent') {
            return response()->json(['message' => 'This quotation is not awaiting payment.'], 422);
        }

        $validated = $request->validate([
            'payment_method' => 'required|in:gcash,card,cod',
            // Cash on Delivery doesn't need a proof screenshot - every
            // other method does.
            'proof' => 'required_unless:payment_method,cod|image|max:5120',
        ]);

        $path = $request->hasFile('proof')
            ? $request->file('proof')->store('payment-proofs', 'public')
            : null;

        $quotation->update([
            'payment_method' => $validated['payment_method'],
            'payment_proof_path' => $path,
            'payment_submitted_at' => now(),
        ]);

        return response()->json([
            'message' => 'Payment submitted. Our sales team will confirm it shortly.',
            'quotation' => $quotation->fresh('inquiry.customizations'),
        ]);
    }
}
