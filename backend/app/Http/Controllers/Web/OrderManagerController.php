<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderManagerController extends Controller
{
    /**
     * Show the orders list page.
     * Visible to: order_manager, admin.
     */
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

    $order = Order::findOrFail($id);
    $order->status = $validated['status'];
    $order->save();

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

    $order = Order::findOrFail($id);
    $order->courier_name = $validated['courier_name'];
    $order->courier_tracking_number = $validated['courier_tracking_number'];
    $order->save();

    return redirect()->route('orders.index')->with('success', 'Tracking info updated.');
}

}
