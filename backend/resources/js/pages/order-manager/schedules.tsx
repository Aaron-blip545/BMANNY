import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Calendar,
    CalendarClock,
    CheckCircle2,
    ChevronDown,
    Clock,
    Flame,
    Gauge,
    Layers,
    PackageCheck,
    Plus,
    Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Orders', href: '/orders' },
    { title: 'Production Schedules', href: '/production-schedules' },
];

interface ShortageItem {
    product_id: number;
    name: string;
    unit: string;
    required: number;
    available: number;
    shortage: number;
    restock_lead_days: number;
}

interface PlanningEstimate {
    ordered_quantity: number;
    daily_capacity_units: number;
    priority: 'normal' | 'high' | 'rush';
    production_days: number;
    queue_delay_days: number;
    restock_delay_days: number;
    recommended_start_date: string;
    estimated_completion_date: string;
    estimated_delivery_date: string;
    inventory_ready: boolean;
    shortages: ShortageItem[];
    expiry_risks: Array<{ name: string; expiration_date: string; expiry_status: string }>;
}

interface UnscheduledOrder {
    order_id: number;
    status: string;
    priority: 'normal' | 'high' | 'rush';
    total_amount: string;
    created_at: string;
    client: { business_name: string; contact_person: string } | null;
    planning: PlanningEstimate;
}

interface ScheduleItem {
    schedule_id: number;
    order_id: number;
    batch_code: string | null;
    production_start_date: string;
    target_end_date: string;
    actual_start_date: string | null;
    actual_end_date: string | null;
    planned_quantity: number;
    daily_capacity_units: number;
    priority: 'normal' | 'high' | 'rush';
    production_status: 'scheduled' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
    production_notes: string | null;
    is_overdue: boolean;
    order?: {
        order_id: number;
        status: string;
        client?: { business_name: string } | null;
        delivery_batches?: Array<{ batch_id: number; delivery_status: string; quantity: number }>;
    } | null;
}

interface CapacityOverview {
    daily_capacity_units: number;
    active_schedules: number;
    total_queued_units: number;
    backlog_days: number;
    delayed_schedules: number;
    priority_schedules: number;
}

interface Props {
    schedules: ScheduleItem[];
    unscheduledOrders: UnscheduledOrder[];
    capacityOverview: CapacityOverview;
}

function priorityBadge(priority: string) {
    switch (priority) {
        case 'rush':
            return 'bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
        case 'high':
            return 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
        default:
            return 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700';
    }
}

function scheduleStatusBadge(status: string, isOverdue: boolean) {
    if (isOverdue && status !== 'completed' && status !== 'cancelled') {
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
    }
    switch (status) {
        case 'scheduled':
            return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300';
        case 'in_progress':
            return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300';
        case 'completed':
            return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
        case 'delayed':
            return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
        default:
            return 'bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300';
    }
}

