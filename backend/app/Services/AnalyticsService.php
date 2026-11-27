<?php

namespace App\Services;

use App\Models\ClientPackagingBalance;
use App\Models\DeliveryBatch;
use App\Models\Inquiry;
use App\Models\InquiryCustomization;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductionSchedule;
use App\Models\ProductRequestReview;
use App\Models\Quotation;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    /**
     * Return a ranked leaderboard of top-buying clients, including a
     * "likely to order next" forecast flag.
     */
    public function topBuyers(int $limit = 8): array
    {
        $now = now();

        $orderStats = Order::where('status', '!=', 'cancelled')
            ->selectRaw('client_id, COUNT(*) as order_count, SUM(total_amount) as total_spent, MAX(created_at) as last_order_at')
            ->groupBy('client_id')
            ->get()
            ->keyBy('client_id');

        $inquiryCounts = Inquiry::selectRaw('client_id, COUNT(*) as inquiry_count')
            ->groupBy('client_id')
            ->get()
            ->keyBy('client_id');

        $clientsWithOpenInquiries = Inquiry::whereIn('status', ['new', 'for_quotation', 'follow_up', 'quotation_sent'])
            ->whereNull('cancelled_at')
            ->whereDoesntHave('quotation', fn ($q) => $q->whereHas('order'))
            ->pluck('client_id')
            ->unique()
            ->flip();

        $clientIds = $orderStats->keys()->merge($inquiryCounts->keys())->unique();

        $scored = $clientIds->map(function ($clientId) use ($orderStats, $inquiryCounts, $clientsWithOpenInquiries, $now) {
            $orders = $orderStats->get($clientId);
            $inquiries = $inquiryCounts->get($clientId);

            $orderCount = $orders?->order_count ?? 0;
            $totalSpent = (float) ($orders?->total_spent ?? 0);
            $inquiryCount = $inquiries?->inquiry_count ?? 0;
            $lastOrderAt = $orders?->last_order_at ? Carbon::parse($orders->last_order_at) : null;

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
                'client_id'        => $clientId,
                'order_count'      => $orderCount,
                'total_spent'      => $totalSpent,
                'inquiry_count'    => $inquiryCount,
                'last_order_at'    => $lastOrderAt?->toISOString(),
                'score'            => round($score, 2),
                'has_open_inquiry' => isset($clientsWithOpenInquiries[$clientId]),
            ];
        })
        ->filter(fn ($row) => $row['order_count'] > 0 || $row['inquiry_count'] > 0)
        ->sortByDesc('score')
        ->values()
        ->take($limit);

        $scores = $scored->pluck('score');
        $topThreshold = $scores->count() > 0
            ? $scores->sortDesc()->values()->get((int) floor($scores->count() * 0.25)) ?? $scores->first()
            : 0;

        $clientModels = \App\Models\BusinessClient::whereIn('client_id', $scored->pluck('client_id'))
            ->get(['client_id', 'business_name'])
            ->keyBy('client_id');

        $maxScore = $scored->max('score') ?: 1;

        return $scored->map(function ($row) use ($clientModels, $topThreshold, $maxScore) {
            $client = $clientModels->get($row['client_id']);
            return [
                'client_id'      => $row['client_id'],
                'business_name'  => $client?->business_name ?? "Client #{$row['client_id']}",
                'order_count'    => $row['order_count'],
                'total_spent'    => $row['total_spent'],
                'inquiry_count'  => $row['inquiry_count'],
                'last_order_at'  => $row['last_order_at'],
                'score'          => $row['score'],
                'score_pct'      => round(($row['score'] / $maxScore) * 100),
                'is_likely_next' => $row['has_open_inquiry'] && $row['score'] >= $topThreshold,
            ];
        })->values()->all();
    }

    /** Return real, consistently scoped data for every analytics period. */
    public function periods(): array
    {
        $definitions = [
            'daily'   => [collect(range(6, 0))->map(fn (int $offset) => now()->startOfDay()->subDays($offset)), 'Y-m-d', 'D'],
            'weekly'  => [collect(range(7, 0))->map(fn (int $offset) => now()->startOfWeek()->subWeeks($offset)), 'o-W', 'M j'],
            'monthly' => [collect(range(5, 0))->map(fn (int $offset) => now()->startOfMonth()->subMonths($offset)), 'Y-m', 'M'],
            'yearly'  => [collect(range(4, 0))->map(fn (int $offset) => now()->startOfYear()->subYears($offset)), 'Y', 'Y'],
        ];

        return collect($definitions)->map(function (array $definition) {
            [$buckets, $keyFormat, $labelFormat] = $definition;
            $from = $buckets->first()->copy()->startOfDay();
            $to = now()->endOfDay();

            $inquiryIds = Inquiry::whereBetween('created_at', [$from, $to])->pluck('inquiry_id');
            $inquiriesCount = $inquiryIds->count();
            $quotedCount = $inquiryIds->isNotEmpty()
                ? Quotation::whereIn('inquiry_id', $inquiryIds)->distinct('inquiry_id')->count('inquiry_id')
                : 0;
            $paidCount = $inquiryIds->isNotEmpty()
                ? Quotation::whereIn('inquiry_id', $inquiryIds)->whereNotNull('payment_submitted_at')->distinct('inquiry_id')->count('inquiry_id')
                : 0;
            $convertedCount = $inquiryIds->isNotEmpty()
                ? Order::whereHas('quotation', fn ($q) => $q->whereIn('inquiry_id', $inquiryIds))
                    ->where('status', '!=', 'cancelled')
                    ->count()
                : 0;

            $activeOrders = Order::whereBetween('created_at', [$from, $to])
                ->where('status', '!=', 'cancelled');

            return [
                'context'         => $this->rangeLabel($from, $to),
                'activity'        => $this->activityBuckets($buckets, $keyFormat, $labelFormat),
                'statusBreakdown' => $this->orderStatusBreakdown($from, $to),
                'funnel'          => [
                    ['label' => 'Inquiries', 'value' => $inquiriesCount],
                    ['label' => 'Quotes Sent', 'value' => $quotedCount],
                    ['label' => 'Payment Proofs', 'value' => $paidCount],
                    ['label' => 'Converted Orders', 'value' => $convertedCount],
                ],
                'conversionRate'  => $inquiriesCount > 0 ? round(($convertedCount / $inquiriesCount) * 100, 1) : 0.0,
                'activeOrders'    => (clone $activeOrders)->count(),
                'totalRevenue'    => (float) (clone $activeOrders)->sum('total_amount'),
            ];
        })->all();
    }

    /**
     * Sales performance, quotation win rate, payment collections, and repeat-order opportunities.
     */
    public function salesPerformance(): array
    {
        $totalQuotes = Quotation::count();
        $acceptedQuotes = Quotation::where('status', 'accepted')->count();
        $rejectedQuotes = Quotation::where('status', 'rejected')->count();
        $pendingQuotes = Quotation::where('status', 'sent')->count();

        $activeOrders = Order::where('status', '!=', 'cancelled');
        $activeCount = (clone $activeOrders)->count();
        $totalContractValue = (float) (clone $activeOrders)->sum('total_amount');
        $avgOrderValue = $activeCount > 0 ? round($totalContractValue / $activeCount, 2) : 0.0;

        $initialCollected = (float) Order::where('status', '!=', 'cancelled')
            ->whereNotNull('initial_payment_verified_at')
            ->sum('initial_payment_amount');
        $balanceCollected = (float) Order::where('status', '!=', 'cancelled')
            ->whereNotNull('balance_payment_verified_at')
            ->sum('balance_payment_amount');
        $outstandingBalance = (float) Order::where('status', '!=', 'cancelled')
            ->whereNull('balance_payment_verified_at')
            ->sum('balance_payment_amount');

        $repeatOpportunities = ClientPackagingBalance::with('client')
            ->where('status', 'active')
            ->orderByDesc('remaining_pouches')
            ->limit(6)
            ->get()
            ->map(fn ($b) => [
                'balance_id'        => $b->balance_id,
                'business_name'     => $b->client?->business_name ?? "Client #{$b->client_id}",
                'brand_name'        => $b->brand_name,
                'package_slug'      => $b->package_slug,
                'remaining_pouches' => $b->remaining_pouches,
                'total_pouches'     => $b->total_pouches,
                'expires_at'        => $b->expires_at?->format('Y-m-d'),
                'est_reorder_value' => round($b->remaining_pouches * (float) $b->production_unit_cost, 2),
            ])
            ->values()
            ->all();

        return [
            'total_quotations'     => $totalQuotes,
            'accepted_quotations'  => $acceptedQuotes,
            'rejected_quotations'  => $rejectedQuotes,
            'pending_quotations'   => $pendingQuotes,
            'quote_win_rate'       => $totalQuotes > 0 ? round(($acceptedQuotes / $totalQuotes) * 100, 1) : 0.0,
            'total_contract_value' => $totalContractValue,
            'average_order_value'  => $avgOrderValue,
            'total_collected'      => round($initialCollected + $balanceCollected, 2),
            'outstanding_balance'  => round($outstandingBalance, 2),
            'repeat_opportunities' => $repeatOpportunities,
        ];
    }

    /**
     * Lost & cancelled leads analytics with reason breakdown.
     */
    public function lostLeadsAnalytics(): array
    {
        $totalInquiries = Inquiry::count();
        $lostInquiries = Inquiry::with('client')
            ->where(function ($q) {
                $q->whereNotNull('cancelled_at')
                    ->orWhereIn('status', ['cancelled', 'lost']);
            })
            ->orderByDesc('updated_at')
            ->get();

        $reasons = $lostInquiries
            ->groupBy(function ($inq) {
                $r = trim((string) ($inq->cancellation_reason ?? ''));
                return $r !== '' ? $r : 'No reason specified';
            })
            ->map(fn ($group, $reason) => [
                'reason' => $reason,
                'count'  => $group->count(),
            ])
            ->sortByDesc('count')
            ->values()
            ->all();

        $unavailableReviews = ProductRequestReview::where('status', 'unavailable')->count();

        $flaggedClients = \App\Models\BusinessClient::where('is_flagged_nuisance', true)
            ->orderByDesc('nuisance_flagged_at')
            ->limit(8)
            ->get()
            ->map(fn ($c) => [
                'client_id'     => $c->client_id,
                'business_name' => $c->business_name,
                'strikes'       => (int) $c->nuisance_strikes,
                'reason'        => $c->nuisance_reason ?: 'Flagged as nuisance client',
                'flagged_at'    => $c->nuisance_flagged_at?->format('Y-m-d'),
            ])
            ->values()
            ->all();

        return [
            'total_inquiries'     => $totalInquiries,
            'lost_count'          => $lostInquiries->count(),
            'lost_rate'           => $totalInquiries > 0 ? round(($lostInquiries->count() / $totalInquiries) * 100, 1) : 0.0,
            'unavailable_reviews' => $unavailableReviews,
            'reasons'             => $reasons,
            'flagged_clients'     => $flaggedClients,
            'recent_lost'         => $lostInquiries->take(6)->map(fn ($i) => [
                'inquiry_id'    => $i->inquiry_id,
                'business_name' => $i->client?->business_name ?? 'Client',
                'reason'        => $i->cancellation_reason ?: 'No reason specified',
                'date'          => ($i->cancelled_at ?? $i->updated_at)?->format('Y-m-d'),
            ])->values()->all(),
        ];
    }

    /**
     * Product demand, requested packages/packaging, and Product Control review analytics.
     */
    public function productDemandAnalytics(): array
    {
        $packageDemand = InquiryCustomization::selectRaw("COALESCE(NULLIF(selected_package, ''), NULLIF(packaging_type, ''), 'Standard') as label, COUNT(*) as total")
            ->groupBy('label')
            ->orderByDesc('total')
            ->limit(6)
            ->get()
            ->map(fn ($r) => ['label' => ucfirst((string) $r->label), 'count' => (int) $r->total])
            ->values()
            ->all();

        $packagingDemand = InquiryCustomization::whereNotNull('packaging_type')
            ->where('packaging_type', '!=', '')
            ->selectRaw('packaging_type as label, COUNT(*) as total')
            ->groupBy('packaging_type')
            ->orderByDesc('total')
            ->limit(6)
            ->get()
            ->map(fn ($r) => ['label' => (string) $r->label, 'count' => (int) $r->total])
            ->values()
            ->all();

        $reviewCounts = ProductRequestReview::selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $totalReviews = (int) $reviewCounts->sum();
        $approvedReviews = (int) (($reviewCounts['available'] ?? 0) + ($reviewCounts['alternative'] ?? 0));

        return [
            'package_demand'   => $packageDemand,
            'packaging_demand' => $packagingDemand,
            'reviews'          => [
                'total'       => $totalReviews,
                'pending'     => (int) ($reviewCounts['pending'] ?? 0),
                'available'   => (int) ($reviewCounts['available'] ?? 0),
                'alternative' => (int) ($reviewCounts['alternative'] ?? 0),
                'unavailable' => (int) ($reviewCounts['unavailable'] ?? 0),
                'approval_rate' => $totalReviews > 0 ? round(($approvedReviews / $totalReviews) * 100, 1) : 0.0,
            ],
        ];
    }

    /**
     * Production schedules, priority orders, and delivery batch analytics.
     */
    public function productionAndOrderAnalytics(): array
    {
        $schedules = ProductionSchedule::all();
        $completedSchedules = $schedules->where('production_status', 'completed');
        $onTimeCount = $completedSchedules->filter(function ($s) {
            if (! $s->actual_end_date || ! $s->target_end_date) {
                return true;
            }
            return Carbon::parse($s->actual_end_date)->lte(Carbon::parse($s->target_end_date));
        })->count();

        $priorityCounts = Order::whereNotIn('status', ['completed', 'cancelled'])
            ->selectRaw("COALESCE(priority, 'normal') as priority, COUNT(*) as total")
            ->groupBy(DB::raw("COALESCE(priority, 'normal')"))
            ->pluck('total', 'priority');

        $batches = DeliveryBatch::all();

        $completedOrders = Order::where('status', 'completed')
            ->whereNotNull('completed_at')
            ->get(['created_at', 'completed_at']);
        $avgTurnaroundDays = $completedOrders->count() > 0
            ? round($completedOrders->avg(fn ($o) => $o->created_at->diffInDays($o->completed_at)), 1)
            : null;

        return [
            'capacity'            => ProductionPlanningService::getCapacityOverview(),
            'total_schedules'     => $schedules->count(),
            'completed_schedules' => $completedSchedules->count(),
            'on_time_rate'        => $completedSchedules->count() > 0
                ? round(($onTimeCount / $completedSchedules->count()) * 100, 1)
                : 100.0,
            'priority_breakdown'  => [
                'rush'   => (int) ($priorityCounts['rush'] ?? 0),
                'high'   => (int) ($priorityCounts['high'] ?? 0),
                'normal' => (int) ($priorityCounts['normal'] ?? 0),
            ],
            'delivery_batches'    => [
                'total'     => $batches->count(),
                'delivered' => $batches->where('delivery_status', 'delivered')->count(),
                'in_transit'=> $batches->whereIn('delivery_status', ['ready_for_pickup', 'for_delivery'])->count(),
                'scheduled' => $batches->whereIn('delivery_status', ['scheduled', 'packed'])->count(),
            ],
            'avg_turnaround_days' => $avgTurnaroundDays,
        ];
    }

    /**
     * Raw materials inventory health, valuation, overstock, and expiration risks.
     */
    public function inventoryRiskAnalytics(): array
    {
        $products = Product::with('category')->get();

        $totalValue = $products->sum(fn ($p) => (float) $p->stock_quantity * (float) $p->price);
        $outOfStock = $products->filter(fn ($p) => (float) $p->stock_quantity <= 0);
        $reorder = $products->filter(fn ($p) => $p->stock_status === 'reorder');
        $overstock = $products->filter(fn ($p) => $p->stock_status === 'overstock');
        $expiringSoon = $products->filter(fn ($p) => $p->expiry_status === 'expiring_soon');
        $expired = $products->filter(fn ($p) => $p->expiry_status === 'expired');

        $criticalItems = $products
            ->filter(fn ($p) => in_array($p->stock_status, ['out_of_stock', 'reorder', 'overstock'], true)
                || in_array($p->expiry_status, ['expired', 'expiring_soon'], true))
            ->take(8)
            ->map(fn ($p) => [
                'product_id'      => $p->product_id,
                'name'            => $p->name,
                'sku'             => $p->sku,
                'stock_quantity'  => (float) $p->stock_quantity,
                'unit_of_measure' => $p->unit_of_measure,
                'stock_status'    => $p->stock_status,
                'expiry_status'   => $p->expiry_status,
                'expiration_date' => $p->expiration_date?->format('Y-m-d'),
            ])
            ->values()
            ->all();

        return [
            'total_materials'  => $products->count(),
            'total_valuation'  => round($totalValue, 2),
            'out_of_stock'     => $outOfStock->count(),
            'reorder_alert'    => $reorder->count(),
            'overstock'        => $overstock->count(),
            'expiring_soon'    => $expiringSoon->count(),
            'expired'          => $expired->count(),
            'critical_items'   => $criticalItems,
        ];
    }

    private function activityBuckets(Collection $buckets, string $keyFormat, string $labelFormat): array
    {
        $from = $buckets->first();
        $inquiries = Inquiry::where('created_at', '>=', $from)->get(['created_at']);
        $orders = Order::where('created_at', '>=', $from)
            ->where('status', '!=', 'cancelled')
            ->get(['created_at']);

        return $buckets->map(fn (Carbon $bucket) => [
            'label'     => $bucket->format($labelFormat),
            'inquiries' => $inquiries->filter(fn ($item) => $item->created_at->format($keyFormat) === $bucket->format($keyFormat))->count(),
            'orders'    => $orders->filter(fn ($item) => $item->created_at->format($keyFormat) === $bucket->format($keyFormat))->count(),
        ])->values()->all();
    }

    private function orderStatusBreakdown(Carbon $from, Carbon $to): array
    {
        $counts = Order::whereBetween('created_at', [$from, $to])
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return collect([
            ['label' => 'Approved', 'status' => 'approved', 'color' => '#2563eb'],
            ['label' => 'In production', 'status' => 'in_production', 'color' => '#9333ea'],
            ['label' => 'Ready / For delivery', 'status' => 'ready_for_pickup', 'color' => '#d97706'],
            ['label' => 'Completed', 'status' => 'completed', 'color' => '#059669'],
            ['label' => 'Cancelled', 'status' => 'cancelled', 'color' => '#e11d48'],
        ])->map(fn (array $item) => [
            'label' => $item['label'],
            'color' => $item['color'],
            'value' => (int) match ($item['status']) {
                'in_production'    => ($counts['in_production'] ?? 0) + ($counts['packed'] ?? 0),
                'ready_for_pickup' => ($counts['ready_for_pickup'] ?? 0) + ($counts['for_delivery'] ?? 0),
                'completed'        => ($counts['completed'] ?? 0) + ($counts['delivered'] ?? 0),
                default            => ($counts[$item['status']] ?? 0),
            },
        ])->all();
    }

    private function rangeLabel(Carbon $from, Carbon $to): string
    {
        return $from->isSameYear($to)
            ? $from->format('M j') . ' – ' . $to->format('M j, Y')
            : $from->format('M j, Y') . ' – ' . $to->format('M j, Y');
    }
}
