import { DashboardAnalytics, type ActivityPeriods } from '@/components/dashboard-analytics';
import { NuisanceFlagModal } from '@/components/nuisance-flag-modal';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import {
    AlertTriangle,
    Award,
    CalendarClock,
    CircleDollarSign,
    ClipboardCheck,
    FileText,
    Flame,
    Layers,
    Package,
    Repeat,
    TrendingDown,
    Truck,
} from 'lucide-react';

interface SalesPerformance {
    total_quotations: number;
    accepted_quotations: number;
    rejected_quotations: number;
    pending_quotations: number;
    quote_win_rate: number;
    total_contract_value: number;
    average_order_value: number;
    total_collected: number;
    outstanding_balance: number;
    repeat_opportunities: Array<{
        balance_id: number;
        business_name: string;
        brand_name: string;
        package_slug: string;
        remaining_pouches: number;
        total_pouches: number;
        expires_at: string | null;
        est_reorder_value: number;
    }>;
}

interface CancellationReasonItem {
    reason: string;
    count: number;
    percentage?: number;
}

interface CombinedCancellationReasonItem {
    reason: string;
    inquiry_count: number;
    order_count: number;
    total: number;
    percentage: number;
}

interface LostLeadsData {
    total_inquiries: number;
    lost_count: number;
    lost_rate: number;
    total_orders?: number;
    cancelled_orders_count?: number;
    cancelled_orders_rate?: number;
    most_common_inquiry_reason?: CancellationReasonItem | null;
    most_common_order_reason?: CancellationReasonItem | null;
    most_common_overall?: CombinedCancellationReasonItem | null;
    unavailable_reviews: number;
    reasons: CancellationReasonItem[];
    order_cancellation_reasons?: CancellationReasonItem[];
    combined_reasons?: CombinedCancellationReasonItem[];
    flagged_clients?: Array<{ client_id: number; business_name: string; strikes: number; reason: string; flagged_at: string | null }>;
    recent_lost: Array<{ inquiry_id: number; business_name: string; reason: string; date: string | null }>;
}

interface TopBuyer {
    client_id: number;
    business_name: string;
    order_count: number;
    total_spent: number;
    inquiry_count: number;
    last_order_at: string | null;
    score: number;
    score_pct: number;
    is_likely_next: boolean;
}

interface ProductDemandData {
    package_demand: Array<{ label: string; count: number }>;
    packaging_demand: Array<{ label: string; count: number }>;
    reviews: {
        total: number;
        pending: number;
        available: number;
        alternative: number;
        unavailable: number;
        approval_rate: number;
    };
}

interface ProductionAnalytics {
    capacity: {
        daily_capacity_units: number;
        active_schedules: number;
        total_queued_units: number;
        backlog_days: number;
        delayed_schedules: number;
        priority_schedules: number;
    };
    total_schedules: number;
    completed_schedules: number;
    on_time_rate: number;
    priority_breakdown: { rush: number; high: number; normal: number };
    delivery_batches: { total: number; delivered: number; in_transit: number; scheduled: number };
    avg_turnaround_days: number | null;
}

interface InventoryRiskAnalytics {
    total_materials: number;
    total_valuation: number;
    out_of_stock: number;
    reorder_alert: number;
    overstock: number;
    expiring_soon: number;
    expired: number;
    critical_items: Array<{
        product_id: number;
        name: string;
        sku: string;
        stock_quantity: number;
        unit_of_measure: string;
        stock_status: string;
        expiry_status: string;
        expiration_date: string | null;
    }>;
}

interface Props {
    role?: string;
    analytics: {
        periods: ActivityPeriods;
        salesPerformance?: SalesPerformance | null;
        lostLeads?: LostLeadsData | null;
        topBuyers?: TopBuyer[];
        productDemand?: ProductDemandData | null;
        production?: ProductionAnalytics | null;
        inventoryRisks?: InventoryRiskAnalytics | null;
    };
}

const peso = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(val || 0);

const ROLE_META: Record<string, { label: string; desc: string }> = {
    admin: {
        label: 'Executive Analytics',
        desc: 'Full business intelligence across inquiries, sales performance, lost leads, product demand, production, and inventory.',
    },
    sales_agent: {
        label: 'Sales Analytics',
        desc: 'Lead conversion pipeline, quotation win rates, lost-lead insights, and repeat-order opportunities.',
    },
    order_manager: {
        label: 'Order & Production Analytics',
        desc: 'Order status progress, production schedule on-time rate, delivery batches, and raw-material risk monitoring.',
    },
    product_controller: {
        label: 'Product & Inventory Analytics',
        desc: 'Most-requested packages, product review outcomes, stock health, overstock, and expiration risks.',
    },
};

