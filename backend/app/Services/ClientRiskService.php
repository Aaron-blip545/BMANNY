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

    /**
     * Return a detailed breakdown of why a client was flagged (or their current risk standing),
     * including every lost/cancelled inquiry, expired/rejected quotation, and cancelled order.
     */
    public static function detailedBreakdown(int $clientId): ?array
    {
        $client = BusinessClient::with('user')->find($clientId);
        if (! $client) {
            return null;
        }

        $flaggedByName = null;
        if ($client->nuisance_flagged_by) {
            $flaggedByName = \App\Models\User::where('user_id', $client->nuisance_flagged_by)->value('full_name');
        }

        $lostInquiries = Inquiry::where('client_id', $clientId)
            ->where(fn ($q) => $q->whereNotNull('cancelled_at')->orWhereIn('status', ['cancelled', 'lost']))
            ->orderByDesc('updated_at')
            ->get();

        $expiredOrRejectedQuotes = Quotation::whereHas('inquiry', fn ($q) => $q->where('client_id', $clientId))
            ->whereIn('status', ['expired', 'rejected'])
            ->orderByDesc('updated_at')
            ->get();

        $cancelledOrders = Order::with('quotation.inquiry')
            ->where('client_id', $clientId)
            ->where('status', 'cancelled')
            ->orderByDesc('updated_at')
            ->get();

        $incidents = collect();

        foreach ($lostInquiries as $inq) {
            $incidents->push([
                'type'      => 'inquiry',
                'reference' => 'Inquiry #' . $inq->inquiry_id,
                'status'    => $inq->cancelled_at ? 'cancelled' : $inq->status,
                'reason'    => trim((string) ($inq->cancellation_reason ?? '')) ?: 'No reason specified',
                'date'      => ($inq->cancelled_at ?? $inq->updated_at)?->format('M d, Y h:i A'),
                'sort_ts'   => ($inq->cancelled_at ?? $inq->updated_at)?->timestamp ?? 0,
            ]);
        }

        foreach ($expiredOrRejectedQuotes as $quote) {
            $incidents->push([
                'type'      => 'quotation',
                'reference' => 'Quotation #' . $quote->quotation_id . ' (Inquiry #' . $quote->inquiry_id . ')',
                'status'    => $quote->status,
                'reason'    => $quote->status === 'expired'
                    ? 'Quotation expired without client payment' . ($quote->valid_until ? ' (valid until ' . $quote->valid_until . ')' : '')
                    : 'Quotation rejected by client',
                'date'      => $quote->updated_at?->format('M d, Y h:i A'),
                'sort_ts'   => $quote->updated_at?->timestamp ?? 0,
            ]);
        }

        foreach ($cancelledOrders as $order) {
            $incidents->push([
                'type'      => 'order',
                'reference' => 'Order #' . $order->order_id,
                'status'    => 'cancelled',
                'reason'    => trim((string) ($order->quotation?->inquiry?->cancellation_reason ?? '')) ?: 'Cancelled during order processing',
                'date'      => $order->updated_at?->format('M d, Y h:i A'),
                'sort_ts'   => $order->updated_at?->timestamp ?? 0,
            ]);
        }

        $totalStrikes = $lostInquiries->count() + $expiredOrRejectedQuotes->count() + $cancelledOrders->count();

        return [
            'client_id'           => $client->client_id,
            'business_name'       => $client->business_name,
            'contact_person'      => $client->contact_person,
            'email'               => $client->user?->email,
            'is_flagged_nuisance' => (bool) $client->is_flagged_nuisance,
            'nuisance_strikes'    => (int) max($client->nuisance_strikes ?? 0, $totalStrikes),
            'nuisance_reason'     => $client->nuisance_reason,
            'nuisance_flagged_at' => $client->nuisance_flagged_at?->format('M d, Y h:i A'),
            'flagged_by'          => $client->is_flagged_nuisance
                ? ($flaggedByName ? "Manually flagged by {$flaggedByName}" : 'Auto-flagged by System')
                : null,
            'counts'              => [
                'lost_inquiries'             => $lostInquiries->count(),
                'expired_or_rejected_quotes' => $expiredOrRejectedQuotes->count(),
                'cancelled_orders'           => $cancelledOrders->count(),
                'total_strikes'              => $totalStrikes,
                'threshold'                  => self::AUTO_FLAG_STRIKE_THRESHOLD,
            ],
            'incidents'           => $incidents
                ->sortByDesc('sort_ts')
                ->map(fn ($item) => collect($item)->except('sort_ts')->all())
                ->values()
                ->all(),
        ];
    }
}
