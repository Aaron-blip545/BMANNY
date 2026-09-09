import { RoleDashboard } from '@/components/role-dashboard';
import { DashboardAnalytics, type ActivityPeriods } from '@/components/dashboard-analytics';
import { CircleHelp, PackageMinus, Trophy, Flame } from 'lucide-react';

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

interface Props {
    stats?: { inquiries: number; pendingReview: number; quotations: number; businessClients: number };
    recentInquiries?: Array<{ inquiry_id: number; status: string; created_at: string; client: { business_name: string } | null }>;
    analytics?: { periods: ActivityPeriods };
    topBuyers?: TopBuyer[];
}

const RANK_MEDALS: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };

function formatPeso(amount: number) {
    return '₱' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatRelativeDate(iso: string | null) {
    if (!iso) return 'No orders yet';
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}yr ago`;
}

function TopBuyersCard({ buyers }: { buyers: TopBuyer[] }) {
    if (buyers.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <h2 className="text-base font-semibold tracking-tight">Top Buyers Forecast</h2>
                </div>
                <p className="text-sm text-muted-foreground">No order data yet. Rankings will appear once clients start placing orders.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card">
            {/* Card header */}
            <div className="flex items-center border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <div>
                        <h2 className="text-base font-semibold tracking-tight">Top Buyers Forecast</h2>
                        <p className="text-xs text-muted-foreground">Ranked by spend · order volume · activity · recency</p>
                    </div>
                </div>
            </div>

            {/* Buyer rows */}
            <div className="divide-y divide-border/60">
                {buyers.map((buyer, idx) => (
                    <div key={buyer.client_id} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40">
                        {/* Rank */}
                        <div className="flex w-7 shrink-0 items-center justify-center">
                            {idx <= 2 ? (
                                <span className="text-lg leading-none">{RANK_MEDALS[idx]}</span>
                            ) : (
                                <span className="text-sm font-bold text-muted-foreground">#{idx + 1}</span>
                            )}
                        </div>

                        {/* Business info */}
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="truncate text-sm font-semibold">{buyer.business_name}</span>
                                {buyer.is_likely_next && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
                                        <Flame className="h-3 w-3" />
                                        Likely to order next
                                    </span>
                                )}
                            </div>

                            {/* Score bar */}
                            <div className="mt-1.5 flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                                        style={{ width: `${buyer.score_pct}%` }}
                                    />
                                </div>
                                <span className="shrink-0 text-[10px] text-muted-foreground">{buyer.score_pct}%</span>
                            </div>

                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                <span>{buyer.order_count} order{buyer.order_count !== 1 ? 's' : ''}</span>
                                <span>·</span>
                                <span>{buyer.inquiry_count} inquir{buyer.inquiry_count !== 1 ? 'ies' : 'y'}</span>
                                <span>·</span>
                                <span>Last order: {formatRelativeDate(buyer.last_order_at)}</span>
                            </div>
                        </div>

                        {/* Total spent */}
                        <div className="shrink-0 text-right">
                            <p className="text-sm font-bold tabular-nums">{formatPeso(buyer.total_spent)}</p>
                            <p className="text-[10px] text-muted-foreground">total spent</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer note */}
            <div className="border-t border-border/60 px-5 py-2.5">
                <p className="text-[11px] text-muted-foreground">
                    🔥 <strong>Likely to order next</strong> = top-quartile score + active open inquiry with no order yet.
                </p>
            </div>
        </div>
    );
}

export default function SalesDashboard({
    stats = { inquiries: 0, pendingReview: 0, quotations: 0, businessClients: 0 },
    recentInquiries = [],
    analytics,
    topBuyers = [],
}: Props) {
    return (
        <RoleDashboard
            title="Sales Agent"
            description="Overview of customer inquiries and quotation work."
            summaryItems={[
                { label: 'Inquiries', value: stats.inquiries, description: 'All customer inquiries' },
                { label: 'Pending Review', value: stats.pendingReview, description: 'Awaiting your review' },
                { label: 'Quotations', value: stats.quotations, description: 'Quotes created' },
                { label: 'Business Clients', value: stats.businessClients, description: 'Registered businesses' },
            ]}
            activityTitle="Recent Inquiry Activity"
            activityItems={recentInquiries.map((inquiry) => ({
                id: inquiry.inquiry_id,
                title: `Inquiry #${inquiry.inquiry_id} from ${inquiry.client?.business_name ?? 'a customer'}`,
                detail: `${inquiry.status} • ${new Date(inquiry.created_at).toLocaleString('en-PH')}`,
            }))}
            dashboardHref="/sales/dashboard"
            quickAccessItems={[
                { title: 'Inquiries', href: '/inquiries', icon: CircleHelp },
                { title: 'Inventory', href: '/products', icon: PackageMinus },
            ]}
            analytics={analytics && <DashboardAnalytics
                title="Sales overview"
                description="Team-wide activity."
                periods={analytics.periods}
            />}
            extraContent={<TopBuyersCard buyers={topBuyers} />}
        />
    );
}
