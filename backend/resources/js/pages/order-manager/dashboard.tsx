import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    CheckCircle2,
    ClipboardList,
    Clock,
    Layers,
    PackageCheck,
    PackageMinus,
    Sparkles,
    Truck,
} from 'lucide-react';

interface Props {
    stats?: { approved: number; inProduction: number; forDelivery: number };
    recentOrders?: Array<{
        order_id: number;
        status: string;
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
    stats = { approved: 0, inProduction: 0, forDelivery: 0 },
    recentOrders = [],
}: Props) {
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
                                Overview of order fulfillment and delivery work
                            </p>
                        </div>
                    </header>

                    {/* Metric Summary Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {[
                            {
                                label: 'Approved',
                                value: stats.approved,
                                description: 'Ready for production',
                                icon: CheckCircle2,
                            },
                            {
                                label: 'In Production',
                                value: stats.inProduction,
                                description: 'Being made / packed',
                                icon: Layers,
                            },
                            {
                                label: 'For Delivery',
                                value: stats.forDelivery,
                                description: 'Out for / delivered',
                                icon: Truck,
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
                                <p className="mt-4 text-xs text-muted-foreground">{item.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Bottom Sections: Recent Activity & Quick Access */}
                    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                        {/* Recent Order Activity */}
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
                                    {recentOrders.map((order) => {
                                        const statusPill = getStatusBadge(order.status);
                                        return (
                                            <div
                                                key={order.order_id}
                                                className="flex flex-col gap-3 py-4 first:pt-4 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/30 font-mono text-xs font-bold text-foreground">
                                                        #{order.order_id}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-foreground">
                                                            {order.client?.business_name ?? 'Customer'}
                                                        </p>
                                                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Clock className="size-3.5 text-muted-foreground/70" />
                                                            <span>
                                                                {new Date(order.created_at).toLocaleDateString('en-PH', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                })}{' '}
                                                                ·{' '}
                                                                {new Date(order.created_at).toLocaleTimeString('en-PH', {
                                                                    hour: 'numeric',
                                                                    minute: '2-digit',
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 self-end sm:self-center">
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold capitalize',
                                                            statusPill
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
                                        );
                                    })}
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
                                    className="group flex items-center justify-between rounded-xl border border-border/70 bg-card p-3.5 transition-all hover:border-primary/40 hover:bg-muted/30 hover:shadow-xs"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:text-foreground">
                                            <PackageCheck className="size-4 shrink-0" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-foreground group-hover:text-primary">
                                                Orders
                                            </span>
                                            <p className="text-[11px] text-muted-foreground">
                                                Manage production & delivery
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                                </Link>

                                <Link
                                    href="/products"
                                    className="group flex items-center justify-between rounded-xl border border-border/70 bg-card p-3.5 transition-all hover:border-primary/40 hover:bg-muted/30 hover:shadow-xs"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:text-foreground">
                                            <PackageMinus className="size-4 shrink-0" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-foreground group-hover:text-primary">
                                                Inventory
                                            </span>
                                            <p className="text-[11px] text-muted-foreground">
                                                Check raw materials & stock
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
