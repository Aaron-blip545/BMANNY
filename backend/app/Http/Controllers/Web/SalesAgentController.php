<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ClientPackagingBalance;
use App\Models\Inquiry;
use App\Models\InquiryFollowup;
use App\Models\ConversationArchive;
use App\Models\Order;
use App\Models\Quotation;
use App\Models\ProductPackage;
use App\Services\NotificationService;
use App\Services\FollowUpReminderService;
use App\Services\QuotationSpecificationService;
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
        app(FollowUpReminderService::class)->sendDueReminders();

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
            'quotation.order',   // quotation & order details
            'packagingBalance.inquiries' => fn ($query) => $query
                ->with('quotation.order')
                ->whereIn('inquiry_type', ['reorder_batch', 'packaging_replenishment'])
                ->orderByDesc('created_at'),
            'productRequestReview.suggestedVariant.productType',
            'productRequestReview.suggestedPackaging',
            'followUps.creator',
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

    /** Schedule and record the next action for an active lead. */
    public function storeFollowUp(Request $request, int $inquiryId)
    {
        $data = $request->validate([
            'follow_up_date' => ['required', 'date', 'after_or_equal:now'],
            'note' => ['required', 'string', 'max:2000'],
        ]);

        $inquiry = Inquiry::findOrFail($inquiryId);
        if (in_array($inquiry->status, ['converted', 'cancelled'], true) || $inquiry->cancelled_at) {
            return back()->withErrors(['follow_up' => 'Follow-ups can only be scheduled for active leads.']);
        }

        InquiryFollowup::create([
            'inquiry_id' => $inquiry->inquiry_id,
            'created_by' => $request->user('web')->user_id,
            'follow_up_date' => $data['follow_up_date'],
            'note' => $data['note'],
        ]);

        return back()->with('success', 'Follow-up scheduled.');
    }

    /** Keep a completed follow-up in the lead history. */
    public function completeFollowUp(Request $request, int $followUpId)
    {
        $data = $request->validate([
            'completion_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $followUp = InquiryFollowup::findOrFail($followUpId);
        if ($followUp->completed_at) {
            return back()->with('success', 'Follow-up was already completed.');
        }

        $followUp->update([
            'completed_at' => now(),
            'completion_note' => $data['completion_note'] ?? null,
        ]);

        // The next status comes from the workflow, not a manual selection.
        // If a quote exists, Sales is waiting on the customer's response;
        // otherwise the lead is ready for quotation.
        $inquiry = $followUp->inquiry;
        if ($inquiry?->status === 'follow_up') {
            $inquiry->update([
                'status' => $inquiry->quotation()->exists() ? 'quotation_sent' : 'for_quotation',
            ]);
        }

        return back()->with('success', 'Follow-up marked complete.');
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
        // Pass leads ready for quotation that have been reviewed by the Product Controller
        // and do not yet have a quotation, so the sales agent can pick one from a dropdown.
        $pendingInquiries = Inquiry::with(['client.user', 'customizations', 'packagingBalance', 'productRequestReview.suggestedVariant.productType', 'productRequestReview.suggestedVariant.currentMoq', 'productRequestReview.suggestedPackaging'])
            ->whereIn('status', ['new', 'for_quotation', 'follow_up'])
            ->whereDoesntHave('quotation')
            ->whereHas('productRequestReview', function ($query) {
                $query->whereIn('status', ['available', 'alternative']);
            })
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('sales/quotations/create', [
            'pendingInquiries'    => $pendingInquiries,
            'selectedInquiryId'   => $request->integer('inquiry_id') ?: null,
            'packageCatalog'      => ProductPackage::where('is_active', true)->orderBy('product_type_id')->orderBy('name')->get(),
        ]);
    }

    /**
     * Store a new quotation and mark the linked lead as quotation sent.
     */
    public function storeQuotation(Request $request)
    {
        $validated = $request->validate([
            'inquiry_id'             => 'required|exists:inquiries,inquiry_id',
            'total_amount'           => 'required|numeric|min:0',
            'initial_payment_amount' => 'nullable|numeric|min:0',
            'balance_payment_amount' => 'nullable|numeric|min:0',
            'valid_until'            => 'nullable|date|after_or_equal:today',
            'item_details'           => 'nullable|string',
        ]);

        $inquiry = Inquiry::with(['client.user', 'customizations', 'packagingBalance', 'productRequestReview'])->findOrFail($validated['inquiry_id']);

        if (!$inquiry->productRequestReview || !in_array($inquiry->productRequestReview->status, ['available', 'alternative'], true)) {
            return back()->withErrors(['inquiry_id' => 'The inquiry must be reviewed by the Product Controller before a quotation can be created.']);
        }

        $totalAmount = round((float) $validated['total_amount'], 2);
        $initialAmount = isset($validated['initial_payment_amount']) && $validated['initial_payment_amount'] !== ''
            ? round((float) $validated['initial_payment_amount'], 2)
            : null;
        $balanceAmount = isset($validated['balance_payment_amount']) && $validated['balance_payment_amount'] !== ''
            ? round((float) $validated['balance_payment_amount'], 2)
            : null;

        if ($initialAmount === null || $balanceAmount === null) {
            if ($inquiry->inquiry_type === 'reorder_batch') {
                // Repeat-batch reorder: production cost only, 100% before production, ₱0 before pickup.
                $initialAmount = $initialAmount ?? $totalAmount;
                $balanceAmount = $balanceAmount ?? round(max(0, $totalAmount - $initialAmount), 2);
            } elseif ($inquiry->inquiry_type === 'packaging_replenishment' && $inquiry->packagingBalance) {
                // Packaging replenishment: packaging cost (excluding cylinder) before production, production cost before pickup.
                $packCost = $inquiry->packagingBalance->packagingReplenishmentCost();
                $initialAmount = $initialAmount ?? min($packCost, $totalAmount);
                $balanceAmount = $balanceAmount ?? round(max(0, $totalAmount - $initialAmount), 2);
            } else {
                $selectedSlug = $inquiry->customizations->first()?->selected_package;
                $package = $selectedSlug
                    ? ProductPackage::where('slug', $selectedSlug)->where('is_active', true)->first()
                    : null;

                if ($package && strtolower((string) $package->slug) === 'starter') {
                    // Starter Package supports selectable MOQ (100–500 pouches) at 50% before production / 50% before pickup.
                    $initialAmount = $initialAmount ?? round($totalAmount / 2, 2);
                    $balanceAmount = $balanceAmount ?? round(max(0, $totalAmount - $initialAmount), 2);
                } elseif ($package && $package->before_production_amount !== null) {
                    $defaultInitial = round((float) $package->before_production_amount, 2);
                    $initialAmount = $initialAmount ?? min($defaultInitial, $totalAmount);
                    $balanceAmount = $balanceAmount ?? round(max(0, $totalAmount - $initialAmount), 2);
                } else {
                    $initialAmount = $initialAmount ?? round($totalAmount / 2, 2);
                    $balanceAmount = $balanceAmount ?? round($totalAmount - $initialAmount, 2);
                }
            }
        }

        if (abs(($initialAmount + $balanceAmount) - $totalAmount) > 0.01) {
            return back()->withErrors([
                'initial_payment_amount' => 'Before production and before pickup amounts must add up to the total amount.',
            ]);
        }

        $quotation = Quotation::create([
            'inquiry_id'             => $validated['inquiry_id'],
            'total_amount'           => $totalAmount,
            'initial_payment_amount' => $initialAmount,
            'balance_payment_amount' => $balanceAmount,
            'valid_until'            => $validated['valid_until'] ?? null,
            'item_details'           => $validated['item_details'] ?? null,
            'product_specification'  => QuotationSpecificationService::forInquiry($inquiry),
            'status'                 => 'sent',
        ]);

        // Mark the lead as quotation sent once the client can review it.
        if ($inquiry) {
            $inquiry->update(['status' => 'quotation_sent']);

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
        $quotations = Quotation::with(['inquiry.client.user', 'inquiry.customizations', 'order'])
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('sales/quotations/index', [
            'quotations' => $quotations,
        ]);
    }

    public function verifyBalancePayment($id)
    {
        $order = Order::with('client.user')->findOrFail($id);
        if ($order->status !== 'ready_for_pickup' || ! $order->balance_payment_submitted_at) {
            return back()->withErrors(['status' => 'A submitted balance payment is required while the order is ready for pickup.']);
        }

        $order->update(['balance_payment_verified_at' => now()]);
        if ($order->client?->user) {
            NotificationService::send($order->client->user->user_id, 'payment', 'Balance Payment Verified', "Your balance for Order #{$order->order_id} was verified. Your order is cleared for pickup or dispatch.", ['order_id' => $order->order_id]);
        }
        return redirect()->route('quotations.index')->with('success', "Balance payment for Order #{$order->order_id} verified. Pickup is now cleared.");
    }

    /**
     * Accept a quotation and create the matching Order — this is the
     * "Record Confirmed Order Details / Forward to Order Manager" step
     * from Figure 6.1.
     */
    public function acceptQuotation($id)
    {
        $quotation = Quotation::with(['inquiry.client.user', 'inquiry.customizations', 'inquiry.packagingBalance'])->findOrFail($id);

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
        $deductedMaterials = [];

        try {
            DB::transaction(function () use ($quotation, &$order, &$deductedMaterials) {
                $totalAmount = round((float) $quotation->total_amount, 2);
                $initialAmount = $quotation->initial_payment_amount !== null
                    ? round((float) $quotation->initial_payment_amount, 2)
                    : round($totalAmount / 2, 2);
                $balanceAmount = $quotation->balance_payment_amount !== null
                    ? round((float) $quotation->balance_payment_amount, 2)
                    : round(max(0, $totalAmount - $initialAmount), 2);

                $order = Order::create([
                    'client_id'    => $quotation->inquiry->client->client_id,
                    'quotation_id' => $quotation->quotation_id,
                    'total_amount' => $totalAmount,
                    'initial_payment_amount' => $initialAmount,
                    'initial_payment_verified_at' => now(),
                    'balance_payment_amount' => $balanceAmount,
                    'balance_payment_verified_at' => $balanceAmount <= 0 ? now() : null,
                    'status'       => 'approved', // matches Figure 6.3's first order stage
                ]);

                // Automatically deduct raw-material stock based on the product's BOM upon payment confirmation
                $deductedMaterials = \App\Services\InventoryService::deductOrderMaterials($order);

                $quotation->status = 'accepted';
                $quotation->save();
                $quotation->inquiry->update(['status' => 'converted']);

                // Update or initialize per-client Gold/Elite stored packaging MOQ tracker
                $inquiry = $quotation->inquiry;
                if ($inquiry->inquiry_type === 'reorder_batch' && $inquiry->packagingBalance) {
                    $batchQty = (int) ($inquiry->reorder_batch_quantity ?: $inquiry->packagingBalance->batch_min_quantity);
                    $inquiry->packagingBalance->deductBatch($batchQty);
                } elseif ($inquiry->inquiry_type === 'packaging_replenishment' && $inquiry->packagingBalance) {
                    $batchQty = (int) ($inquiry->reorder_batch_quantity ?: $inquiry->packagingBalance->batch_min_quantity);
                    $inquiry->packagingBalance->replenish($batchQty, $order->order_id);
                } else {
                    $firstCust = $inquiry->customizations->first();
                    $selectedSlug = $firstCust?->selected_package;
                    $rules = ClientPackagingBalance::rulesForSlug($selectedSlug);
                    if ($rules) {
                        $brandName = $inquiry->client->business_name ?? 'Client Brand';
                        if ($firstCust?->client_notes && preg_match('/Brand:\s*([^|]+)/i', $firstCust->client_notes, $matches)) {
                            $brandName = trim($matches[1]);
                        }
                        $usedFirstBatch = $rules['batch_min_quantity'];
                        ClientPackagingBalance::create([
                            'client_id'            => $inquiry->client->client_id,
                            'source_order_id'      => $order->order_id,
                            'brand_name'           => $brandName,
                            'package_slug'         => strtolower($selectedSlug),
                            'total_pouches'        => $rules['total_pouches'],
                            'used_pouches'         => $usedFirstBatch,
                            'remaining_pouches'    => max(0, $rules['total_pouches'] - $usedFirstBatch),
                            'production_unit_cost' => $rules['production_unit_cost'],
                            'packaging_unit_cost'  => $rules['packaging_unit_cost'],
                            'batch_min_quantity'   => $rules['batch_min_quantity'],
                            'cylinder_paid'        => true,
                            'expires_at'           => now()->addYears(2),
                            'status'               => 'active',
                        ]);
                    }
                }
            });
        } catch (\Throwable $e) {
            return back()
                ->with('error', $e->getMessage())
                ->withErrors(['inventory' => $e->getMessage()]);
        }

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

        $deductNote = ! empty($deductedMaterials)
            ? ' BOM raw materials were automatically deducted from inventory.'
            : '';

        return redirect()->route('quotations.index')
            ->with('success', 'Order created and forwarded to Order Manager.' . $deductNote);
    }

    /**
     * Reject a submitted payment proof (e.g. it's blurry, wrong amount,
     * doesn't match records, etc). Clears the payment fields so the
     * quotation goes back to "awaiting payment" and the client can
     * resubmit from the mobile app.
     */
    public function rejectPayment($id)
    {
        $quotation = Quotation::with(['inquiry.client.user', 'inquiry.customizations', 'inquiry.packagingBalance'])->findOrFail($id);

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
}
