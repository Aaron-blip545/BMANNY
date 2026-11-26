<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ClientPackagingBalance;
use App\Models\Inquiry;
use App\Models\InquiryCustomization;
use App\Models\Order;
use App\Models\ProductRequestReview;
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
            'customizations.*.selected_package' => 'nullable|string|max:40',
            'customizations.*.packaging_finish' => 'nullable|string', // Matte, Glossy, Foil
            'customizations.*.serving_size' => 'nullable|string',
            'customizations.*.formulation_notes' => 'nullable|string',
            'customizations.*.requested_ingredient_note' => 'nullable|string|max:2000',
            'customizations.*.client_notes' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            // Create Parent B2B Inquiry
            $inquiry = Inquiry::create([
                // FIXED: column is client_id (see inquiries migration)
                'client_id' => $request->client_id,
                'status' => 'new',
            ]);

            // Save Customization & Packaging Requirements
            foreach ($request->customizations as $cust) {
                InquiryCustomization::create([
                    'inquiry_id' => $inquiry->inquiry_id,
                    'customization_type' => $cust['customization_type'] ?? 'Custom Rebrand & Packaging',
                    'selected_package' => $cust['selected_package'] ?? null,
                    'packaging_type' => $cust['packaging_type'],
                    'packaging_finish' => $cust['packaging_finish'] ?? null,
                    'serving_size' => $cust['serving_size'] ?? null,
                    'formulation_notes' => $cust['formulation_notes'] ?? null,
                    'requested_ingredient_note' => $cust['requested_ingredient_note'] ?? null,
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
        $inquiries = Inquiry::with([
            'customizations',
            'quotation.order',
            'productRequestReview.suggestedVariant.productType',
            'productRequestReview.suggestedPackaging',
        ])
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
                        'customization_id' => $c->customization_id,
                        'selected_package' => $c->selected_package,
                        'packaging_type' => $c->packaging_type,
                        'serving_size'   => $c->serving_size,
                        'requested_ingredient_note' => $c->requested_ingredient_note,
                        'design_file_path' => $c->design_file_path ? asset('storage/' . $c->design_file_path) : null,
                        'client_notes'   => $c->client_notes,
                    ])->values(),
                    'has_quotation'        => $inquiry->quotation !== null,
                    'has_order'            => $inquiry->quotation?->order !== null,
                    'quotation_id'         => $inquiry->quotation?->quotation_id,
                    'quotation_amount'     => $inquiry->quotation?->total_amount,
                    'quotation_payment_due_amount' => $inquiry->quotation?->initial_payment_amount !== null
                        ? (float) $inquiry->quotation->initial_payment_amount
                        : ($inquiry->quotation?->total_amount
                            ? round((float) $inquiry->quotation->total_amount / 2, 2)
                            : null),
                    'quotation_balance_due_amount' => $inquiry->quotation?->balance_payment_amount !== null
                        ? (float) $inquiry->quotation->balance_payment_amount
                        : ($inquiry->quotation?->total_amount
                            ? round((float) $inquiry->quotation->total_amount / 2, 2)
                            : null),
                    'quotation_status'     => $inquiry->quotation?->status,
                    'quotation_item_details' => $inquiry->quotation?->item_details,
                    'quotation_valid_until' => $inquiry->quotation?->valid_until,
                    'quotation_payment_method' => $inquiry->quotation?->payment_method,
                    'quotation_created_at' => $inquiry->quotation?->created_at,
                    'product_specification'=> $inquiry->quotation?->product_specification,
                    'payment_submitted_at' => $inquiry->quotation?->payment_submitted_at,
                    'manufacturing_review' => $inquiry->productRequestReview ? [
                        'status' => $inquiry->productRequestReview->status,
                        'response_notes' => $inquiry->productRequestReview->response_notes,
                        'reviewed_at' => $inquiry->productRequestReview->reviewed_at,
                        'suggested_variant' => $inquiry->productRequestReview->suggestedVariant ? [
                            'name' => $inquiry->productRequestReview->suggestedVariant->name,
                            'product_name' => $inquiry->productRequestReview->suggestedVariant->productType?->name,
                        ] : null,
                        'suggested_packaging' => $inquiry->productRequestReview->suggestedPackaging ? [
                            'name' => $inquiry->productRequestReview->suggestedPackaging->name,
                        ] : null,
                    ] : null,
                    'cancelled_at'         => $inquiry->cancelled_at,
                    'cancellation_reason'  => $inquiry->cancellation_reason,
                ];
            })
            ->reverse()
            ->values();

        return response()->json($inquiries);
    }

    /**
     * Let a customer cancel their own inquiry.
     *
     * Eligible states:
     *  - No quotation yet (pending/reviewed status)
     *  - Quotation sent but payment NOT yet submitted
     *
     * Blocked once:
     *  - Payment has been submitted (awaiting confirmation)
     *  - An order already exists for this inquiry
     */
    public function cancel(Request $request, $inquiry_id)
    {
        $request->validate([
            'cancellation_reason' => 'required|string|min:5|max:1000',
        ]);

        $client = $request->user()->businessClient;

        if (! $client) {
            return response()->json(['message' => 'No business client profile found.'], 422);
        }

        $inquiry = Inquiry::with('quotation.order')->findOrFail($inquiry_id);

        if ((int) $inquiry->client_id !== (int) $client->client_id) {
            return response()->json(['message' => 'This inquiry does not belong to you.'], 403);
        }

        $quotation = $inquiry->quotation;

        // Block if an order already exists
        if ($quotation && $quotation->order !== null) {
            return response()->json(['message' => 'An order has already been created from this inquiry and can no longer be cancelled here.'], 422);
        }

        // Block if payment proof has been submitted (awaiting sales agent confirmation)
        if ($quotation && $quotation->payment_submitted_at !== null) {
            return response()->json(['message' => 'Payment has already been submitted. Please contact our sales team to cancel.'], 422);
        }

        // Allow: no quotation yet (pending/reviewed) OR quotation sent but unpaid
        if ($quotation === null && ! in_array($inquiry->status, ['new', 'for_quotation', 'follow_up'], true)) {
            return response()->json(['message' => 'This inquiry cannot be cancelled in its current state.'], 422);
        }

        $inquiry->update([
            'status'               => 'cancelled',
            'cancelled_at'         => now(),
            'cancellation_reason'  => $request->cancellation_reason,
        ]);

        $clientName = $client->business_name ?? $request->user()->full_name ?? 'Client';
        NotificationService::sendToRoles(
            ['sales_agent', 'admin'],
            'inquiry',
            'Inquiry Cancelled by Client',
            "{$clientName} cancelled Inquiry #{$inquiry->inquiry_id}. Reason: {$request->cancellation_reason}",
            [
                'inquiry_id' => $inquiry->inquiry_id,
                'client_id'  => $client->client_id,
                'cancelled'  => true,
            ]
        );

        return response()->json([
            'message' => 'Inquiry cancelled.',
            'inquiry' => $inquiry->fresh(),
        ]);
    }

    /**
     * Quick-reorder: clone an existing order's customizations into a fresh
     * pending Inquiry so the customer doesn't have to re-fill the inquiry
     * form from scratch.
     *
     * The original order must belong to the authenticated client, and it
     * must be in a terminal status (completed or delivered) before we
     * allow a reorder.
     */
    public function reorder(Request $request, $order_id)
    {
        $client = $request->user()->businessClient;

        if (! $client) {
            return response()->json(['message' => 'No business client profile found.'], 422);
        }

        // Load order with customization chain
        $order = Order::with([
            'quotation.inquiry.customizations',
        ])->findOrFail($order_id);

        // Ensure this order belongs to the authenticated client
        if ((int) $order->client_id !== (int) $client->client_id) {
            return response()->json(['message' => 'This order does not belong to you.'], 403);
        }

        // Only allow reorder from completed/delivered orders
        if (! in_array($order->status, ['completed', 'delivered'], true)) {
            return response()->json([
                'message' => 'You can only reorder from completed or delivered orders.',
            ], 422);
        }

        $originalCustomizations = $order->quotation?->inquiry?->customizations;

        if (! $originalCustomizations || $originalCustomizations->isEmpty()) {
            return response()->json([
                'message' => 'No customization details found on the original order to clone.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Create new inquiry
            $newInquiry = Inquiry::create([
                'client_id' => $client->client_id,
                'status'    => 'new',
            ]);

            // Clone each customization from the original inquiry
            foreach ($originalCustomizations as $cust) {
                // Append a reorder note to client_notes for audit tracing
                $existingNotes = $cust->client_notes ?? '';
                $reorderTag    = "[Reorder from Order #{$order->order_id}]";
                $newNotes      = $existingNotes
                    ? "{$existingNotes} | {$reorderTag}"
                    : $reorderTag;

                InquiryCustomization::create([
                    'inquiry_id'                => $newInquiry->inquiry_id,
                    'customization_type'        => $cust->customization_type ?? 'Custom Rebrand & Packaging',
                    'selected_package'          => $cust->selected_package,
                    'packaging_type'            => $cust->packaging_type,
                    'packaging_finish'          => $cust->packaging_finish,
                    'serving_size'              => $cust->serving_size,
                    'formulation_notes'         => $cust->formulation_notes,
                    'requested_ingredient_note' => $cust->requested_ingredient_note,
                    'design_file_path'          => $cust->design_file_path,
                    'client_notes'              => $newNotes,
                ]);
            }

            DB::commit();

            // Notify sales agents and admin
            $clientName = $client->business_name ?? $request->user()->full_name;
            NotificationService::sendToRoles(
                ['sales_agent', 'admin'],
                'inquiry',
                'Reorder Inquiry Received',
                "{$clientName} submitted a reorder based on Order #{$order->order_id}",
                [
                    'inquiry_id'       => $newInquiry->inquiry_id,
                    'client_id'        => $client->client_id,
                    'original_order_id'=> $order->order_id,
                ]
            );

            return response()->json([
                'message' => 'Reorder inquiry submitted successfully. Our team will be in touch shortly.',
                'inquiry' => $newInquiry->load('customizations'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error'   => 'Failed to submit reorder.',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Return all Gold/Elite stored packaging (MOQ) balances for the authenticated customer.
     */
    public function packagingBalances(Request $request)
    {
        $client = $request->user()->businessClient;
        if (! $client) {
            return response()->json([]);
        }

        $balances = ClientPackagingBalance::with('sourceOrder')
            ->where('client_id', $client->client_id)
            ->orderByDesc('updated_at')
            ->get()
            ->map(function (ClientPackagingBalance $balance) {
                $status = $balance->effectiveStatus();
                if ($balance->status !== $status) {
                    $balance->update(['status' => $status]);
                }

                $needsReplenishment = $balance->needsReplenishment();
                $effectiveMin = $needsReplenishment
                    ? (int) $balance->batch_min_quantity
                    : min((int) $balance->batch_min_quantity, (int) $balance->remaining_pouches);
                $sourceStatus = $balance->sourceOrder?->status;
                $canReorder = ! $balance->sourceOrder || in_array($sourceStatus, ['completed', 'delivered'], true);

                return [
                    'balance_id'                   => $balance->balance_id,
                    'source_order_id'              => $balance->source_order_id,
                    'source_order_status'          => $sourceStatus,
                    'can_reorder'                  => $canReorder,
                    'brand_name'                   => $balance->brand_name,
                    'package_slug'                 => $balance->package_slug,
                    'package_name'                 => ucfirst($balance->package_slug) . ' Package',
                    'total_pouches'                => (int) $balance->total_pouches,
                    'used_pouches'                 => (int) $balance->used_pouches,
                    'remaining_pouches'            => (int) $balance->remaining_pouches,
                    'production_unit_cost'         => (float) $balance->production_unit_cost,
                    'packaging_unit_cost'          => (float) $balance->packaging_unit_cost,
                    'batch_min_quantity'           => (int) $balance->batch_min_quantity,
                    'min_order_quantity'           => $effectiveMin,
                    'max_order_quantity'           => $needsReplenishment ? (int) $balance->total_pouches : (int) $balance->remaining_pouches,
                    'cylinder_paid'                => (bool) $balance->cylinder_paid,
                    'packaging_replenishment_cost' => $balance->packagingReplenishmentCost(),
                    'expires_at'                   => $balance->expires_at?->toIso8601String(),
                    'is_expired'                   => $balance->isExpired(),
                    'needs_replenishment'          => $needsReplenishment,
                    'status'                       => $status,
                ];
            })
            ->values();

        return response()->json($balances);
    }

    /**
     * Submit a Gold/Elite repeat-batch reorder (when remaining pouches > 0)
     * or packaging replenishment (strictly unlocked only when remaining pouches === 0 or expired).
     */
    public function reorderFromBalance(Request $request, $balance_id)
    {
        $client = $request->user()->businessClient;
        if (! $client) {
            return response()->json(['message' => 'No business client profile found.'], 422);
        }

        $balance = ClientPackagingBalance::with([
            'sourceOrder.quotation.inquiry.customizations',
            'sourceOrder.quotation.inquiry.productRequestReview',
        ])->findOrFail($balance_id);

        if ((int) $balance->client_id !== (int) $client->client_id) {
            return response()->json(['message' => 'This packaging balance does not belong to you.'], 403);
        }

        if ($balance->sourceOrder && ! in_array($balance->sourceOrder->status, ['completed', 'delivered'], true)) {
            return response()->json([
                'message' => 'You can only reorder once your initial order is completed.',
            ], 422);
        }

        $validated = $request->validate([
            'batch_quantity' => 'required|integer|min:1',
            'request_replenishment' => 'nullable|boolean',
        ]);

        $batchQty = (int) $validated['batch_quantity'];
        $needsReplenishment = $balance->needsReplenishment();

        // Strict guard: refill is ONLY allowed once remaining pouches reach 0 (or expired).
        if (! $needsReplenishment && ! empty($validated['request_replenishment'])) {
            return response()->json([
                'message' => 'Packaging refill is only available once your remaining MOQ pouches reach 0.',
            ], 422);
        }

        if ($needsReplenishment) {
            if ($batchQty < (int) $balance->batch_min_quantity || $batchQty > (int) $balance->total_pouches) {
                return response()->json([
                    'message' => "Batch quantity must be between {$balance->batch_min_quantity} and {$balance->total_pouches} pouches.",
                ], 422);
            }
            $inquiryType = 'packaging_replenishment';
        } else {
            $effectiveMin = min((int) $balance->batch_min_quantity, (int) $balance->remaining_pouches);
            if ($batchQty < $effectiveMin || $batchQty > (int) $balance->remaining_pouches) {
                return response()->json([
                    'message' => "Batch quantity must be between {$effectiveMin} and {$balance->remaining_pouches} remaining pouches.",
                ], 422);
            }
            $inquiryType = 'reorder_batch';
        }

        $sourceInquiry = $balance->sourceOrder?->quotation?->inquiry;
        $sourceCustomizations = $sourceInquiry?->customizations;
        $sourceReview = $sourceInquiry?->productRequestReview;

        DB::beginTransaction();
        try {
            $newInquiry = Inquiry::create([
                'client_id'              => $client->client_id,
                'status'                 => 'for_quotation',
                'inquiry_type'           => $inquiryType,
                'packaging_balance_id'   => $balance->balance_id,
                'reorder_batch_quantity' => $batchQty,
                'source_order_id'        => $balance->source_order_id,
            ]);

            $tag = $inquiryType === 'packaging_replenishment'
                ? "[Packaging Replenishment ({$balance->total_pouches} pouches, Cylinder Paid) + {$batchQty} Batch from Order #{$balance->source_order_id}]"
                : "[Repeat Batch Reorder: {$batchQty} pouches from Stored MOQ ({$balance->remaining_pouches} left) — Order #{$balance->source_order_id}]";

            if ($sourceCustomizations && $sourceCustomizations->isNotEmpty()) {
                foreach ($sourceCustomizations as $cust) {
                    $existingNotes = $cust->client_notes ?? '';
                    InquiryCustomization::create([
                        'inquiry_id'                => $newInquiry->inquiry_id,
                        'customization_type'        => ($inquiryType === 'packaging_replenishment' ? 'Packaging Replenishment — ' : 'Repeat Batch — ') . ucfirst($balance->package_slug) . ' Package',
                        'selected_package'          => $balance->package_slug,
                        'packaging_type'            => $cust->packaging_type ?? 'Stand-up pouch, 12 × 20 cm',
                        'packaging_finish'          => $cust->packaging_finish ?? 'Full-color pouch print',
                        'serving_size'              => "120 g × {$batchQty} pouches",
                        'formulation_notes'         => $cust->formulation_notes,
                        'requested_ingredient_note' => $cust->requested_ingredient_note,
                        'design_file_path'          => $cust->design_file_path,
                        'client_notes'              => $existingNotes ? "{$existingNotes} | {$tag}" : $tag,
                    ]);
                }
            } else {
                InquiryCustomization::create([
                    'inquiry_id'         => $newInquiry->inquiry_id,
                    'customization_type' => ($inquiryType === 'packaging_replenishment' ? 'Packaging Replenishment — ' : 'Repeat Batch — ') . ucfirst($balance->package_slug) . ' Package',
                    'selected_package'   => $balance->package_slug,
                    'packaging_type'     => 'Stand-up pouch, 12 × 20 cm',
                    'packaging_finish'   => 'Full-color pouch print',
                    'serving_size'       => "120 g × {$batchQty} pouches",
                    'client_notes'       => "Brand: {$balance->brand_name} | {$tag}",
                ]);
            }

            // Auto-carry approved Product Control review so Sales can quote immediately
            ProductRequestReview::create([
                'inquiry_id'             => $newInquiry->inquiry_id,
                'suggested_variant_id'   => $sourceReview?->suggested_variant_id,
                'suggested_packaging_id' => $sourceReview?->suggested_packaging_id,
                'status'                 => 'available',
                'response_notes'         => 'Auto-approved from previous ' . ucfirst($balance->package_slug) . " order (#{$balance->source_order_id}).",
                'reviewed_at'            => now(),
            ]);

            DB::commit();

            $clientName = $client->business_name ?? $request->user()->full_name;
            $notifTitle = $inquiryType === 'packaging_replenishment'
                ? 'Packaging Replenishment Request'
                : 'Repeat Batch Reorder Received';
            $notifBody = $inquiryType === 'packaging_replenishment'
                ? "{$clientName} requested packaging replenishment (" . number_format($balance->total_pouches) . " pouches, cylinder already paid) + {$batchQty}-pouch batch."
                : "{$clientName} requested a repeat batch of {$batchQty} pouches from stored " . ucfirst($balance->package_slug) . ' packaging.';

            NotificationService::sendToRoles(
                ['sales_agent', 'admin'],
                'inquiry',
                $notifTitle,
                $notifBody,
                [
                    'inquiry_id'           => $newInquiry->inquiry_id,
                    'client_id'            => $client->client_id,
                    'packaging_balance_id' => $balance->balance_id,
                    'inquiry_type'         => $inquiryType,
                ]
            );

            return response()->json([
                'message' => $inquiryType === 'packaging_replenishment'
                    ? 'Packaging replenishment request submitted to Sales.'
                    : "Repeat batch reorder ({$batchQty} pouches) submitted to Sales.",
                'inquiry' => $newInquiry->load(['customizations', 'packagingBalance']),
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'error'   => 'Failed to submit batch reorder.',
                'details' => $e->getMessage(),
            ], 500);
        }
    }
}
