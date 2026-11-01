<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Order;

class PaymentReceiptController extends Controller
{
    public function show($id, string $milestone)
    {
        abort_unless(in_array($milestone, ['initial', 'balance'], true), 404);
        $order = Order::with(['client.user', 'quotation.inquiry'])->findOrFail($id);
        $verifiedAt = $milestone === 'initial' ? $order->initial_payment_verified_at : $order->balance_payment_verified_at;
        abort_unless($verifiedAt, 404, 'This payment has not been verified.');

        $amount = $milestone === 'initial' ? $order->initial_payment_amount : $order->balance_payment_amount;
        return view('receipts.payment-acknowledgment', compact('order', 'milestone', 'amount', 'verifiedAt'));
    }
}
