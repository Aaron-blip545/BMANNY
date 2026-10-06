<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\BusinessClient;
use App\Models\Inquiry;
use App\Models\ConversationArchive;
use App\Models\Order;
use App\Models\Quotation;
use App\Services\NotificationService;
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
    public function inquiries(Request $request): Response
    {
        $archiveQuery = ConversationArchive::where('user_id', $request->user('web')->user_id);
        $archivedCustomerIds = (clone $archiveQuery)
            ->whereNotNull('customer_user_id')
            ->pluck('customer_user_id');
        $legacyArchivedInquiryIds = (clone $archiveQuery)
            ->whereNull('customer_user_id')
            ->pluck('inquiry_id');

        $inquiries = Inquiry::with([
            'client.user',       // business name + contact info
            'customizations',    // packaging specs
        ])
        ->whereNotIn('inquiry_id', $legacyArchivedInquiryIds)
        ->when($archivedCustomerIds->isNotEmpty(), fn ($query) => $query->whereHas(
            'client',
            fn ($clientQuery) => $clientQuery->whereNotIn('user_id', $archivedCustomerIds)
        ))
        ->orderByDesc('created_at')
        ->get();

        return Inertia::render('sales/inquiries', [
            'inquiries' => $inquiries,
        ]);
    }

    public function archivedChats(Request $request): Response
    {
        $archives = ConversationArchive::with(['customer.businessClient', 'inquiry.client.user', 'inquiry.customizations'])
            ->where('user_id', $request->user('web')->user_id)
            ->latest('archived_at')
            ->get();

        $archives->each(function (ConversationArchive $archive) {
            $clientId = $archive->inquiry?->client_id;
            $archive->setAttribute('inquiry_count', $clientId ? Inquiry::where('client_id', $clientId)->count() : 0);
        });

        return Inertia::render('sales/archived-chats', ['archives' => $archives]);
    }

    /**
     * Show the quotation creation form.
     * Pre-selects the inquiry if ?inquiry_id= is in the URL.
     */
    public function createQuotation(Request $request): Response
    {
        // Pass the list of pending/reviewed inquiries that don't yet have
        // a quotation, so the sales agent can pick one from a dropdown.
        $pendingInquiries = Inquiry::with(['client.user', 'customizations'])
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

        $quotation = Quotation::create([
            'inquiry_id'   => $validated['inquiry_id'],
            'total_amount' => $validated['total_amount'],
            'valid_until'  => $validated['valid_until'] ?? null,
            'item_details' => $validated['item_details'] ?? null,
            'status'       => 'sent',
        ]);

        // Mark the inquiry as responded now that a quote has been sent.
        $inquiry = Inquiry::with('client.user')->find($validated['inquiry_id']);
        if ($inquiry) {
            $inquiry->update(['status' => 'responded']);

            if ($inquiry->client && $inquiry->client->user) {
                NotificationService::send(
                    $inquiry->client->user->user_id,
                    'quotation',
                    'New Quotation Received',
                    "A quotation of ₱" . number_format($quotation->total_amount, 2) . " has been prepared for your inquiry.",
                    [
                        'quotation_id' => $quotation->quotation_id,
                        'inquiry_id'   => $inquiry->inquiry_id,
                    ]
                );
            }
        }

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
        $quotation = Quotation::with('inquiry.client.user')->findOrFail($id);

        if ($quotation->status !== 'sent') {
            return back()->withErrors(['status' => 'Only a sent quotation can be accepted.']);
        }

        // The client must have submitted proof of payment before we create
        // an Order - this is what actually gates "Accept". Without this
        // check, a sales agent could accept (and forward to the Order
        // Manager) a quotation nobody has paid for yet.
        if (! $quotation->payment_submitted_at) {
            return back()->withErrors(['status' => 'The client has not submitted payment for this quotation yet.']);
        }

        $order = null;

        DB::transaction(function () use ($quotation, &$order) {
            $order = Order::create([
                'client_id'    => $quotation->inquiry->client->client_id,
                'quotation_id' => $quotation->quotation_id,
                'total_amount' => $quotation->total_amount,
                'status'       => 'approved', // matches Figure 6.3's first order stage
            ]);

            $quotation->status = 'accepted';
            $quotation->save();
        });

        // Notify client that payment was accepted and order created
        if ($quotation->inquiry?->client?->user) {
            NotificationService::send(
                $quotation->inquiry->client->user->user_id,
                'order',
                'Payment Verified & Order Created',
                "Your payment for Quotation #{$quotation->quotation_id} was confirmed. Order #{$order->order_id} is now approved!",
                [
                    'order_id'     => $order->order_id,
                    'quotation_id' => $quotation->quotation_id,
                ]
            );
        }

        // Notify order managers and admin about the new approved order
        NotificationService::sendToRoles(
            ['order_manager', 'admin'],
            'order',
            'New Confirmed Order',
            "Order #{$order->order_id} from " . ($quotation->inquiry->client->business_name ?? 'Client') . " is confirmed and ready for production.",
            [
                'order_id' => $order->order_id,
            ]
        );

        return redirect()->route('quotations.index')
            ->with('success', 'Order created and forwarded to Order Manager.');
    }

    /**
     * Reject a submitted payment proof (e.g. it's blurry, wrong amount,
     * doesn't match records, etc). Clears the payment fields so the
     * quotation goes back to "awaiting payment" and the client can
     * resubmit from the mobile app.
     */
    public function rejectPayment($id)
    {
        $quotation = Quotation::with('inquiry.client.user')->findOrFail($id);

        if (! $quotation->payment_submitted_at) {
            return back()->withErrors(['status' => 'This quotation has no payment submission to reject.']);
        }

        $quotation->update([
            'payment_method'       => null,
            'payment_proof_path'   => null,
            'payment_submitted_at' => null,
        ]);

        // Notify client that payment proof was rejected
        if ($quotation->inquiry?->client?->user) {
            NotificationService::send(
                $quotation->inquiry->client->user->user_id,
                'quotation',
                'Payment Proof Rejected',
                "Your payment proof for Quotation #{$quotation->quotation_id} could not be verified. Please check and re-upload.",
                [
                    'quotation_id' => $quotation->quotation_id,
                    'inquiry_id'   => $quotation->inquiry_id,
                ]
            );
        }

        return redirect()->route('quotations.index')
            ->with('success', 'Payment rejected. The client can resubmit proof of payment.');
    }

    // ─── Verification queue ────────────────────────────────────────────────

    /**
     * Show all business clients with their verification status.
     * Visible to: sales_agent, admin.
     */
    public function verifications(): Response
    {
        $clients = BusinessClient::with('user')
            ->orderByRaw("FIELD(verification_status, 'pending', 'rejected', 'approved', 'not_submitted')")
            ->orderByDesc('verification_submitted_at')
            ->get()
            ->map(fn ($c) => [
                'client_id'                  => $c->client_id,
                'business_name'              => $c->business_name,
                'contact_person'             => $c->contact_person,
                'business_permit_path'       => $c->business_permit_path,
                'business_permit_url'        => $c->business_permit_url,
                'verification_status'        => $c->verification_status,
                'is_verified'                => (bool) $c->is_verified,
                'verification_submitted_at'  => $c->verification_submitted_at,
                'verification_reviewed_at'   => $c->verification_reviewed_at,
                'verification_notes'         => $c->verification_notes,
                'user' => $c->user ? [
                    'user_id' => $c->user->user_id,
                    'name'    => $c->user->name,
                    'email'   => $c->user->email,
                ] : null,
            ]);

        return Inertia::render('sales/verifications', ['clients' => $clients]);
    }

    /**
     * Approve a business client's permit.
     */
    public function approveClient(Request $request, $client_id)
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

        if ($client->user) {
            NotificationService::sendToUsers(
                [$client->user_id],
                'verification',
                'Account Verified ✅',
                'Congratulations! Your business permit has been approved. You can now submit inquiries.',
                ['client_id' => $client->client_id]
            );
        }

        return redirect()->route('sales.verifications')
            ->with('success', "{$client->business_name} has been approved.");
    }

    /**
     * Reject a business client's permit with a required reason.
     */
    public function rejectClient(Request $request, $client_id)
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

        if ($client->user) {
            NotificationService::sendToUsers(
                [$client->user_id],
                'verification',
                'Verification Rejected',
                "Your verification was not approved: {$request->notes}. Please re-submit with a valid permit.",
                ['client_id' => $client->client_id]
            );
        }

        return redirect()->route('sales.verifications')
            ->with('success', "Permit for {$client->business_name} has been rejected.");
    }
}
