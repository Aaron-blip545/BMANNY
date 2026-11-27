import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowUpRight,
    CalendarClock,
    CheckCircle2,
    ClipboardList,
    Clock,
    Flame,
    Gauge,
    Layers,
    PackageCheck,
    PackageMinus,
    Sparkles,
    Truck,
} from 'lucide-react';

interface Props {
    stats?: { approved: number; inProduction: number; forDelivery: number; completed?: number };
    capacityOverview?: {
        daily_capacity_units: number;
        active_schedules: number;
        total_queued_units: number;
        backlog_days: number;
        delayed_schedules: number;
        priority_schedules: number;
    };
    inventoryRisks?: {
        outOfStock: number;
        reorder: number;
        overstock: number;
        expiringSoon: number;
        expired: number;
    };
    priorityOrders?: Array<{
        order_id: number;
        status: string;
        priority: string;
        estimated_completion_date: string | null;
        estimated_delivery_date: string | null;
        client: { business_name: string } | null;
        schedule_status: string | null;
    }>;
    recentOrders?: Array<{
        order_id: number;
        status: string;
        priority?: string;
        created_at: string;
        client: { business_name: string } | null;
    }>;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/order-manager/dashboard' }];

function getStatusBadge(status: string) {
    switch (status) {
        case 'approved':
            return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300';
        case 'in_production':
        case 'packed':
            return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300';
        case 'ready_for_pickup':
        case 'for_delivery':
            return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
        case 'completed':
        case 'delivered':
            return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
        case 'cancelled':
            return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
        default:
            return 'bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300';
    }
}

export default function OrderManagerDashboard({
    stats = { approved: 0, inProduction: 0, forDelivery: 0, completed: 0 },
    capacityOverview = {
        daily_capacity_units: 500,
        active_schedules: 0,
        total_queued_units: 0,
        backlog_days: 0,
        delayed_schedules: 0,
        priority_schedules: 0,
    },
    inventoryRisks = { outOfStock: 0, reorder: 0, overstock: 0, expiringSoon: 0, expired: 0 },
    priorityOrders = [],
    recentOrders = [],
}: Props) {
    const totalRisks =
        inventoryRisks.outOfStock +
        inventoryRisks.reorder +
        inventoryRisks.overstock +
        inventoryRisks.expiringSoon +
        inventoryRisks.expired;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Order Manager Dashboard" />

            <div className="bmanny-page">
                <div className="bmanny-page-inner space-y-6">
                    {/* Header Banner */}
                    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="border-l-4 border-amber-400 pl-3.5">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Order Manager Workspace
                            </p>
                            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
                                DASHBOARD
                            </h1>
                            <p className="text-xs text-muted-foreground sm:text-sm">
                                Overview of order fulfillment, production capacity, priority runs, and inventory risks
                            </p>
                        </div>
                        <Button asChild className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700">
                            <Link href="/production-schedules">
                                <CalendarClock className="mr-1.5 h-4 w-4" />
                                Production Schedules
                            </Link>
                        </Button>
                    </header>

                    {/* Metric Summary Cards */}
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        {[
                            {
                                label: 'Approved',
                                value: stats.approved,
                                description: 'Ready for scheduling / production',
                                icon: CheckCircle2,
                            },
                            {
                                label: 'In Production',
                                value: stats.inProduction,
                                description: 'Being made / packed',
                                icon: Layers,
                            },
                            {
                                label: 'Ready / For Delivery',
                                value: stats.forDelivery,
                                description: 'Ready for pickup or dispatched',
                                icon: Truck,
                            },
                            {
                                label: 'Completed',
                                value: stats.completed ?? 0,
                                description: 'Fulfilled orders',
                                icon: Sparkles,
                            },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="rounded-xl border border-border/70 bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                                    <item.icon className="h-5 w-5 text-muted-foreground/70" />
                                </div>
                                <p className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                    {item.value}
                                </p>
                                <p className="mt-3 text-xs text-muted-foreground">{item.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Capacity & Inventory Risk Strip */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Gauge className="h-4 w-4 text-primary" />
                                    <h2 className="text-sm font-bold text-foreground">Production Capacity &amp; Queue</h2>
                                </div>
                                <Link href="/production-schedules" className="text-xs font-semibold text-primary hover:underline">
                                    Manage Schedules →
                                </Link>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-xs">
                                <div className="rounded-lg bg-muted/30 p-3">
                                    <p className="text-muted-foreground">Active Runs</p>
                                    <p className="mt-1 text-lg font-bold text-foreground">{capacityOverview.active_schedules}</p>
                                    <p className="text-[11px] text-muted-foreground">{capacityOverview.total_queued_units.toLocaleString()} units</p>
                                </div>
                                <div className="rounded-lg bg-muted/30 p-3">
                                    <p className="text-muted-foreground">Est. Backlog</p>
                                    <p className="mt-1 text-lg font-bold text-foreground">{capacityOverview.backlog_days} days</p>
                                    <p className="text-[11px] text-muted-foreground">{capacityOverview.daily_capacity_units}/day cap</p>
                                </div>
                                <div className="rounded-lg bg-muted/30 p-3">
                                    <p className="text-muted-foreground">Delayed</p>
                                    <p className={cn('mt-1 text-lg font-bold', capacityOverview.delayed_schedules > 0 ? 'text-rose-600' : 'text-emerald-600')}>
                                        {capacityOverview.delayed_schedules}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">{capacityOverview.priority_schedules} priority</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className={cn('h-4 w-4', totalRisks > 0 ? 'text-amber-500' : 'text-emerald-500')} />
                                    <h2 className="text-sm font-bold text-foreground">Inventory &amp; Expiration Risks</h2>
                                </div>
                                <Link href="/products" className="text-xs font-semibold text-primary hover:underline">
                                    Inspect Inventory →
                                </Link>
                            </div>
                            <div className="grid grid-cols-5 gap-2 text-center text-xs">
                                <div className="rounded-lg bg-rose-500/10 p-2.5">
                                    <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{inventoryRisks.outOfStock}</p>
                                    <p className="text-[10px] font-semibold text-muted-foreground">Out of Stock</p>
                                </div>
                                <div className="rounded-lg bg-amber-500/10 p-2.5">
                                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{inventoryRisks.reorder}</p>
                                    <p className="text-[10px] font-semibold text-muted-foreground">Reorder</p>
                                </div>
                                <div className="rounded-lg bg-blue-500/10 p-2.5">
                                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{inventoryRisks.overstock}</p>
                                    <p className="text-[10px] font-semibold text-muted-foreground">Overstock</p>
                                </div>
                                <div className="rounded-lg bg-orange-500/10 p-2.5">
                                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{inventoryRisks.expiringSoon}</p>
                                    <p className="text-[10px] font-semibold text-muted-foreground">Expiring 30d</p>
                                </div>
                                <div className="rounded-lg bg-rose-500/15 p-2.5">
                                    <p className="text-lg font-bold text-rose-700 dark:text-rose-300">{inventoryRisks.expired}</p>
                                    <p className="text-[10px] font-semibold text-muted-foreground">Expired</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Priority Orders Highlight (if any) */}
                    {priorityOrders.length > 0 && (
                        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Flame className="h-4 w-4 text-rose-500" />
                                    <h2 className="text-sm font-bold text-foreground">Priority &amp; Rush Orders</h2>
                                </div>
                                <Link href="/orders" className="text-xs font-semibold text-primary hover:underline">
                                    Open Orders →
                                </Link>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {priorityOrders.map((po) => (
                                    <div key={po.order_id} className="rounded-lg border border-border/70 bg-card p-3.5 text-xs space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono font-bold text-foreground">Order #{po.order_id}</span>
                                            <span
                                                className={cn(
                                                    'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                                                    po.priority === 'rush'
                                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
                                                )}
                                            >
                                                {po.priority}
                                            </span>
                                        </div>
                                        <p className="font-semibold text-foreground">{po.client?.business_name ?? 'Client'}</p>
                                        <p className="text-muted-foreground">
                                            Est. Completion: <span className="font-mono">{po.estimated_completion_date ?? 'Unscheduled'}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bottom Sections: Recent Activity & Quick Access */}
                    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                        <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6 lg:col-span-2">
                            <div className="flex items-center justify-between border-b border-border/70 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                        <ClipboardList className="size-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-foreground">Recent Order Activity</h2>
                                        <p className="text-xs text-muted-foreground">Latest order updates and history</p>
                                    </div>
                                </div>
                                <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                                    {recentOrders.length} Recent
                                </span>
                            </div>

                            {recentOrders.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground">
                                    <ClipboardList className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                                    <p className="text-sm">No recent order activity.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/60">
                                    {recentOrders.map((order) => (
                                        <div
                                            key={order.order_id}
                                            className="flex flex-col gap-3 py-4 first:pt-4 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/30 font-mono text-xs font-bold text-foreground">
                                                    #{order.order_id}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold text-foreground">
                                                            {order.client?.business_name ?? 'Customer'}
                                                        </p>
                                                        {order.priority && order.priority !== 'normal' && (
                                                            <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                                                {order.priority}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Clock className="size-3.5 text-muted-foreground/70" />
                                                        <span>
                                                            {new Date(order.created_at).toLocaleDateString('en-PH', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 self-end sm:self-center">
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold capitalize',
                                                        getStatusBadge(order.status),
                                                    )}
                                                >
                                                    {order.status.replace(/_/g, ' ')}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                    className="h-8 px-2.5 text-xs font-semibold text-primary hover:bg-primary/10"
                                                >
                                                    <Link href="/orders">
                                                        View
                                                        <ArrowUpRight className="ml-1 size-3.5" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick Access */}
                        <div className="space-y-4 rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
                            <div className="flex items-center gap-2.5 border-b border-border/70 pb-4">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                    <Sparkles className="size-4" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-foreground">Quick Access</h2>
                                    <p className="text-xs text-muted-foreground">Shortcuts to workspace tools</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Link
                                    href="/orders"
                                    className="group flex items-center justify-between rounded-xl border border-border/70 bg-card p-3.5 transition-all hover:border-primary/40 hover:bg-muted/30"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:text-foreground">
                                            <PackageCheck className="size-4 shrink-0" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-foreground group-hover:text-primary">Orders</span>
                                            <p className="text-[11px] text-muted-foreground">Manage status, priority &amp; delivery batches</p>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary" />
                                </Link>

                                <Link
                                    href="/production-schedules"
                                    className="group flex items-center justify-between rounded-xl border border-border/70 bg-card p-3.5 transition-all hover:border-primary/40 hover:bg-muted/30"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:text-foreground">
                                            <CalendarClock className="size-4 shrink-0" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-foreground group-hover:text-primary">
                                                Production Schedules
                                            </span>
                                            <p className="text-[11px] text-muted-foreground">Plan batches &amp; monitor capacity</p>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary" />
                                </Link>

                                <Link
                                    href="/products"
                                    className="group flex items-center justify-between rounded-xl border border-border/70 bg-card p-3.5 transition-all hover:border-primary/40 hover:bg-muted/30"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:text-foreground">
                                            <PackageMinus className="size-4 shrink-0" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-foreground group-hover:text-primary">Inventory</span>
                                            <p className="text-[11px] text-muted-foreground">Check stock, overstock &amp; expiry risks</p>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
