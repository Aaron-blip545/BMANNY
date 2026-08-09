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

    // 2. Client fetches their specific quotes (Mobile App)
    public function show($client_id)
    {
        // Fetch all quotations linked to inquiries owned by this specific business client
        // FIXED: was 'business_client_id' - the real column (after the
        // inquiries migration fix) is 'client_id'.
        $quotations = Quotation::whereHas('inquiry', function ($query) use ($client_id) {
            $query->where('client_id', $client_id);
        })->with('inquiry.customizations')->get();

        return response()->json($quotations);
    }
}