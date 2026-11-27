import { cn } from '@/lib/utils';
import {
    ArrowRightLeft,
    BadgeCheck,
    BarChart3,
    CheckCircle2,
    CircleDollarSign,
    Clock,
    FileCheck,
    Layers,
    MessageSquare,
    PackageCheck,
    Sparkles,
    TrendingUp,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

export interface MonthlyActivity {
    label: string;
    inquiries: number;
    orders: number;
}

export interface StatusBreakdownItem {
    label: string;
    value: number;
    color: string;
}

export interface AnalyticsPeriod {
    context: string;
    activity: MonthlyActivity[];
    statusBreakdown: StatusBreakdownItem[];
    funnel: Array<{ label: string; value: number }>;
    conversionRate?: number;
    activeOrders?: number;
    totalRevenue: number;
}

export type ActivityPeriods = Record<'daily' | 'weekly' | 'monthly' | 'yearly', AnalyticsPeriod>;

interface DashboardAnalyticsProps {
    workspaceLabel?: string;
    title?: string;
    description: string;
    periods: ActivityPeriods;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);

const PERIOD_OPTIONS = [
    ['daily', 'Daily'],
    ['weekly', 'Weekly'],
    ['monthly', 'Monthly'],
    ['yearly', 'Yearly'],
] as const;

function getStatusIcon(label: string) {
    const l = label.toLowerCase();
    if (l.includes('approved')) return CheckCircle2;
    if (l.includes('production')) return Layers;
    if (l.includes('pickup') || l.includes('delivery')) return PackageCheck;
    if (l.includes('completed')) return Sparkles;
    if (l.includes('cancel')) return XCircle;
    return Clock;
}

export function DashboardAnalytics({
    workspaceLabel = 'Analytics Workspace',
    title = 'ANALYTICS',
    description = 'Business activity and pipeline performance at a glance.',
    periods: analyticsPeriods,
}: DashboardAnalyticsProps) {
    const [period, setPeriod] = useState<keyof ActivityPeriods>('monthly');
    const selected = analyticsPeriods[period] ?? analyticsPeriods.monthly;
    const values = selected.activity ?? [];

    const totalInquiries = values.reduce((sum, item) => sum + item.inquiries, 0);
    const totalOrders = selected.activeOrders ?? values.reduce((sum, item) => sum + item.orders, 0);
    const maximum = Math.max(1, ...values.flatMap((item) => [item.inquiries, item.orders]));
    const totalStatuses = selected.statusBreakdown.reduce((total, item) => total + item.value, 0);
    const conversionRate =
        selected.conversionRate !== undefined
            ? `${selected.conversionRate.toFixed(1)}%`
            : totalInquiries > 0
              ? `${((totalOrders / totalInquiries) * 100).toFixed(1)}%`
              : '0.0%';

    return (
        <section aria-label={title} className="space-y-6">
            {/* Header Banner */}
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="border-l-4 border-amber-400 pl-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{workspaceLabel}</p>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">{title}</h1>
                    <p className="text-xs text-muted-foreground sm:text-sm">{description}</p>
                </div>

                {/* Period Switcher Pills */}
                <div
                    className="inline-flex rounded-xl border border-border/80 bg-muted/30 p-1 shadow-xs"
                    aria-label="Analytics period"
                >
                    {PERIOD_OPTIONS.map(([key, label]) => {
                        const isActive = period === key;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setPeriod(key)}
                                className={cn(
                                    'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                    isActive
                                        ? 'bg-card text-foreground font-bold shadow-xs border border-border/70'
                                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                                )}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </header>

            {/* Top Metric Summary Cards (Inquiries-style) */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                    {
                        label: 'Total Inquiries',
                        value: totalInquiries,
                        description: 'Customer inquiries in range',
                        icon: MessageSquare,
                    },
                    {
                        label: 'Total Orders',
                        value: totalOrders,
                        description: 'Orders placed in range',
                        icon: PackageCheck,
                    },
                    {
                        label: 'Conversion Rate',
                        value: conversionRate,
                        description: 'Inquiry-to-order ratio',
                        icon: Sparkles,
                    },
                    {
                        label: 'Order Value',
                        value: formatCurrency(selected.totalRevenue),
                        description: 'Revenue from active orders',
                        icon: CircleDollarSign,
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
                        <p className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{item.value}</p>
                        <p className="mt-4 text-xs text-muted-foreground">{item.description}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row: Demand & Order Status */}
            <div className="grid gap-6 xl:grid-cols-5">
                {/* Demand (Inquiries vs Orders) */}
                <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6 xl:col-span-3">
                    <div className="flex flex-col gap-2 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-base font-bold text-foreground">Demand Analysis</h2>
                            <p className="text-xs text-muted-foreground">Inquiries received vs orders generated</p>
                        </div>
                        <span className="rounded-full bg-muted/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
                            {selected.context}
                        </span>
                    </div>

                    {/* Chart Area */}
                    <div className="mt-6">
                        {/* Reference lines container */}
                        <div className="relative h-56 w-full pb-6">
                            {/* Horizontal guide lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6 text-[10px] font-mono text-muted-foreground/50">
                                <div className="border-b border-border/40 pb-0.5 flex justify-between">
                                    <span>{maximum}</span>
                                    <span className="text-[10px] text-muted-foreground/40">max</span>
                                </div>
                                <div className="border-b border-border/40 pb-0.5 flex justify-between">
                                    <span>{Math.round(maximum / 2)}</span>
                                </div>
                                <div className="border-b border-border/70 pb-0.5 flex justify-between">
                                    <span>0</span>
                                </div>
                            </div>

                            {/* Bar Columns */}
                            <div
                                className="relative z-10 grid h-full items-end gap-2 pb-6"
                                style={{ gridTemplateColumns: `repeat(${Math.max(values.length, 1)}, minmax(0, 1fr))` }}
                            >
                                {values.map((item) => {
                                    const inqHeight = item.inquiries > 0 ? (item.inquiries / maximum) * 100 : 0;
                                    const ordHeight = item.orders > 0 ? (item.orders / maximum) * 100 : 0;

                                    return (
                                        <div
                                            key={item.label}
                                            className="group flex h-full min-w-0 flex-col justify-end items-center"
                                        >
                                            {/* Column Bars */}
                                            <div className="flex h-full w-full items-end justify-center gap-1.5 sm:gap-2 px-1">
                                                {/* Inquiries Bar */}
                                                <div className="relative flex flex-col items-center h-full justify-end w-3 sm:w-4">
                                                    {item.inquiries > 0 && (
                                                        <span className="mb-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                                            {item.inquiries}
                                                        </span>
                                                    )}
                                                    <div
                                                        className={cn(
                                                            'w-full rounded-t transition-all duration-300',
                                                            item.inquiries > 0
                                                                ? 'bg-blue-600 dark:bg-blue-500 shadow-xs'
                                                                : 'h-0.5 bg-transparent'
                                                        )}
                                                        style={{ height: `${inqHeight}%` }}
                                                        title={`${item.label} Inquiries: ${item.inquiries}`}
                                                    />
                                                </div>

                                                {/* Orders Bar */}
                                                <div className="relative flex flex-col items-center h-full justify-end w-3 sm:w-4">
                                                    {item.orders > 0 && (
                                                        <span className="mb-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                                            {item.orders}
                                                        </span>
                                                    )}
                                                    <div
                                                        className={cn(
                                                            'w-full rounded-t transition-all duration-300',
                                                            item.orders > 0
                                                                ? 'bg-amber-500 dark:bg-amber-400 shadow-xs'
                                                                : 'h-0.5 bg-transparent'
                                                        )}
                                                        style={{ height: `${ordHeight}%` }}
                                                        title={`${item.label} Orders: ${item.orders}`}
                                                    />
                                                </div>
                                            </div>

                                            {/* Label */}
                                            <span className="mt-2.5 truncate text-[11px] font-semibold text-muted-foreground group-hover:text-foreground">
                                                {item.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Chart Legend */}
                        <div className="mt-4 flex flex-wrap items-center justify-between border-t border-border/70 pt-3 text-xs text-muted-foreground">
                            <div className="flex gap-4">
                                <span className="inline-flex items-center gap-2 font-medium">
                                    <span className="size-2.5 rounded-sm bg-blue-600 dark:bg-blue-500" />
                                    Inquiries <strong className="text-foreground">({totalInquiries})</strong>
                                </span>
                                <span className="inline-flex items-center gap-2 font-medium">
                                    <span className="size-2.5 rounded-sm bg-amber-500 dark:bg-amber-400" />
                                    Orders <strong className="text-foreground">({totalOrders})</strong>
                                </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground">Accurate timeline data from records</span>
                        </div>
                    </div>
                </div>

                {/* Order Status Breakdown */}
                <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6 xl:col-span-2">
                    <div className="flex items-center justify-between border-b border-border/70 pb-4">
                        <div>
                            <h2 className="text-base font-bold text-foreground">Order Status Breakdown</h2>
                            <p className="text-xs text-muted-foreground">Orders by current fulfillment stage</p>
                        </div>
                        <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                            {totalStatuses} Orders
                        </span>
                    </div>

                    <div className="mt-5 space-y-4">
                        {selected.statusBreakdown.map((item) => {
                            const Icon = getStatusIcon(item.label);
                            const pct = totalStatuses > 0 ? Math.round((item.value / totalStatuses) * 100) : 0;

                            return (
                                <div key={item.label} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <Icon className="size-3.5 text-muted-foreground" />
                                            <span className="font-semibold text-foreground">{item.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2 font-mono">
                                            <span className="font-bold text-foreground">{item.value}</span>
                                            <span className="text-muted-foreground">({pct}%)</span>
                                        </div>
                                    </div>

                                    {/* Progress Track */}
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${totalStatuses > 0 ? (item.value / totalStatuses) * 100 : 0}%`,
                                                backgroundColor: item.color,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Pipeline Funnel */}
            <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-2 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-foreground">Conversion Pipeline</h2>
                        <p className="text-xs text-muted-foreground">Stage-by-stage progression from inquiry to confirmed order</p>
                    </div>
                    <span className="rounded-full bg-muted/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {selected.context}
                    </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {selected.funnel.map((item, idx) => {
                        const icons = [MessageSquare, FileCheck, BadgeCheck, PackageCheck];
                        const Icon = icons[idx] ?? BarChart3;
                        const firstVal = selected.funnel[0]?.value ?? 0;
                        const pctOfStart = firstVal > 0 ? Math.round((item.value / firstVal) * 100) : 0;

                        return (
                            <div
                                key={item.label}
                                className="relative rounded-xl border border-border/70 bg-muted/20 p-4 transition-all hover:bg-muted/40"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="rounded bg-background/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
                                        {idx === 0 ? '100%' : `${pctOfStart}%`}
                                    </span>
                                    <Icon className="size-4 text-muted-foreground/70" />
                                </div>
                                <p className="mt-2 text-3xl font-black tabular-nums tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                                    {item.value}
                                </p>
                                <p className="mt-2 text-xs font-semibold text-muted-foreground sm:text-sm">{item.label}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
