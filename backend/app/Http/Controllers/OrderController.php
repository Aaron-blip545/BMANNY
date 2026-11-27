<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Quotation;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function submitBalancePayment(Request $request, $order_id)
    {
        $client = $request->user()->businessClient;
        $order = Order::findOrFail($order_id);

        if (! $client || (int) $order->client_id !== (int) $client->client_id) {
            return response()->json(['message' => 'This order does not belong to you.'], 403);
        }
        if ($order->status !== 'ready_for_pickup') {
            return response()->json(['message' => 'The balance can only be paid once the order is ready for pickup.'], 422);
        }
        if ($order->balance_payment_verified_at) {
            return response()->json(['message' => 'The balance payment has already been verified.'], 422);
        }

        $validated = $request->validate([
            'payment_method' => 'required|in:bank_transfer',
            'proof' => 'required|image|max:5120',
        ]);

        $order->update([
            'balance_payment_method' => $validated['payment_method'],
            'balance_payment_proof_path' => $request->file('proof')->store('balance-payment-proofs', 'public'),
            'balance_payment_submitted_at' => now(),
        ]);

        \App\Services\NotificationService::sendToRoles(['sales_agent', 'admin'], 'payment', 'Balance Payment Submitted', "Balance proof was submitted for Order #{$order->order_id}.", ['order_id' => $order->order_id]);

        return response()->json(['message' => 'Balance payment proof submitted for Sales verification.', 'order' => $order->fresh()]);
    }
    public function store(Request $request)
    {
        // 1. Validate incoming approval payload
        $request->validate([
            'quotation_id' => 'required|exists:quotations,quotation_id',
            // FIXED: business_clients' primary key is client_id, not
            // business_client_id - the old rule referenced a column that
            // doesn't exist, so this validation could never pass.
            'client_id' => 'required|exists:business_clients,client_id',
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,product_id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric',
        ]);

        DB::beginTransaction();

        try {
            // 2. Fetch quotation and verify status
            $quotation = Quotation::findOrFail($request->quotation_id);

            // 3. Create the parent Order record
            $order = Order::create([
                // FIXED: matches Order's own $fillable ('client_id'), and
                // the real column on the orders table.
                'client_id' => $request->client_id,
                'quotation_id' => $quotation->quotation_id,
                'total_amount' => $quotation->total_amount,
                // Orders begin only after payment approval, so the first
                // fulfillment stage is Approved.
                'status' => 'approved',
            ]);

            // 4. Process items and update warehouse stock
            foreach ($request->items as $item) {
                // Attach item to order
                OrderItem::create([
                    'order_id' => $order->order_id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                ]);

                // Deduct stock: Check if item is a composite finished product with BOM recipe
                $productType = \App\Models\ProductType::with('recipes.rawMaterial')->find($item['product_id']);
                if ($productType && $productType->recipes->isNotEmpty()) {
                    foreach ($productType->recipes as $recipe) {
                        $requiredQty = (float) $recipe->quantity_per_unit * (float) $item['quantity'];
                        $rawMaterial = $recipe->rawMaterial;
                        if ($rawMaterial) {
                            if ((float) $rawMaterial->stock_quantity < $requiredQty) {
                                throw new \Exception("Insufficient stock for raw material: {$rawMaterial->name}. Needed: {$requiredQty} {$rawMaterial->unit_of_measure}, Available: {$rawMaterial->stock_quantity} {$rawMaterial->unit_of_measure}");
                            }
                            $rawMaterial->decrement('stock_quantity', $requiredQty);
                        }
                    }
                } else {
                    $product = Product::find($item['product_id']);
                    if ($product) {
                        if ($product->stock_quantity < $item['quantity']) {
                            throw new \Exception("Insufficient stock for: {$product->name}");
                        }
                        $product->decrement('stock_quantity', $item['quantity']);
                    }
                }
            }

            // 5. Update quotation status
            // FIXED: 'Approved' isn't in the quotations.status enum
            // (draft, sent, accepted, rejected).
            $quotation->update(['status' => 'accepted']);

            DB::commit();

            return response()->json([
                'message' => 'Order successfully created and inventory updated.',
                'order_id' => $order->order_id
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'error' => 'Order processing failed.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Return all orders that belong to the authenticated customer's
     * business client profile. Used by the mobile Orders screen.
     */
    public function myOrders(Request $request)
    {
        $user   = $request->user();
        $client = $user->businessClient;

        if (! $client) {
            return response()->json([]);
        }

        $orders = Order::with([
            'quotation.inquiry.customizations',
            'latestProductionSchedule',
            'deliveryBatches',
        ])
        ->where('client_id', $client->client_id)
        ->orderByDesc('created_at')
        ->get()
        ->map(function ($order) {
            $firstCust = $order->quotation?->inquiry?->customizations?->first();
            $brandName = null;
            if ($firstCust && $firstCust->client_notes) {
                if (preg_match('/Brand:\s*([^|]+)/i', $firstCust->client_notes, $matches)) {
                    $brandName = trim($matches[1]);
                }
            }

            $schedule = $order->latestProductionSchedule;

            return [
                'order_id'                     => $order->order_id,
                'brand_name'                   => $brandName,
                'status'                       => $order->status,
                'priority'                     => $order->priority ?? 'normal',
                'estimated_completion_date'    => $order->estimated_completion_date?->format('Y-m-d'),
                'estimated_delivery_date'      => $order->estimated_delivery_date?->format('Y-m-d'),
                'total_amount'                 => $order->total_amount,
                'initial_payment_amount'       => $order->initial_payment_amount,
                'initial_payment_verified_at'  => $order->initial_payment_verified_at,
                'balance_payment_amount'       => $order->balance_payment_amount,
                'balance_payment_submitted_at' => $order->balance_payment_submitted_at,
                'balance_payment_verified_at'  => $order->balance_payment_verified_at,
                'payment_method'               => $order->quotation?->payment_method,
                'payment_submitted_at'         => $order->quotation?->payment_submitted_at,
                'payment_proof_url'            => $order->quotation?->payment_proof_path
                    ? asset('storage/' . $order->quotation->payment_proof_path)
                    : null,
                'courier_name'                 => $order->courier_name,
                'courier_tracking_number'      => $order->courier_tracking_number,
                'production_schedule'          => $schedule ? [
                    'schedule_id'           => $schedule->schedule_id,
                    'batch_code'            => $schedule->batch_code,
                    'production_start_date' => $schedule->production_start_date?->format('Y-m-d'),
                    'target_end_date'       => $schedule->target_end_date?->format('Y-m-d'),
                    'actual_start_date'     => $schedule->actual_start_date?->format('Y-m-d'),
                    'actual_end_date'       => $schedule->actual_end_date?->format('Y-m-d'),
                    'planned_quantity'      => $schedule->planned_quantity,
                    'production_status'     => $schedule->production_status,
                ] : null,
                'delivery_batches'             => $order->deliveryBatches->map(fn ($b) => [
                    'batch_id'         => $b->batch_id,
                    'batch_number'     => $b->batch_number,
                    'quantity'         => $b->quantity,
                    'fulfillment_type' => $b->fulfillment_type,
                    'delivery_status'  => $b->delivery_status,
                    'scheduled_date'   => $b->scheduled_date?->format('Y-m-d'),
                    'dispatched_at'    => $b->dispatched_at,
                    'delivered_at'     => $b->delivered_at,
                    'courier_name'     => $b->courier_name,
                    'tracking_number'  => $b->tracking_number,
                    'remarks'          => $b->remarks,
                ])->values(),
                'timeline' => array_values(array_filter([
                    $order->initial_payment_verified_at ? ['label' => 'Initial payment verified', 'at' => $order->initial_payment_verified_at] : null,
                    ($order->production_started_at || in_array($order->status, ['in_production', 'packed', 'ready_for_pickup', 'for_delivery', 'delivered', 'completed'], true))
                        ? ['label' => 'In production', 'at' => $order->production_started_at ?? $order->updated_at] : null,
                    ($order->packed_at || in_array($order->status, ['packed', 'ready_for_pickup', 'for_delivery', 'delivered', 'completed'], true))
                        ? ['label' => 'Packed', 'at' => $order->packed_at ?? $order->updated_at] : null,
                    ($order->ready_for_pickup_at || in_array($order->status, ['ready_for_pickup', 'for_delivery', 'delivered', 'completed'], true))
                        ? ['label' => 'Ready for pickup', 'at' => $order->ready_for_pickup_at ?? $order->updated_at] : null,
                    $order->balance_payment_verified_at ? ['label' => 'Balance payment verified', 'at' => $order->balance_payment_verified_at] : null,
                    ($order->dispatched_at || in_array($order->status, ['for_delivery', 'delivered', 'completed'], true))
                        ? ['label' => 'Dispatched / Released', 'at' => $order->dispatched_at ?? $order->updated_at] : null,
                    ($order->completed_at || $order->status === 'completed')
                        ? ['label' => 'Completed', 'at' => $order->completed_at ?? $order->updated_at] : null,
                ])),
                'internal_tracking_number' => $order->internal_tracking_number,
                'created_at'               => $order->created_at,
                'item_details'             => $order->quotation?->item_details,
                'valid_until'              => $order->quotation?->valid_until,
                'product_specification'    => $order->quotation?->product_specification,
                'inquiry_id'               => $order->quotation?->inquiry?->inquiry_id,
                'customizations'           => $order->quotation?->inquiry?->customizations
                    ?->map(fn ($c) => [
                        'selected_package'          => $c->selected_package,
                        'packaging_type'            => $c->packaging_type,
                        'packaging_finish'          => $c->packaging_finish,
                        'serving_size'              => $c->serving_size,
                        'requested_ingredient_note' => $c->requested_ingredient_note,
                        'design_file_path'          => $c->design_file_path ? asset('storage/' . $c->design_file_path) : null,
                        'client_notes'              => $c->client_notes,
                    ])->values() ?? [],
            ];
        })->values();

        return response()->json($orders);
    }
}