export default function ProductionSchedulesPage({ schedules, unscheduledOrders, capacityOverview }: Props) {
    const { flash } = usePage().props as any;
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [schedulingOrder, setSchedulingOrder] = useState<UnscheduledOrder | null>(null);

    const scheduleForm = useForm({
        production_start_date: '',
        target_end_date: '',
        planned_quantity: 100,
        daily_capacity_units: capacityOverview.daily_capacity_units || 500,
        priority: 'normal' as 'normal' | 'high' | 'rush',
        production_notes: '',
    });

    const openScheduleModal = (order: UnscheduledOrder) => {
        setSchedulingOrder(order);
        scheduleForm.setData({
            production_start_date: order.planning.recommended_start_date,
            target_end_date: order.planning.estimated_completion_date,
            planned_quantity: order.planning.ordered_quantity,
            daily_capacity_units: order.planning.daily_capacity_units,
            priority: order.priority || 'normal',
            production_notes: order.planning.inventory_ready
                ? ''
                : `Restock buffer (${order.planning.restock_delay_days}d) included for material shortages.`,
        });
    };

    const submitSchedule = (e: React.FormEvent) => {
        e.preventDefault();
        if (!schedulingOrder) return;
        scheduleForm.post(route('orders.schedule.store', schedulingOrder.order_id), {
            preserveScroll: true,
            onSuccess: () => {
                setSchedulingOrder(null);
                scheduleForm.reset();
            },
        });
    };

    const updateScheduleStatus = (scheduleId: number, production_status: string) => {
        router.patch(
            route('production-schedules.update', scheduleId),
            { production_status },
            { preserveScroll: true },
        );
    };

    const filteredSchedules = useMemo(() => {
        const term = search.trim().toLowerCase();
        return schedules.filter((s) => {
            if (statusFilter !== 'all' && s.production_status !== statusFilter) return false;
            if (!term) return true;
            return (
                String(s.order_id).includes(term) ||
                (s.batch_code?.toLowerCase().includes(term) ?? false) ||
                (s.order?.client?.business_name?.toLowerCase().includes(term) ?? false)
            );
        });
    }, [schedules, search, statusFilter]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Production Schedules" />

            <div className="bmanny-page">
                <div className="bmanny-page-inner space-y-6">
                    {/* Header */}
                    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="border-l-4 border-amber-400 pl-3.5">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Order Operations &amp; Capacity Planning
                            </p>
                            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
                                PRODUCTION SCHEDULES
                            </h1>
                            <p className="text-xs text-muted-foreground sm:text-sm">
                                Schedule accepted orders, balance factory capacity, highlight priority runs, and track target vs. actual completion
                            </p>
                        </div>
                        <Button asChild variant="outline" className="h-10 rounded-lg text-xs font-semibold">
                            <Link href="/orders">
                                <PackageCheck className="mr-1.5 h-4 w-4" />
                                Back to Orders
                            </Link>
                        </Button>
                    </header>

                    {flash?.success && (
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                            {flash.success}
                        </div>
                    )}

                    {/* Capacity Overview KPIs */}
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                        {[
                            {
                                label: 'Daily Capacity',
                                value: `${capacityOverview.daily_capacity_units.toLocaleString()} units`,
                                desc: 'Standard factory throughput / day',
                                icon: Gauge,
                            },
                            {
                                label: 'Active Schedules',
                                value: capacityOverview.active_schedules,
                                desc: `${capacityOverview.total_queued_units.toLocaleString()} units in queue`,
                                icon: CalendarClock,
                            },
                            {
                                label: 'Queue Backlog',
                                value: `${capacityOverview.backlog_days}d`,
                                desc: 'Estimated queue load',
                                icon: Clock,
                            },
                            {
                                label: 'Priority Runs',
                                value: capacityOverview.priority_schedules,
                                desc: 'Rush & high-priority orders',
                                icon: Flame,
                            },
                            {
                                label: 'Delayed / Overdue',
                                value: capacityOverview.delayed_schedules,
                                desc: 'Past target completion date',
                                icon: AlertTriangle,
                            },
                        ].map((card) => (
                            <div
                                key={card.label}
                                className="rounded-xl border border-border/70 bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        {card.label}
                                    </p>
                                    <card.icon className="h-4 w-4 text-muted-foreground/70" />
                                </div>
                                <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{card.value}</p>
                                <p className="mt-2 text-xs text-muted-foreground">{card.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Unscheduled Accepted Orders */}
                    <section className="rounded-xl border border-border/70 bg-card p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-border/70 pb-3">
                            <div>
                                <h2 className="text-base font-bold text-foreground">
                                    Awaiting Production Schedule ({unscheduledOrders.length})
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Accepted orders with automatic lead-time estimates based on BOM inventory &amp; queue capacity
                                </p>
                            </div>
                        </div>

                        {unscheduledOrders.length === 0 ? (
                            <div className="py-8 text-center text-xs text-muted-foreground">
                                <CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-emerald-500/70" />
                                All active orders have been scheduled for production.
                            </div>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                                {unscheduledOrders.map((order) => (
                                    <div
                                        key={order.order_id}
                                        className={cn(
                                            'rounded-xl border p-4 flex flex-col justify-between gap-3 bg-muted/15',
                                            order.priority === 'rush'
                                                ? 'border-l-4 border-l-rose-500 border-border/80'
                                                : order.priority === 'high'
                                                  ? 'border-l-4 border-l-amber-500 border-border/80'
                                                  : 'border-border/70',
                                        )}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm font-bold text-foreground">
                                                        Order #{order.order_id}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                                                            priorityBadge(order.priority),
                                                        )}
                                                    >
                                                        {order.priority}
                                                    </span>
                                                </div>
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                                                        order.planning.inventory_ready
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
                                                    )}
                                                >
                                                    {order.planning.inventory_ready
                                                        ? 'Materials Ready'
                                                        : `${order.planning.shortages.length} Material Shortage(s)`}
                                                </span>
                                            </div>
                                            <p className="text-sm font-semibold text-foreground">
                                                {order.client?.business_name ?? 'Business Client'}
                                            </p>
                                            <div className="grid grid-cols-3 gap-2 rounded-lg bg-background/70 p-2.5 text-[11px] border border-border/60">
                                                <div>
                                                    <span className="text-muted-foreground block">Qty</span>
                                                    <span className="font-bold text-foreground">
                                                        {order.planning.ordered_quantity.toLocaleString()} units
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block">Rec. Start</span>
                                                    <span className="font-mono font-semibold text-foreground">
                                                        {order.planning.recommended_start_date}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block">Est. Finish</span>
                                                    <span className="font-mono font-semibold text-foreground">
                                                        {order.planning.estimated_completion_date}
                                                    </span>
                                                </div>
                                            </div>
                                            {!order.planning.inventory_ready && (
                                                <p className="text-[11px] text-rose-600 dark:text-rose-400">
                                                    Short:{' '}
                                                    {order.planning.shortages
                                                        .map((s) => `${s.name} (-${s.shortage} ${s.unit})`)
                                                        .join(', ')}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex justify-end">
                                            <Button
                                                size="sm"
                                                onClick={() => openScheduleModal(order)}
                                                className="h-8 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                                            >
                                                <Plus className="mr-1 h-3.5 w-3.5" />
                                                Schedule Production
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Schedules Table */}
                    <section className="space-y-3">
                        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card px-5 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-semibold text-foreground">
                                {filteredSchedules.length}/{schedules.length} Production Schedules
                            </p>
                            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search batch code, order #, client…"
                                        className="h-9 w-full rounded-lg border border-input/80 bg-muted/20 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-72"
                                    />
                                </div>
                                <div className="relative">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="h-9 appearance-none rounded-lg border border-input/80 bg-muted/20 px-3 pr-8 text-xs font-semibold text-foreground capitalize focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="delayed">Delayed</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                </div>
                            </div>
                        </div>

                        {filteredSchedules.length === 0 ? (
                            <div className="rounded-xl border border-border/70 bg-card py-14 text-center text-muted-foreground">
                                <Layers className="mx-auto mb-2 h-9 w-9 opacity-40" />
                                <p className="text-sm font-semibold text-foreground">No production schedules yet</p>
                                <p className="mt-1 text-xs">
                                    Schedule an accepted order above to start tracking production timelines.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[960px] border-separate border-spacing-y-2 text-left text-sm">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                Batch / Order
                                            </th>
                                            <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                Client
                                            </th>
                                            <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                Priority
                                            </th>
                                            <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                Planned Qty
                                            </th>
                                            <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                Scheduled Window
                                            </th>
                                            <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                Actual Dates
                                            </th>
                                            <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSchedules.map((sched) => (
                                            <tr key={sched.schedule_id} className="bg-card shadow-xs">
                                                <td className="rounded-l-xl border-y border-l border-border/70 p-4">
                                                    <p className="font-mono text-xs font-bold text-primary">
                                                        {sched.batch_code ?? `SCHED-${sched.schedule_id}`}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Order #{sched.order_id}
                                                    </p>
                                                </td>
                                                <td className="border-y border-border/70 p-4">
                                                    <p className="text-sm font-bold text-foreground">
                                                        {sched.order?.client?.business_name ?? '—'}
                                                    </p>
                                                    {sched.production_notes && (
                                                        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
                                                            {sched.production_notes}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="border-y border-border/70 p-4">
                                                    <span
                                                        className={cn(
                                                            'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase',
                                                            priorityBadge(sched.priority),
                                                        )}
                                                    >
                                                        {sched.priority}
                                                    </span>
                                                </td>
                                                <td className="border-y border-border/70 p-4 font-mono text-xs font-semibold text-foreground">
                                                    {sched.planned_quantity.toLocaleString()} units
                                                    <span className="block text-[10px] text-muted-foreground">
                                                        {sched.daily_capacity_units}/day cap
                                                    </span>
                                                </td>
                                                <td className="border-y border-border/70 p-4 font-mono text-xs text-foreground">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Calendar className="size-3 text-muted-foreground" />
                                                        {sched.production_start_date} → {sched.target_end_date}
                                                    </span>
                                                    {sched.is_overdue && (
                                                        <span className="mt-1 inline-flex items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                                            <AlertTriangle className="size-2.5" /> Overdue
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="border-y border-border/70 p-4 font-mono text-xs text-muted-foreground">
                                                    {sched.actual_start_date
                                                        ? `${sched.actual_start_date} → ${sched.actual_end_date ?? 'In progress'}`
                                                        : 'Not started'}
                                                </td>
                                                <td className="rounded-r-xl border-y border-r border-border/70 p-4">
                                                    <select
                                                        value={sched.production_status}
                                                        onChange={(e) =>
                                                            updateScheduleStatus(sched.schedule_id, e.target.value)
                                                        }
                                                        className={cn(
                                                            'h-8 rounded-lg px-2.5 text-xs font-semibold capitalize border border-border/60 focus:outline-none focus:ring-1 focus:ring-primary',
                                                            scheduleStatusBadge(sched.production_status, sched.is_overdue),
                                                        )}
                                                    >
                                                        <option value="scheduled">Scheduled</option>
                                                        <option value="in_progress">In Progress</option>
                                                        <option value="delayed">Delayed</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {/* Schedule Modal */}
            <Dialog open={Boolean(schedulingOrder)} onOpenChange={(open) => !open && setSchedulingOrder(null)}>
                <DialogContent className="max-w-lg rounded-xl bg-card p-6 text-card-foreground border-border">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-foreground">
                            Schedule Production — Order #{schedulingOrder?.order_id}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Pre-filled using raw material availability, MOQ quantity, and factory capacity load.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitSchedule} className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Production Start Date</Label>
                                <Input
                                    type="date"
                                    value={scheduleForm.data.production_start_date}
                                    onChange={(e) => scheduleForm.setData('production_start_date', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Target Completion Date</Label>
                                <Input
                                    type="date"
                                    value={scheduleForm.data.target_end_date}
                                    onChange={(e) => scheduleForm.setData('target_end_date', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Planned Qty</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={scheduleForm.data.planned_quantity}
                                    onChange={(e) => scheduleForm.setData('planned_quantity', Number(e.target.value))}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Daily Capacity</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={scheduleForm.data.daily_capacity_units}
                                    onChange={(e) => scheduleForm.setData('daily_capacity_units', Number(e.target.value))}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Priority</Label>
                                <select
                                    value={scheduleForm.data.priority}
                                    onChange={(e) =>
                                        scheduleForm.setData('priority', e.target.value as 'normal' | 'high' | 'rush')
                                    }
                                    className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs font-semibold"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                    <option value="rush">Rush</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Production Notes</Label>
                            <Input
                                value={scheduleForm.data.production_notes}
                                onChange={(e) => scheduleForm.setData('production_notes', e.target.value)}
                                placeholder="Machine assignment, special packaging instructions, or restock notes..."
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setSchedulingOrder(null)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={scheduleForm.processing}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                {scheduleForm.processing ? 'Saving…' : 'Confirm Schedule'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
