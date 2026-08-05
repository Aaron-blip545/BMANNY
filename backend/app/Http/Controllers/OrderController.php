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
            'business_client_id' => 'required|exists:business_clients,business_client_id',
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
                'business_client_id' => $request->business_client_id,
                'quotation_id' => $quotation->quotation_id,
                'total_amount' => $quotation->total_amount,
                'status' => 'Processing',
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
            $quotation->update(['status' => 'Approved']);

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
}