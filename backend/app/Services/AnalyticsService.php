<?php

namespace App\Services;

use App\Models\Inquiry;
use App\Models\Order;
use App\Models\Quotation;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class AnalyticsService
{
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
