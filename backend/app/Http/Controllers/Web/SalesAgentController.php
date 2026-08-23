<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Inquiry;
use App\Models\Order;
use App\Models\Quotation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SalesAgentController extends Controller
{
    /**
     * Show the inquiries list page.
     * Visible to: sales_agent, admin.
     */
    public function inquiries(): Response
    {
        $inquiries = Inquiry::with([
            'client.user',       // business name + contact info
            'customizations',    // packaging specs
        ])
        ->orderByDesc('created_at')
        ->get();

        return Inertia::render('sales/inquiries', [
            'inquiries' => $inquiries,
        ]);
    }

    /**
     * Show the quotation creation form.
     * Pre-selects the inquiry if ?inquiry_id= is in the URL.
     */
    public function createQuotation(Request $request): Response
    {
        // Pass the list of pending/reviewed inquiries that don't yet have
        // a quotation, so the sales agent can pick one from a dropdown.
        $pendingInquiries = Inquiry::with('client')
            ->whereIn('status', ['pending', 'reviewed'])
            ->whereDoesntHave('quotation')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('sales/quotations/create', [
            'pendingInquiries'    => $pendingInquiries,
            'selectedInquiryId'   => $request->integer('inquiry_id') ?: null,
        ]);
    }

    /**
     * Store a new quotation and mark the linked inquiry as "responded".
     */
    public function storeQuotation(Request $request)
    {
        $validated = $request->validate([
            'inquiry_id'   => 'required|exists:inquiries,inquiry_id',
            'total_amount' => 'required|numeric|min:0',
            'valid_until'  => 'nullable|date|after_or_equal:today',
            'item_details' => 'nullable|string',
        ]);

        Quotation::create([
            'inquiry_id'   => $validated['inquiry_id'],
            'total_amount' => $validated['total_amount'],
            'valid_until'  => $validated['valid_until'] ?? null,
            'item_details' => $validated['item_details'] ?? null,
            'status'       => 'sent',
        ]);

        // Mark the inquiry as responded now that a quote has been sent.
        Inquiry::where('inquiry_id', $validated['inquiry_id'])
            ->update(['status' => 'responded']);

        return redirect()->route('inquiries.index')
            ->with('success', 'Quotation sent to client.');
    }

    /**
     * List every quotation, with its inquiry/client info, so the Sales Agent
     * can see what's pending and act on it.
     */
    public function quotations(): Response
    {
        $quotations = Quotation::with(['inquiry.client.user'])
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('sales/quotations/index', [
            'quotations' => $quotations,
        ]);
    }

    /**
     * Accept a quotation and create the matching Order — this is the
     * "Record Confirmed Order Details / Forward to Order Manager" step
     * from Figure 6.1.
     */
    public function acceptQuotation($id)
    {
        $quotation = Quotation::with('inquiry.client')->findOrFail($id);

        if ($quotation->status !== 'sent') {
            return back()->withErrors(['status' => 'Only a sent quotation can be accepted.']);
        }

        DB::transaction(function () use ($quotation) {
            Order::create([
                'client_id'    => $quotation->inquiry->client->client_id,
                'quotation_id' => $quotation->quotation_id,
                'total_amount' => $quotation->total_amount,
                'status'       => 'approved', // matches Figure 6.3's first order stage
            ]);

            $quotation->status = 'accepted';
            $quotation->save();
        });

        return redirect()->route('quotations.index')
            ->with('success', 'Order created and forwarded to Order Manager.');
    }
}
