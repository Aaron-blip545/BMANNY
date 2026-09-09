<?php

namespace App\Services;

use App\Models\Inquiry;
use App\Models\Order;
use App\Models\Quotation;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class AnalyticsService
{
    /**
     * Return a ranked leaderboard of top-buying clients, including a
     * "likely to order next" forecast flag.
     *
     * Scoring formula (weighted):
     *   score = (total_order_amount × 0.5) + (order_count × 20)
     *         + (inquiry_count × 10) + recency_bonus
     *
     * recency_bonus: 30 pts if the last order was within 30 days,
     *                15 pts if within 60 days, 0 otherwise.
     *
     * "Likely to order next": client's score is in the top quartile AND
     * they currently have at least one open inquiry that has not yet
     * produced an order (i.e. they're actively engaging right now).
     */
    public function topBuyers(int $limit = 8): array
    {
        $now = now();

        // 1. Aggregate order stats per client
        $orderStats = Order::where('status', '!=', 'cancelled')
            ->selectRaw('client_id, COUNT(*) as order_count, SUM(total_amount) as total_spent, MAX(created_at) as last_order_at')
            ->groupBy('client_id')
            ->get()
            ->keyBy('client_id');

        // 2. Aggregate inquiry counts per client
        $inquiryCounts = Inquiry::selectRaw('client_id, COUNT(*) as inquiry_count')
            ->groupBy('client_id')
            ->get()
            ->keyBy('client_id');

        // 3. Find clients with open (pending/reviewed) inquiries that have no order yet
        $clientsWithOpenInquiries = Inquiry::whereIn('status', ['pending', 'reviewed'])
            ->whereNull('cancelled_at')
            ->whereDoesntHave('quotation', fn ($q) => $q->whereHas('order'))
            ->pluck('client_id')
            ->unique()
            ->flip(); // Use as a set for O(1) lookup

        // 4. Build scored list
        $clientIds = $orderStats->keys()->merge($inquiryCounts->keys())->unique();

        $scored = $clientIds->map(function ($clientId) use ($orderStats, $inquiryCounts, $clientsWithOpenInquiries, $now) {
            $orders   = $orderStats->get($clientId);
            $inquiries = $inquiryCounts->get($clientId);

            $orderCount   = $orders?->order_count ?? 0;
            $totalSpent   = (float) ($orders?->total_spent ?? 0);
            $inquiryCount = $inquiries?->inquiry_count ?? 0;
            $lastOrderAt  = $orders?->last_order_at ? Carbon::parse($orders->last_order_at) : null;

            $recencyBonus = 0;
            if ($lastOrderAt) {
                $daysSince = $lastOrderAt->diffInDays($now);
                if ($daysSince <= 30) {
                    $recencyBonus = 30;
                } elseif ($daysSince <= 60) {
                    $recencyBonus = 15;
                }
            }

            $score = ($totalSpent * 0.5) + ($orderCount * 20) + ($inquiryCount * 10) + $recencyBonus;

            return [
                'client_id'      => $clientId,
                'order_count'    => $orderCount,
                'total_spent'    => $totalSpent,
                'inquiry_count'  => $inquiryCount,
                'last_order_at'  => $lastOrderAt?->toISOString(),
                'score'          => round($score, 2),
                'has_open_inquiry' => isset($clientsWithOpenInquiries[$clientId]),
            ];
        })
        ->filter(fn ($row) => $row['order_count'] > 0 || $row['inquiry_count'] > 0)
        ->sortByDesc('score')
        ->values()
        ->take($limit);

        // 5. Determine top-quartile threshold for "likely to order next" flag
        $scores = $scored->pluck('score');
        $topThreshold = $scores->count() > 0
            ? $scores->sortDesc()->values()->get((int) floor($scores->count() * 0.25)) ?? $scores->first()
            : 0;

        // 6. Attach client business names and forecast flag
        $clientModels = \App\Models\BusinessClient::whereIn('client_id', $scored->pluck('client_id'))
            ->get(['client_id', 'business_name'])
            ->keyBy('client_id');

        $maxScore = $scored->max('score') ?: 1;

        return $scored->map(function ($row) use ($clientModels, $topThreshold, $maxScore) {
            $client = $clientModels->get($row['client_id']);
            return [
                'client_id'     => $row['client_id'],
                'business_name' => $client?->business_name ?? "Client #{$row['client_id']}",
                'order_count'   => $row['order_count'],
                'total_spent'   => $row['total_spent'],
                'inquiry_count' => $row['inquiry_count'],
                'last_order_at' => $row['last_order_at'],
                'score'         => $row['score'],
                'score_pct'     => round(($row['score'] / $maxScore) * 100),
                'is_likely_next'=> $row['has_open_inquiry'] && $row['score'] >= $topThreshold,
            ];
        })->values()->all();
    }


    /** Return real, consistently scoped data for every analytics period. */
    public function periods(): array
    {
        $definitions = [
            'daily' => [collect(range(6, 0))->map(fn (int $offset) => now()->startOfDay()->subDays($offset)), 'Y-m-d', 'D'],
            'weekly' => [collect(range(7, 0))->map(fn (int $offset) => now()->startOfWeek()->subWeeks($offset)), 'o-W', 'M j'],
            'monthly' => [collect(range(5, 0))->map(fn (int $offset) => now()->startOfMonth()->subMonths($offset)), 'Y-m', 'M'],
            'yearly' => [collect(range(4, 0))->map(fn (int $offset) => now()->startOfYear()->subYears($offset)), 'Y', 'Y'],
        ];

        return collect($definitions)->map(function (array $definition) {
            [$buckets, $keyFormat, $labelFormat] = $definition;
            $from = $buckets->first()->copy()->startOfDay();
            $to = now()->endOfDay();

            return [
                'context' => $this->rangeLabel($from, $to),
                'activity' => $this->activityBuckets($buckets, $keyFormat, $labelFormat),
                'statusBreakdown' => $this->orderStatusBreakdown($from, $to),
                'funnel' => [
                    ['label' => 'Inquiries', 'value' => Inquiry::whereBetween('created_at', [$from, $to])->count()],
                    ['label' => 'Quotes created', 'value' => Quotation::whereBetween('created_at', [$from, $to])->count()],
                    ['label' => 'Payments submitted', 'value' => Quotation::whereBetween('payment_submitted_at', [$from, $to])->count()],
                    ['label' => 'Orders created', 'value' => Order::whereBetween('created_at', [$from, $to])->count()],
                ],
                'totalRevenue' => (float) Order::whereBetween('created_at', [$from, $to])
                    ->where('status', '!=', 'cancelled')
                    ->sum('total_amount'),
            ];
        })->all();
    }

    private function activityBuckets(Collection $buckets, string $keyFormat, string $labelFormat): array
    {
        $from = $buckets->first();
        $inquiries = Inquiry::where('created_at', '>=', $from)->get(['created_at']);
        $orders = Order::where('created_at', '>=', $from)->get(['created_at']);

        return $buckets->map(fn (Carbon $bucket) => [
            'label' => $bucket->format($labelFormat),
            'inquiries' => $inquiries->filter(fn ($item) => $item->created_at->format($keyFormat) === $bucket->format($keyFormat))->count(),
            'orders' => $orders->filter(fn ($item) => $item->created_at->format($keyFormat) === $bucket->format($keyFormat))->count(),
        ])->values()->all();
    }

    private function orderStatusBreakdown(Carbon $from, Carbon $to): array
    {
        $counts = Order::whereBetween('created_at', [$from, $to])
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return collect([
            ['label' => 'Approved', 'status' => 'approved', 'color' => '#0A1A3C'],
            ['label' => 'In production', 'status' => 'in_production', 'color' => '#5b6472'],
            ['label' => 'For delivery', 'status' => 'for_delivery', 'color' => '#d4a72c'],
            ['label' => 'Completed', 'status' => 'completed', 'color' => '#0f766e'],
        ])->map(fn (array $item) => [
            'label' => $item['label'],
            'color' => $item['color'],
            'value' => (int) ($counts[$item['status']] ?? 0),
        ])->all();
    }

    private function rangeLabel(Carbon $from, Carbon $to): string
    {
        return $from->isSameYear($to)
            ? $from->format('M j') . ' – ' . $to->format('M j, Y')
            : $from->format('M j, Y') . ' – ' . $to->format('M j, Y');
    }
}
