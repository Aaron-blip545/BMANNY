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
            'status' => 'required|in:pending,processing,completed,cancelled',
        ]);

        $order = Order::findOrFail($id);
        $order->status = $validated['status'];
        $order->save();

        return redirect()->route('orders.index')
            ->with('success', "Order #{$order->order_id} status updated to {$order->status}.");
    }
}
