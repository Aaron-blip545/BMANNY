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
                // FIXED: 'Processing' isn't in the orders.status enum
                // (pending, processing, completed, cancelled) - lowercase.
                'status' => 'processing',
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

                // Deduct stock from warehouse product table
                $product = Product::findOrFail($item['product_id']);

                if ($product->stock_quantity < $item['quantity']) {
                    throw new \Exception("Insufficient stock for product: {$product->name}");
                }

                $product->decrement('stock_quantity', $item['quantity']);
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

            return [
                'order_id'                 => $order->order_id,
                'brand_name'               => $brandName,
                'status'                   => $order->status,
                'total_amount'             => $order->total_amount,
                'internal_tracking_number' => $order->internal_tracking_number,
                'created_at'               => $order->created_at,
                'item_details'             => $order->quotation?->item_details,
                'valid_until'              => $order->quotation?->valid_until,
                'inquiry_id'               => $order->quotation?->inquiry?->inquiry_id,
                'customizations'           => $order->quotation?->inquiry?->customizations
                    ?->map(fn ($c) => [
                        'packaging_type' => $c->packaging_type,
                        'serving_size'   => $c->serving_size,
                        'client_notes'   => $c->client_notes,
                    ])->values() ?? [],
            ];
        })->values();

        return response()->json($orders);
    }
}