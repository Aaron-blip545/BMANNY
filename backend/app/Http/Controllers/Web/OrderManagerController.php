<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\DeliveryBatch;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductionSchedule;
use App\Services\InventoryService;
use App\Services\NotificationService;
use App\Services\ProductionPlanningService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class OrderManagerController extends Controller
{
    /**
     * Order Manager Dashboard with accurate KPIs, capacity overview,
     * priority orders, upcoming production schedules, and inventory risk alerts.
     */
    public function dashboard(): Response
    {
        $statusCounts = Order::select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $products = Product::all();
        $inventoryRisks = [
            'outOfStock'   => $products->filter(fn ($p) => (float) $p->stock_quantity <= 0)->count(),
            'reorder'      => $products->filter(fn ($p) => $p->stock_status === 'reorder')->count(),
            'overstock'    => $products->filter(fn ($p) => $p->stock_status === 'overstock')->count(),
            'expiringSoon' => $products->filter(fn ($p) => $p->expiry_status === 'expiring_soon')->count(),
            'expired'      => $products->filter(fn ($p) => $p->expiry_status === 'expired')->count(),
        ];

        $priorityOrders = Order::with(['client', 'latestProductionSchedule'])
            ->whereIn('priority', ['rush', 'high'])
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->orderByRaw("CASE WHEN priority = 'rush' THEN 1 WHEN priority = 'high' THEN 2 ELSE 3 END")
            ->orderBy('created_at')
            ->limit(6)
            ->get()
            ->map(fn ($o) => [
                'order_id'                  => $o->order_id,
                'status'                    => $o->status,
                'priority'                  => $o->priority,
                'estimated_completion_date' => $o->estimated_completion_date?->format('Y-m-d'),
                'estimated_delivery_date'   => $o->estimated_delivery_date?->format('Y-m-d'),
                'client'                    => $o->client ? ['business_name' => $o->client->business_name] : null,
                'schedule_status'           => $o->latestProductionSchedule?->production_status,
            ]);

        $upcomingSchedules = ProductionSchedule::with(['order.client'])
            ->whereIn('production_status', ['scheduled', 'in_progress', 'delayed'])
            ->orderByRaw("CASE WHEN priority = 'rush' THEN 1 WHEN priority = 'high' THEN 2 ELSE 3 END")
            ->orderBy('production_start_date')
            ->limit(6)
            ->get();

        return Inertia::render('order-manager/dashboard', [
            'stats' => [
                'approved'     => $statusCounts['approved'] ?? 0,
                'inProduction' => ($statusCounts['in_production'] ?? 0) + ($statusCounts['packed'] ?? 0),
                'forDelivery'  => ($statusCounts['ready_for_pickup'] ?? 0) + ($statusCounts['for_delivery'] ?? 0) + ($statusCounts['delivered'] ?? 0),
                'completed'    => $statusCounts['completed'] ?? 0,
            ],
            'capacityOverview'  => ProductionPlanningService::getCapacityOverview(),
            'inventoryRisks'    => $inventoryRisks,
            'priorityOrders'    => $priorityOrders,
            'upcomingSchedules' => $upcomingSchedules,
            'recentOrders'      => Order::with('client')
                ->orderByDesc('created_at')
                ->limit(8)
                ->get()
                ->map(fn ($o) => [
                    'order_id'   => $o->order_id,
                    'status'     => $o->status,
                    'priority'   => $o->priority ?? 'normal',
                    'created_at' => $o->created_at,
                    'client'     => $o->client ? ['business_name' => $o->client->business_name] : null,
                ]),
        ]);
    }

    /**
     * Orders Operations page with priority highlighting, production schedules,
     * delivery batches, and inventory/capacity-linked lead-time estimates.
     */
    public function index(): Response
    {
        $orders = Order::with([
            'client.user',
            'quotation.inquiry.customizations',
            'items.product',
            'latestProductionSchedule',
            'deliveryBatches',
        ])
        ->orderByRaw("CASE WHEN status IN ('completed','cancelled') THEN 1 ELSE 0 END")
        ->orderByRaw("CASE WHEN priority = 'rush' THEN 1 WHEN priority = 'high' THEN 2 ELSE 3 END")
        ->orderByDesc('created_at')
        ->get()
        ->map(function (Order $order) {
            $arr = $order->toArray();
            $arr['ordered_quantity'] = InventoryService::parseOrderQuantity($order);
            if (! in_array($order->status, ['completed', 'cancelled'], true)) {
                $arr['planning'] = ProductionPlanningService::estimateOrderTimeline($order);
            } else {
                $arr['planning'] = null;
            }
            return $arr;
        });

        return Inertia::render('orders/index', [
            'orders'           => $orders,
            'capacityOverview' => ProductionPlanningService::getCapacityOverview(),
        ]);
    }

    /**
     * Production Schedules & Capacity Planning workspace.
     * GET /production-schedules
     */
    public function schedules(): Response
    {
        $schedules = ProductionSchedule::with(['order.client', 'order.deliveryBatches', 'scheduler'])
            ->orderByRaw("CASE WHEN production_status IN ('completed','cancelled') THEN 1 ELSE 0 END")
            ->orderByRaw("CASE WHEN priority = 'rush' THEN 1 WHEN priority = 'high' THEN 2 ELSE 3 END")
            ->orderBy('production_start_date')
            ->get();

        $scheduledOrderIds = ProductionSchedule::whereNotIn('production_status', ['cancelled'])
            ->pluck('order_id')
            ->unique()
            ->all();

        $unscheduledOrders = Order::with(['client', 'quotation.inquiry.customizations', 'items.product'])
            ->whereIn('status', ['approved', 'in_production'])
            ->whereNotIn('order_id', $scheduledOrderIds)
            ->orderByRaw("CASE WHEN priority = 'rush' THEN 1 WHEN priority = 'high' THEN 2 ELSE 3 END")
            ->orderBy('created_at')
            ->get()
            ->map(function (Order $order) {
                return [
                    'order_id'         => $order->order_id,
                    'status'           => $order->status,
                    'priority'         => $order->priority ?? 'normal',
                    'total_amount'     => $order->total_amount,
                    'created_at'       => $order->created_at,
                    'client'           => $order->client ? [
                        'business_name'  => $order->client->business_name,
                        'contact_person' => $order->client->contact_person,
                    ] : null,
                    'planning'         => ProductionPlanningService::estimateOrderTimeline($order),
                ];
            });

        return Inertia::render('order-manager/schedules', [
            'schedules'         => $schedules,
            'unscheduledOrders' => $unscheduledOrders,
            'capacityOverview'  => ProductionPlanningService::getCapacityOverview(),
        ]);
    }

    /**
     * Create a production schedule for an accepted order.
     * POST /orders/{id}/schedule
     */
    public function storeSchedule(Request $request, $id)
    {
        $order = Order::with(['client.user', 'quotation.inquiry.customizations', 'items.product'])->findOrFail($id);

        $validated = $request->validate([
            'production_start_date' => 'required|date',
            'target_end_date'       => 'required|date|after_or_equal:production_start_date',
            'planned_quantity'      => 'required|integer|min:1',
            'daily_capacity_units'  => 'nullable|integer|min:1|max:100000',
            'priority'              => 'required|in:normal,high,rush',
            'production_notes'      => 'nullable|string|max:1000',
        ]);

        $count = ProductionSchedule::where('order_id', $order->order_id)->count() + 1;
        $batchCode = sprintf('PRD-%04d-B%d', $order->order_id, $count);

        $schedule = ProductionSchedule::create([
            'order_id'              => $order->order_id,
            'batch_code'            => $batchCode,
            'production_start_date' => $validated['production_start_date'],
            'target_end_date'       => $validated['target_end_date'],
            'planned_quantity'      => $validated['planned_quantity'],
            'daily_capacity_units'  => $validated['daily_capacity_units'] ?? ProductionPlanningService::DEFAULT_DAILY_CAPACITY,
            'priority'              => $validated['priority'],
            'production_status'     => $order->status === 'in_production' ? 'in_progress' : 'scheduled',
            'actual_start_date'     => $order->status === 'in_production' ? now()->toDateString() : null,
            'production_notes'      => $validated['production_notes'] ?? null,
            'scheduled_by'          => $request->user('web')?->user_id,
        ]);

        $estimatedDelivery = Carbon::parse($validated['target_end_date'])->addDays(2)->format('Y-m-d');
        $order->update([
            'priority'                  => $validated['priority'],
            'estimated_completion_date' => $validated['target_end_date'],
            'estimated_delivery_date'   => $estimatedDelivery,
        ]);

        if ($order->client?->user) {
            NotificationService::send(
                $order->client->user->user_id,
                'order',
                "Production Scheduled for Order #{$order->order_id}",
                "Batch {$batchCode} is scheduled from {$validated['production_start_date']} to {$validated['target_end_date']} (est. release: {$estimatedDelivery}).",
                [
                    'order_id'    => $order->order_id,
                    'schedule_id' => $schedule->schedule_id,
                    'batch_code'  => $batchCode,
                ]
            );
        }

        return back()->with('success', "Production schedule {$batchCode} created for Order #{$order->order_id}.");
    }

    /**
     * Update an existing production schedule.
     * PATCH /production-schedules/{id}
     */
    public function updateSchedule(Request $request, $scheduleId)
    {
        $schedule = ProductionSchedule::with('order')->findOrFail($scheduleId);

        $validated = $request->validate([
            'production_start_date' => 'sometimes|date',
            'target_end_date'       => 'sometimes|date|after_or_equal:production_start_date',
            'actual_start_date'     => 'nullable|date',
            'actual_end_date'       => 'nullable|date',
            'planned_quantity'      => 'sometimes|integer|min:1',
            'daily_capacity_units'  => 'sometimes|integer|min:1|max:100000',
            'priority'              => 'sometimes|in:normal,high,rush',
            'production_status'     => 'sometimes|in:scheduled,in_progress,completed,delayed,cancelled',
            'production_notes'      => 'nullable|string|max:1000',
        ]);

        if (($validated['production_status'] ?? null) === 'in_progress' && ! $schedule->actual_start_date && empty($validated['actual_start_date'])) {
            $validated['actual_start_date'] = now()->toDateString();
        }
        if (($validated['production_status'] ?? null) === 'completed' && ! $schedule->actual_end_date && empty($validated['actual_end_date'])) {
            $validated['actual_end_date'] = now()->toDateString();
        }

        $schedule->update($validated);

        if ($schedule->order) {
            $orderUpdates = [];
            if (isset($validated['priority'])) {
                $orderUpdates['priority'] = $validated['priority'];
            }
            if (isset($validated['target_end_date'])) {
                $orderUpdates['estimated_completion_date'] = $validated['target_end_date'];
                $orderUpdates['estimated_delivery_date'] = Carbon::parse($validated['target_end_date'])->addDays(2)->format('Y-m-d');
            }
            if (! empty($orderUpdates)) {
                $schedule->order->update($orderUpdates);
            }
        }

        return back()->with('success', "Production schedule {$schedule->batch_code} updated.");
    }

    /**
     * Update order priority (normal / high / rush) and refresh estimates.
     * PATCH /orders/{id}/priority
     */
    public function updatePriority(Request $request, $id)
    {
        $validated = $request->validate([
            'priority' => 'required|in:normal,high,rush',
        ]);

        $order = Order::with(['latestProductionSchedule', 'quotation.inquiry.customizations', 'items.product'])->findOrFail($id);
        $estimate = ProductionPlanningService::estimateOrderTimeline($order, $validated['priority']);

        $order->update([
            'priority'                  => $validated['priority'],
            'estimated_completion_date' => $order->latestProductionSchedule?->target_end_date?->format('Y-m-d') ?? $estimate['estimated_completion_date'],
            'estimated_delivery_date'   => $order->latestProductionSchedule
                ? Carbon::parse($order->latestProductionSchedule->target_end_date)->addDays(2)->format('Y-m-d')
                : $estimate['estimated_delivery_date'],
        ]);

        if ($order->latestProductionSchedule && ! in_array($order->latestProductionSchedule->production_status, ['completed', 'cancelled'], true)) {
            $order->latestProductionSchedule->update(['priority' => $validated['priority']]);
        }

        return back()->with('success', "Order #{$order->order_id} priority updated to " . strtoupper($validated['priority']) . '.');
    }

    /**
     * Add a delivery or pickup batch for an order (supports partial bulk deliveries).
     * POST /orders/{id}/delivery-batches
     */
    public function storeDeliveryBatch(Request $request, $id)
    {
        $order = Order::with('client.user')->findOrFail($id);

        $validated = $request->validate([
            'quantity'         => 'required|integer|min:1',
            'fulfillment_type' => 'required|in:delivery,pickup',
            'delivery_status'  => 'nullable|in:scheduled,packed,ready_for_pickup,for_delivery,delivered,cancelled',
            'scheduled_date'   => 'nullable|date',
            'courier_name'     => 'nullable|string|max:100',
            'tracking_number'  => 'nullable|string|max:100',
            'remarks'          => 'nullable|string|max:500',
        ]);

        $nextBatchNumber = ((int) DeliveryBatch::where('order_id', $order->order_id)->max('batch_number')) + 1;
        $status = $validated['delivery_status'] ?? 'scheduled';

        $batch = DeliveryBatch::create([
            'order_id'         => $order->order_id,
            'batch_number'     => $nextBatchNumber,
            'quantity'         => $validated['quantity'],
            'fulfillment_type' => $validated['fulfillment_type'],
            'delivery_status'  => $status,
            'scheduled_date'   => $validated['scheduled_date'] ?? null,
            'dispatched_at'    => $status === 'for_delivery' ? now() : null,
            'delivered_at'     => $status === 'delivered' ? now() : null,
            'courier_name'     => $validated['courier_name'] ?? null,
            'tracking_number'  => $validated['tracking_number'] ?? null,
            'remarks'          => $validated['remarks'] ?? null,
            'updated_by'       => $request->user('web')?->user_id,
        ]);

        if ($order->client?->user) {
            $typeLabel = $batch->fulfillment_type === 'pickup' ? 'Pickup' : 'Delivery';
            NotificationService::send(
                $order->client->user->user_id,
                'order',
                "Order #{$order->order_id} — {$typeLabel} Batch #{$batch->batch_number}",
                "{$typeLabel} batch #{$batch->batch_number} ({$batch->quantity} units) is " . str_replace('_', ' ', $batch->delivery_status) . '.',
                [
                    'order_id'     => $order->order_id,
                    'batch_id'     => $batch->batch_id,
                    'batch_number' => $batch->batch_number,
                ]
            );
        }

        return back()->with('success', "Delivery batch #{$batch->batch_number} added to Order #{$order->order_id}.");
    }

    /**
     * Update a delivery batch status, tracking, or remarks.
     * PATCH /delivery-batches/{id}
     */
    public function updateDeliveryBatch(Request $request, $batchId)
    {
        $batch = DeliveryBatch::with('order.client.user')->findOrFail($batchId);

        $validated = $request->validate([
            'quantity'         => 'sometimes|integer|min:1',
            'fulfillment_type' => 'sometimes|in:delivery,pickup',
            'delivery_status'  => 'sometimes|in:scheduled,packed,ready_for_pickup,for_delivery,delivered,cancelled',
            'scheduled_date'   => 'nullable|date',
            'courier_name'     => 'nullable|string|max:100',
            'tracking_number'  => 'nullable|string|max:100',
            'remarks'          => 'nullable|string|max:500',
        ]);

        $newStatus = $validated['delivery_status'] ?? $batch->delivery_status;
        if ($newStatus === 'for_delivery' && ! $batch->dispatched_at) {
            $validated['dispatched_at'] = now();
        }
        if ($newStatus === 'delivered' && ! $batch->delivered_at) {
            $validated['delivered_at'] = now();
        }
        $validated['updated_by'] = $request->user('web')?->user_id;

        $batch->update($validated);

        if ($batch->order?->client?->user) {
            $statusLabel = ucwords(str_replace('_', ' ', $batch->delivery_status));
            $trackingNote = $batch->tracking_number ? " ({$batch->courier_name} {$batch->tracking_number})" : '';
            NotificationService::send(
                $batch->order->client->user->user_id,
                'order',
                "Order #{$batch->order_id} — Batch #{$batch->batch_number} Update",
                "Batch #{$batch->batch_number} ({$batch->quantity} units) is now {$statusLabel}{$trackingNote}.",
                [
                    'order_id'     => $batch->order_id,
                    'batch_id'     => $batch->batch_id,
                    'batch_number' => $batch->batch_number,
                    'status'       => $batch->delivery_status,
                ]
            );
        }

        return back()->with('success', "Delivery batch #{$batch->batch_number} updated.");
    }

    /**
     * Update the production / delivery status of an order.
     * PATCH /orders/{id}/status
     */
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,in_production,packed,ready_for_pickup,for_delivery,delivered,completed,cancelled',
        ]);

        $order = Order::with(['client.user', 'items.product', 'quotation.inquiry.customizations', 'latestProductionSchedule'])->findOrFail($id);
        $previousStatus = $order->status;
        $targetStatus = $validated['status'];

        if (in_array($targetStatus, ['for_delivery', 'delivered', 'completed'], true)
            && (float) ($order->balance_payment_amount ?? 0) > 0
            && ! $order->balance_payment_verified_at
        ) {
            return redirect()->route('orders.index')->withErrors([
                'error' => 'Verify the balance payment before releasing or completing this order.',
            ]);
        }

        try {
            DB::transaction(function () use ($order, $previousStatus, $targetStatus) {
                // If transitioning to "in_production", calculate and deduct required raw materials from inventory
                if ($targetStatus === 'in_production' && $previousStatus !== 'in_production') {
                    InventoryService::deductOrderMaterials($order);
                }

                $order->status = $targetStatus;

                // Record real milestone timestamps
                $now = now();
                if ($targetStatus === 'in_production' && ! $order->production_started_at) {
                    $order->production_started_at = $now;
                } elseif ($targetStatus === 'packed' && ! $order->packed_at) {
                    $order->packed_at = $now;
                } elseif ($targetStatus === 'ready_for_pickup' && ! $order->ready_for_pickup_at) {
                    $order->ready_for_pickup_at = $now;
                } elseif ($targetStatus === 'for_delivery' && ! $order->dispatched_at) {
                    $order->dispatched_at = $now;
                } elseif ($targetStatus === 'delivered' && ! $order->delivered_at) {
                    $order->delivered_at = $now;
                } elseif ($targetStatus === 'completed' && ! $order->completed_at) {
                    $order->completed_at = $now;
                }

                $order->save();

                // Sync active production schedule if one exists
                $schedule = $order->latestProductionSchedule;
                if ($schedule && ! in_array($schedule->production_status, ['completed', 'cancelled'], true)) {
                    if ($targetStatus === 'in_production') {
                        $schedule->update([
                            'production_status' => 'in_progress',
                            'actual_start_date' => $schedule->actual_start_date ?? $now->toDateString(),
                        ]);
                    } elseif (in_array($targetStatus, ['packed', 'ready_for_pickup', 'for_delivery', 'delivered', 'completed'], true)) {
                        $schedule->update([
                            'production_status' => 'completed',
                            'actual_end_date'   => $schedule->actual_end_date ?? $now->toDateString(),
                        ]);
                    } elseif ($targetStatus === 'cancelled') {
                        $schedule->update(['production_status' => 'cancelled']);
                    }
                }
            });
        } catch (\Throwable $e) {
            Log::warning("Status update failed for Order #{$order->order_id}: " . $e->getMessage());

            return redirect()->route('orders.index')
                ->with('error', $e->getMessage())
                ->withErrors(['inventory' => $e->getMessage()]);
        }

        // Notify client about order status change
        if ($order->client && $order->client->user) {
            $statusLabel = ucwords(str_replace('_', ' ', $order->status));
            NotificationService::send(
                $order->client->user->user_id,
                'order',
                "Order #{$order->order_id} Update",
                "Your order status is now: {$statusLabel}",
                [
                    'order_id' => $order->order_id,
                    'status'   => $order->status,
                ]
            );
        }

        $successMsg = ($targetStatus === 'in_production' && $previousStatus !== 'in_production')
            ? "Order #{$order->order_id} is now In Production. Required raw materials have been deducted from inventory."
            : "Order #{$order->order_id} status updated to " . str_replace('_', ' ', $order->status) . '.';

        return redirect()->route('orders.index')
            ->with('success', $successMsg);
    }

    /**
     * Record the courier's tracking info once shipped.
     * PATCH /orders/{id}/tracking
     */
    public function updateTracking(Request $request, $id)
    {
        $validated = $request->validate([
            'courier_name'            => 'nullable|string|max:100',
            'courier_tracking_number' => 'nullable|string|max:100',
        ]);

        $order = Order::with('client.user')->findOrFail($id);

        if (array_key_exists('courier_name', $validated)) {
            $order->courier_name = $validated['courier_name'];
        }
        if (array_key_exists('courier_tracking_number', $validated)) {
            $order->courier_tracking_number = $validated['courier_tracking_number'];
        }
        $order->save();

        if ($order->client && $order->client->user && $order->courier_tracking_number) {
            NotificationService::send(
                $order->client->user->user_id,
                'order',
                "Order #{$order->order_id} Shipped",
                "Tracking number added: {$order->courier_name} ({$order->courier_tracking_number})",
                [
                    'order_id'        => $order->order_id,
                    'tracking_number' => $order->courier_tracking_number,
                    'courier_name'    => $order->courier_name,
                ]
            );
        }

        return redirect()->route('orders.index')->with('success', 'Tracking info updated.');
    }
}
