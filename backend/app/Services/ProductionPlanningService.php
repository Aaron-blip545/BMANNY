<?php

namespace App\Services;

use App\Models\Order;
use App\Models\ProductionSchedule;
use Carbon\Carbon;

class ProductionPlanningService
{
    public const DEFAULT_DAILY_CAPACITY = 500;

    private const PRIORITY_RANK = [
        'rush'   => 3,
        'high'   => 2,
        'normal' => 1,
    ];

    /**
     * Estimate production start, completion, and delivery/pickup dates for an order
     * using BOM raw material availability, MOQ/ordered quantity, priority, and active queue load.
     */
    public static function estimateOrderTimeline(Order $order, ?string $priority = null, ?int $dailyCapacity = null): array
    {
        $priority = $priority ?: ($order->priority ?: 'normal');
        $dailyCapacity = max(1, (int) ($dailyCapacity ?: self::DEFAULT_DAILY_CAPACITY));

        $orderedQty = InventoryService::parseOrderQuantity($order);
        $productType = InventoryService::resolveOrderProductType($order);
        $availability = InventoryService::checkInventoryAvailability($order);

        $baseLeadDays = (int) ($productType?->lead_time_days ?? 14);
        if ($priority === 'rush') {
            $baseLeadDays = max(3, (int) ceil($baseLeadDays * 0.65));
        } elseif ($priority === 'high') {
            $baseLeadDays = max(5, (int) ceil($baseLeadDays * 0.85));
        }

        $productionDays = max(1, (int) ceil($orderedQty / $dailyCapacity));

        // Calculate queue backlog from active schedules ahead of or equal to this order's priority
        $myRank = self::PRIORITY_RANK[$priority] ?? 1;
        $activeSchedules = ProductionSchedule::whereIn('production_status', ['scheduled', 'in_progress', 'delayed'])
            ->where('order_id', '!=', $order->order_id)
            ->get();

        $queuedUnitsAhead = 0;
        foreach ($activeSchedules as $sched) {
            $schedRank = self::PRIORITY_RANK[$sched->priority ?? 'normal'] ?? 1;
            if ($sched->production_status === 'in_progress' || $schedRank >= $myRank) {
                $queuedUnitsAhead += max(0, (int) $sched->planned_quantity);
            }
        }
        $queueDelayDays = (int) ceil($queuedUnitsAhead / $dailyCapacity);

        // If raw materials are short, add the longest restock lead time
        $restockDelayDays = 0;
        if (! $availability['can_fulfill'] && ! empty($availability['shortages'])) {
            $restockDelayDays = max(array_map(fn ($s) => (int) ($s['restock_lead_days'] ?? 7), $availability['shortages']));
        }

        $today = Carbon::today();
        $recommendedStart = $today->copy()->addDays($queueDelayDays + $restockDelayDays);
        $effectiveDuration = max($productionDays, min($baseLeadDays, $productionDays + 4));
        $estimatedCompletion = $recommendedStart->copy()->addDays($effectiveDuration);
        $estimatedDelivery = $estimatedCompletion->copy()->addDays(2);

        return [
            'ordered_quantity'          => $orderedQty,
            'daily_capacity_units'      => $dailyCapacity,
            'priority'                  => $priority,
            'base_lead_days'            => $baseLeadDays,
            'production_days'           => $productionDays,
            'queue_units_ahead'         => $queuedUnitsAhead,
            'queue_delay_days'          => $queueDelayDays,
            'restock_delay_days'        => $restockDelayDays,
            'recommended_start_date'    => $recommendedStart->format('Y-m-d'),
            'estimated_completion_date' => $estimatedCompletion->format('Y-m-d'),
            'estimated_delivery_date'   => $estimatedDelivery->format('Y-m-d'),
            'inventory_ready'           => $availability['can_fulfill'],
            'shortages'                 => $availability['shortages'],
            'expiry_risks'              => $availability['expiry_risks'],
        ];
    }

    /**
     * Summary metrics for the Order Manager dashboard and schedule view.
     */
    public static function getCapacityOverview(): array
    {
        $activeSchedules = ProductionSchedule::whereIn('production_status', ['scheduled', 'in_progress', 'delayed'])->get();
        $totalQueuedUnits = (int) $activeSchedules->sum('planned_quantity');
        $delayedCount = $activeSchedules->filter(fn ($s) => $s->production_status === 'delayed' || $s->is_overdue)->count();
        $priorityCount = $activeSchedules->filter(fn ($s) => in_array($s->priority, ['high', 'rush'], true))->count();

        return [
            'daily_capacity_units' => self::DEFAULT_DAILY_CAPACITY,
            'active_schedules'     => $activeSchedules->count(),
            'total_queued_units'   => $totalQueuedUnits,
            'backlog_days'         => (int) ceil($totalQueuedUnits / self::DEFAULT_DAILY_CAPACITY),
            'delayed_schedules'    => $delayedCount,
            'priority_schedules'   => $priorityCount,
        ];
    }
}
