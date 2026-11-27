<?php

namespace App\Services;

use App\Models\BusinessClient;
use App\Models\Inquiry;
use App\Models\Order;
use App\Models\Quotation;

class ClientRiskService
{
    public const AUTO_FLAG_STRIKE_THRESHOLD = 3;

    /**
     * Recompute risk strikes for a business client from lost/cancelled inquiries,
     * expired/rejected quotations, and cancelled orders. Auto-flags the client
     * as a nuisance user once strikes reach the threshold.
     */
    public static function evaluateClient(int $clientId): ?BusinessClient
    {
        $client = BusinessClient::find($clientId);
        if (! $client) {
            return null;
        }

        $lostOrCancelledInquiries = Inquiry::where('client_id', $clientId)
            ->where(fn ($q) => $q->whereNotNull('cancelled_at')->orWhereIn('status', ['cancelled', 'lost']))
            ->count();

        $expiredOrRejectedQuotes = Quotation::whereHas('inquiry', fn ($q) => $q->where('client_id', $clientId))
            ->whereIn('status', ['expired', 'rejected'])
            ->count();

        $cancelledOrders = Order::where('client_id', $clientId)
            ->where('status', 'cancelled')
            ->count();

        $strikes = $lostOrCancelledInquiries + $expiredOrRejectedQuotes + $cancelledOrders;
        $wasFlagged = (bool) $client->is_flagged_nuisance;

        $updates = ['nuisance_strikes' => $strikes];

        if ($strikes >= self::AUTO_FLAG_STRIKE_THRESHOLD && ! $wasFlagged) {
            $parts = [];
            if ($lostOrCancelledInquiries > 0) {
                $parts[] = "{$lostOrCancelledInquiries} lost/cancelled " . ($lostOrCancelledInquiries === 1 ? 'inquiry' : 'inquiries');
            }
            if ($expiredOrRejectedQuotes > 0) {
                $parts[] = "{$expiredOrRejectedQuotes} expired/rejected " . ($expiredOrRejectedQuotes === 1 ? 'quotation' : 'quotations');
            }
            if ($cancelledOrders > 0) {
                $parts[] = "{$cancelledOrders} cancelled " . ($cancelledOrders === 1 ? 'order' : 'orders');
            }

            $reason = 'Auto-flagged (' . $strikes . ' strikes): ' . implode(', ', $parts) . '.';
            $updates['is_flagged_nuisance'] = true;
            $updates['nuisance_reason'] = $reason;
            $updates['nuisance_flagged_at'] = now();
            $updates['nuisance_flagged_by'] = null;

            $client->update($updates);

            NotificationService::sendToRoles(
                ['sales_agent', 'admin'],
                'inquiry',
                'Nuisance Client Flagged',
                "{$client->business_name} was automatically flagged as a nuisance/high-risk client ({$reason}).",
                ['client_id' => $client->client_id, 'nuisance' => true]
            );

            return $client->fresh();
        }

        $client->update($updates);

        return $client->fresh();
    }
}
