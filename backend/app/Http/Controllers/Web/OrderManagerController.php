<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OrderManagerController extends Controller
{
    /**
     * Show the orders list page.
     * Visible to: order_manager, admin.
     */
    public function dashboard(): Response
    {
        $statusCounts = Order::select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        return Inertia::render('order-manager/dashboard', [
            'stats' => [
                'pending'     => $statusCounts['pending']     ?? 0,
                'approved'    => $statusCounts['approved']    ?? 0,
                'inProduction'=> ($statusCounts['in_production'] ?? 0) + ($statusCounts['packed'] ?? 0),
                'forDelivery' => ($statusCounts['for_delivery'] ?? 0) + ($statusCounts['delivered'] ?? 0),
            ],
            'recentOrders' => Order::with('client')
                ->orderByDesc('created_at')
                ->limit(8)
                ->get()
                ->map(fn ($o) => [
                    'order_id'   => $o->order_id,
                    'status'     => $o->status,
                    'created_at' => $o->created_at,
                    'client'     => $o->client ? ['business_name' => $o->client->business_name] : null,
                ]),
        ]);
    }

    public function index(): Response
    {
        $orders = Order::with([
            'client.user',  // business name + contact person
            'quotation',    // amount reference
        ])
        ->orderByDesc('created_at')
        ->get();

        return Inertia::render('orders/index', [
            'orders' => $orders,
        ]);
    }

    /**
     * Update the production / delivery status of an order.
     * PATCH /orders/{id}/status
     */
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            // CHANGED: matches Figure 6.3 exactly now.
            'status' => 'required|in:pending,approved,in_production,packed,for_delivery,delivered,completed,cancelled',
        ]);

        $order = Order::with('client.user')->findOrFail($id);
        $order->status = $validated['status'];
        $order->save();

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

        return redirect()->route('orders.index')
            ->with('success', "Order #{$order->order_id} status updated to {$order->status}.");
    }

    /**
     * Record the courier's tracking info once J&T notifies you it shipped.
     * Kept separate from updateStatus so this doesn't force a status change
     * every time you just want to add/edit the tracking number.
     * PATCH /orders/{id}/tracking
     */
    public function updateTracking(Request $request, $id)
    {
        $validated = $request->validate([
            'courier_name' => 'nullable|string|max:100',
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

        // Notify client if tracking info is provided
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