export default function AdminAnalytics({ role = 'admin', analytics }: Props) {
    const meta = ROLE_META[role] ?? ROLE_META.admin;
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Analytics', href: '/analytics' }];
    const [flagDetailClientId, setFlagDetailClientId] = useState<number | null>(null);

    const { salesPerformance, lostLeads, topBuyers = [], productDemand, production, inventoryRisks } = analytics;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Analytics" />
            <div className="bmanny-page">
                <div className="bmanny-page-inner space-y-6">
                    {/* Quick Link to Reports */}
                    <div className="flex justify-end">
                        <Link
                            href="/reports"
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-xs font-semibold text-foreground shadow-xs hover:bg-muted"
                        >
                            <FileText className="size-3.5 text-primary" />
                            Export CSV / PDF Reports →
                        </Link>
                    </div>

                    {/* Core Demand, Order Status & Conversion Pipeline */}
                    <DashboardAnalytics
                        workspaceLabel={meta.label}
                        title="ANALYTICS"
                        description={meta.desc}
                        periods={analytics.periods}
                    />

                    {/* SALES PERFORMANCE & PAYMENT COLLECTION (Admin + Sales Agent) */}
                    {salesPerformance && (
                        <section className="rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6 space-y-5">
                            <div className="flex items-center justify-between border-b border-border/70 pb-3">
                                <div className="flex items-center gap-2">
                                    <CircleDollarSign className="size-5 text-emerald-600" />
                                    <div>
                                        <h2 className="text-base font-bold text-foreground">Sales Performance &amp; Payment Collection</h2>
                                        <p className="text-xs text-muted-foreground">Quotation win rate, average order value, and collected vs. pending balances</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                                    <p className="text-xs font-semibold text-muted-foreground">Quote Win Rate</p>
                                    <p className="mt-1 text-2xl font-black text-foreground">{salesPerformance.quote_win_rate}%</p>
                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                        {salesPerformance.accepted_quotations} accepted / {salesPerformance.total_quotations} sent
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                                    <p className="text-xs font-semibold text-muted-foreground">Average Order Value</p>
                                    <p className="mt-1 text-2xl font-black text-foreground">{peso(salesPerformance.average_order_value)}</p>
                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                        Contracted: {peso(salesPerformance.total_contract_value)}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Verified Payments Collected</p>
                                    <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-300">
                                        {peso(salesPerformance.total_collected)}
                                    </p>
                                    <p className="mt-1 text-[11px] text-muted-foreground">Initial + verified balance milestones</p>
                                </div>
                                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Outstanding Balance</p>
                                    <p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300">
                                        {peso(salesPerformance.outstanding_balance)}
                                    </p>
                                    <p className="mt-1 text-[11px] text-muted-foreground">Receivable before pickup / release</p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* BUSINESS OPPORTUNITIES: TOP BUYERS & STORED MOQ REPEAT OPPORTUNITIES */}
                    {(topBuyers.length > 0 || (salesPerformance?.repeat_opportunities.length ?? 0) > 0) && (
                        <div className="grid gap-6 xl:grid-cols-2">
                            {/* Top Buyers Forecast */}
                            <section className="rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6 space-y-4">
                                <div className="flex items-center gap-2 border-b border-border/70 pb-3">
                                    <Award className="size-5 text-amber-500" />
                                    <div>
                                        <h2 className="text-base font-bold text-foreground">Top Buyers &amp; Reorder Forecast</h2>
                                        <p className="text-xs text-muted-foreground">Ranked by spend, order volume, inquiry activity, and recency</p>
                                    </div>
                                </div>
                                {topBuyers.length === 0 ? (
                                    <p className="py-6 text-center text-xs text-muted-foreground">No buyer data yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {topBuyers.map((buyer, idx) => (
                                            <div key={buyer.client_id} className="space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-muted-foreground">#{idx + 1}</span>
                                                        <span className="font-bold text-foreground">{buyer.business_name}</span>
                                                        {buyer.is_likely_next && (
                                                            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                                                Likely to Order Next
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="font-mono font-bold text-foreground">{peso(buyer.total_spent)}</span>
                                                </div>
                                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full rounded-full bg-blue-600"
                                                        style={{ width: `${Math.max(6, buyer.score_pct)}%` }}
                                                    />
                                                </div>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {buyer.order_count} orders · {buyer.inquiry_count} inquiries
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Stored MOQ Repeat-Order Opportunities */}
                            {salesPerformance && (
                                <section className="rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6 space-y-4">
                                    <div className="flex items-center gap-2 border-b border-border/70 pb-3">
                                        <Repeat className="size-5 text-blue-600" />
                                        <div>
                                            <h2 className="text-base font-bold text-foreground">Stored Packaging Repeat Opportunities</h2>
                                            <p className="text-xs text-muted-foreground">Active Gold/Elite clients with stored pouches ready for next batch</p>
                                        </div>
                                    </div>
                                    {salesPerformance.repeat_opportunities.length === 0 ? (
                                        <p className="py-6 text-center text-xs text-muted-foreground">No active stored packaging balances.</p>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {salesPerformance.repeat_opportunities.map((opp) => (
                                                <div key={opp.balance_id} className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="font-bold text-foreground">
                                                            {opp.business_name} <span className="text-muted-foreground font-normal">({opp.brand_name})</span>
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            {opp.remaining_pouches.toLocaleString()} / {opp.total_pouches.toLocaleString()} pouches left · {opp.package_slug.toUpperCase()}
                                                            {opp.expires_at ? ` · Exp ${opp.expires_at}` : ''}
                                                        </p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                                            {peso(opp.est_reorder_value)}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">Est. pipeline</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>
                    )}

                    {/* LOST LEADS & PRODUCT DEMAND ROW */}
                    {(lostLeads || productDemand) && (
                        <div className="grid gap-6 xl:grid-cols-2">
                            {lostLeads && (
                                <section className="rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6 space-y-4">
                                    <div className="flex items-center justify-between border-b border-border/70 pb-3">
                                        <div className="flex items-center gap-2">
                                            <TrendingDown className="size-5 text-rose-600" />
                                            <div>
                                                <h2 className="text-base font-bold text-foreground">Lost &amp; Cancelled Inquiries / Orders</h2>
                                                <p className="text-xs text-muted-foreground">Most common cancellation reasons across inquiries and orders</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                                            <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:text-rose-300">
                                                {lostLeads.lost_count} Inquiries ({lostLeads.lost_rate}%)
                                            </span>
                                            {(lostLeads.cancelled_orders_count ?? 0) > 0 && (
                                                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                                                    {lostLeads.cancelled_orders_count} Orders ({lostLeads.cancelled_orders_rate ?? 0}%)
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {lostLeads.most_common_overall && (
                                        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                                                #1 Most Common Cancellation Reason
                                            </p>
                                            <div className="mt-1 flex items-baseline justify-between gap-3">
                                                <p className="text-sm font-bold text-foreground">
                                                    &ldquo;{lostLeads.most_common_overall.reason}&rdquo;
                                                </p>
                                                <span className="shrink-0 font-mono text-xs font-bold text-rose-700 dark:text-rose-300">
                                                    {lostLeads.most_common_overall.total} cases ({lostLeads.most_common_overall.percentage}%)
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                {lostLeads.most_common_overall.inquiry_count} cancelled inquiries · {lostLeads.most_common_overall.order_count} cancelled orders
                                            </p>
                                        </div>
                                    )}

                                    {lostLeads.reasons.length === 0 && (lostLeads.order_cancellation_reasons?.length ?? 0) === 0 ? (
                                        <p className="py-6 text-center text-xs text-muted-foreground">No lost or cancelled inquiries or orders recorded.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {lostLeads.reasons.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                        Cancelled / Lost Inquiry Reasons
                                                    </p>
                                                    {lostLeads.reasons.map((item) => {
                                                        const pct = item.percentage ?? (lostLeads.lost_count > 0 ? Math.round((item.count / lostLeads.lost_count) * 100) : 0);
                                                        return (
                                                            <div key={item.reason} className="space-y-1 text-xs">
                                                                <div className="flex justify-between gap-2">
                                                                    <span className="font-semibold text-foreground">{item.reason}</span>
                                                                    <span className="shrink-0 font-mono text-muted-foreground">{item.count} ({pct}%)</span>
                                                                </div>
                                                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                                    <div className="h-full rounded-full bg-rose-500" style={{ width: `${pct}%` }} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {lostLeads.order_cancellation_reasons && lostLeads.order_cancellation_reasons.length > 0 && (
                                                <div className="space-y-2 border-t border-border/60 pt-2.5">
                                                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                                        Cancelled Order Reasons ({lostLeads.cancelled_orders_count ?? 0})
                                                    </p>
                                                    {lostLeads.order_cancellation_reasons.map((item) => {
                                                        const totalOrd = lostLeads.cancelled_orders_count ?? 0;
                                                        const pct = item.percentage ?? (totalOrd > 0 ? Math.round((item.count / totalOrd) * 100) : 0);
                                                        return (
                                                            <div key={`ord-${item.reason}`} className="space-y-1 text-xs">
                                                                <div className="flex justify-between gap-2">
                                                                    <span className="font-semibold text-foreground">{item.reason}</span>
                                                                    <span className="shrink-0 font-mono text-muted-foreground">{item.count} ({pct}%)</span>
                                                                </div>
                                                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {lostLeads.flagged_clients && lostLeads.flagged_clients.length > 0 && (
                                        <div className="pt-2 border-t border-border/60 space-y-2">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                                                Flagged Nuisance Clients ({lostLeads.flagged_clients.length})
                                            </p>
                                            <div className="space-y-1.5">
                                                {lostLeads.flagged_clients.map((fc) => (
                                                    <button
                                                        type="button"
                                                        key={fc.client_id}
                                                        onClick={() => setFlagDetailClientId(fc.client_id)}
                                                        className="w-full text-left rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs flex items-center justify-between gap-2 transition-colors hover:border-rose-500/60 hover:bg-rose-500/10 cursor-pointer"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-foreground">{fc.business_name}</p>
                                                            <p className="text-[11px] text-muted-foreground truncate">{fc.reason}</p>
                                                            <p className="mt-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                                                                Click to inspect flag details &amp; incidents →
                                                            </p>
                                                        </div>
                                                        <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shrink-0">
                                                            {fc.strikes} strikes
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </section>
                            )}

                            {productDemand && (
                                <section className="rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6 space-y-4">
                                    <div className="flex items-center justify-between border-b border-border/70 pb-3">
                                        <div className="flex items-center gap-2">
                                            <ClipboardCheck className="size-5 text-indigo-600" />
                                            <div>
                                                <h2 className="text-base font-bold text-foreground">Product Requests &amp; Demand Trends</h2>
                                                <p className="text-xs text-muted-foreground">Most-requested packages and Product Control feasibility outcomes</p>
                                            </div>
                                        </div>
                                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                            {productDemand.reviews.approval_rate}% Feasible
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                        <div className="rounded-lg bg-emerald-500/10 p-2.5">
                                            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{productDemand.reviews.available}</p>
                                            <p className="text-[10px] font-semibold text-muted-foreground">Available</p>
                                        </div>
                                        <div className="rounded-lg bg-amber-500/10 p-2.5">
                                            <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{productDemand.reviews.alternative}</p>
                                            <p className="text-[10px] font-semibold text-muted-foreground">Alternative</p>
                                        </div>
                                        <div className="rounded-lg bg-rose-500/10 p-2.5">
                                            <p className="text-lg font-bold text-rose-700 dark:text-rose-300">{productDemand.reviews.unavailable}</p>
                                            <p className="text-[10px] font-semibold text-muted-foreground">Unavailable</p>
                                        </div>
                                        <div className="rounded-lg bg-blue-500/10 p-2.5">
                                            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{productDemand.reviews.pending}</p>
                                            <p className="text-[10px] font-semibold text-muted-foreground">Pending</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-1">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Top Requested Packages / Formats</p>
                                        {productDemand.package_demand.length === 0 ? (
                                            <p className="text-xs text-muted-foreground">No customization requests yet.</p>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                {productDemand.package_demand.map((p) => (
                                                    <div key={p.label} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                                                        <span className="font-semibold text-foreground truncate">{p.label}</span>
                                                        <span className="font-mono font-bold text-primary">{p.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}

                    {/* PRODUCTION & INVENTORY RISK ANALYTICS (Admin, Order Manager, Product Controller) */}
                    {(production || inventoryRisks) && (
                        <div className="grid gap-6 xl:grid-cols-2">
                            {production && (
                                <section className="rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6 space-y-4">
                                    <div className="flex items-center justify-between border-b border-border/70 pb-3">
                                        <div className="flex items-center gap-2">
                                            <CalendarClock className="size-5 text-blue-600" />
                                            <div>
                                                <h2 className="text-base font-bold text-foreground">Production &amp; Delivery Performance</h2>
                                                <p className="text-xs text-muted-foreground">Schedule adherence, priority load, and batch fulfillment</p>
                                            </div>
                                        </div>
                                        <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                                            {production.on_time_rate}% On-Time
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 text-xs">
                                        <div className="rounded-lg bg-muted/30 p-3">
                                            <p className="text-muted-foreground">Active Queue</p>
                                            <p className="mt-1 text-xl font-bold text-foreground">{production.capacity.active_schedules}</p>
                                            <p className="text-[11px] text-muted-foreground">{production.capacity.backlog_days}d backlog</p>
                                        </div>
                                        <div className="rounded-lg bg-muted/30 p-3">
                                            <p className="text-muted-foreground">Delivery Batches</p>
                                            <p className="mt-1 text-xl font-bold text-foreground">{production.delivery_batches.delivered}/{production.delivery_batches.total}</p>
                                            <p className="text-[11px] text-muted-foreground">{production.delivery_batches.in_transit} in transit</p>
                                        </div>
                                        <div className="rounded-lg bg-muted/30 p-3">
                                            <p className="text-muted-foreground">Avg Turnaround</p>
                                            <p className="mt-1 text-xl font-bold text-foreground">
                                                {production.avg_turnaround_days !== null ? `${production.avg_turnaround_days}d` : '—'}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">Order to completion</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/15 px-3.5 py-2.5 text-xs">
                                        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                                            <Flame className="size-3.5 text-rose-500" /> Active Order Priority Mix
                                        </span>
                                        <div className="flex gap-3 font-mono font-semibold">
                                            <span className="text-rose-600">Rush: {production.priority_breakdown.rush}</span>
                                            <span className="text-amber-600">High: {production.priority_breakdown.high}</span>
                                            <span className="text-muted-foreground">Normal: {production.priority_breakdown.normal}</span>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {inventoryRisks && (
                                <section className="rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6 space-y-4">
                                    <div className="flex items-center justify-between border-b border-border/70 pb-3">
                                        <div className="flex items-center gap-2">
                                            <Package className="size-5 text-amber-600" />
                                            <div>
                                                <h2 className="text-base font-bold text-foreground">Inventory Health &amp; Expiration Risks</h2>
                                                <p className="text-xs text-muted-foreground">Stock valuation, shortages, overstock, and shelf-life alerts</p>
                                            </div>
                                        </div>
                                        <span className="font-mono text-xs font-bold text-foreground">
                                            Value: {peso(inventoryRisks.total_valuation)}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-5 gap-2 text-center text-xs">
                                        <div className="rounded-lg bg-rose-500/10 p-2">
                                            <p className="text-lg font-bold text-rose-600">{inventoryRisks.out_of_stock}</p>
                                            <p className="text-[10px] text-muted-foreground">Out</p>
                                        </div>
                                        <div className="rounded-lg bg-amber-500/10 p-2">
                                            <p className="text-lg font-bold text-amber-600">{inventoryRisks.reorder_alert}</p>
                                            <p className="text-[10px] text-muted-foreground">Reorder</p>
                                        </div>
                                        <div className="rounded-lg bg-blue-500/10 p-2">
                                            <p className="text-lg font-bold text-blue-600">{inventoryRisks.overstock}</p>
                                            <p className="text-[10px] text-muted-foreground">Overstock</p>
                                        </div>
                                        <div className="rounded-lg bg-orange-500/10 p-2">
                                            <p className="text-lg font-bold text-orange-600">{inventoryRisks.expiring_soon}</p>
                                            <p className="text-[10px] text-muted-foreground">Exp ≤30d</p>
                                        </div>
                                        <div className="rounded-lg bg-rose-500/15 p-2">
                                            <p className="text-lg font-bold text-rose-700">{inventoryRisks.expired}</p>
                                            <p className="text-[10px] text-muted-foreground">Expired</p>
                                        </div>
                                    </div>

                                    {inventoryRisks.critical_items.length > 0 && (
                                        <div className="space-y-1.5">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                Materials Requiring Attention
                                            </p>
                                            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                                                {inventoryRisks.critical_items.map((item) => (
                                                    <div key={item.product_id} className="flex items-center justify-between rounded-md bg-muted/25 px-3 py-1.5 text-xs">
                                                        <div>
                                                            <span className="font-semibold text-foreground">{item.name}</span>
                                                            <span className="ml-2 font-mono text-[10px] text-muted-foreground">{item.sku}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-[11px]">{item.stock_quantity} {item.unit_of_measure}</span>
                                                            <span
                                                                className={cn(
                                                                    'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase',
                                                                    item.expiry_status === 'expired' || item.stock_status === 'out_of_stock'
                                                                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                                                                        : item.stock_status === 'overstock'
                                                                          ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                                                                          : 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
                                                                )}
                                                            >
                                                                {item.expiry_status === 'expired'
                                                                    ? 'Expired'
                                                                    : item.expiry_status === 'expiring_soon'
                                                                      ? `Exp ${item.expiration_date}`
                                                                      : item.stock_status.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <NuisanceFlagModal
                clientId={flagDetailClientId}
                onClose={() => setFlagDetailClientId(null)}
                canToggle={role === 'admin' || role === 'sales_agent'}
            />
        </AppLayout>
    );
}
