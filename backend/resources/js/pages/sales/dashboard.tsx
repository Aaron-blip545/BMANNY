import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    CalendarClock,
    CircleHelp,
    FileText,
    PackageMinus,
    Send,
    Sparkles,
    Users,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/sales/dashboard' },
];

interface Props {
    stats?: { inquiries: number; pendingReview: number; quotations: number; businessClients: number };
    recentInquiries?: Array<{ inquiry_id: number; status: string; created_at: string; client: { business_name: string } | null }>;
}

function getStatusConfig(status: string) {
    switch (status) {
        case 'new':
            return { label: 'New', pill: 'bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-300' };
        case 'for_quotation':
            return { label: 'For Quotation', pill: 'bg-purple-100 text-purple-900 dark:bg-purple-500/20 dark:text-purple-300' };
        case 'quotation_sent':
            return { label: 'Quotation Sent', pill: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300' };
        case 'converted':
            return { label: 'Converted', pill: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300' };
        case 'cancelled':
            return { label: 'Cancelled', pill: 'bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-300' };
        default:
            return { label: status.replace('_', ' '), pill: 'bg-muted text-foreground' };
    }
}

export default function SalesDashboard({
    stats = { inquiries: 0, pendingReview: 0, quotations: 0, businessClients: 0 },
    recentInquiries = [],
}: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sales Agent Dashboard" />

            <div className="bmanny-page">
                {/* Header Banner */}
                <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="border-l-4 border-amber-400 pl-3.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sales Workspace</p>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">DASHBOARD</h1>
                        <p className="text-xs text-muted-foreground sm:text-sm">
                            Overview of customer inquiries, quotation work, and client conversions
                        </p>
                    </div>
                </header>

                {/* Metric Summary Cards */}
                <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[
                        {
                            label: 'Inquiries',
                            value: stats.inquiries,
                            description: 'All customer leads',
                            icon: Sparkles,
                        },
                        {
                            label: 'Pending Review',
                            value: stats.pendingReview,
                            description: 'Awaiting your review',
                            icon: CalendarClock,
                        },
                        {
                            label: 'Quotations',
                            value: stats.quotations,
                            description: 'Quotes generated',
                            icon: Send,
                        },
                        {
                            label: 'Business Clients',
                            value: stats.businessClients,
                            description: 'Registered businesses',
                            icon: Users,
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

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                    {/* Recent Inquiry Activity */}
                    <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm lg:col-span-2">
                        <div className="flex items-center justify-between pb-4 border-b border-border/70">
                            <div>
                                <h2 className="text-base font-bold text-foreground sm:text-lg">Recent Inquiry Activity</h2>
                                <p className="text-xs text-muted-foreground">Latest leads and customer inquiries</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs font-semibold text-primary hover:text-primary hover:bg-muted"
                                asChild
                            >
                                <Link href="/inquiries">
                                    See all
                                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                </Link>
                            </Button>
                        </div>

                        <div className="mt-4 space-y-3">
                            {recentInquiries.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground">
                                    <Sparkles className="mx-auto mb-2 h-6 w-6 text-muted-foreground/60" />
                                    No recent inquiry activity recorded.
                                </div>
                            ) : (
                                recentInquiries.slice(0, 5).map((inquiry) => {
                                    const statusConfig = getStatusConfig(inquiry.status);
                                    return (
                                        <div
                                            key={inquiry.inquiry_id}
                                            className="group flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-xs transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-9 shrink-0 items-center justify-center text-muted-foreground">
                                                    <Sparkles className="size-5" />
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-base font-bold text-foreground">
                                                            {inquiry.client?.business_name ?? 'Customer Lead'}
                                                        </p>
                                                        <span className="font-mono text-xs font-bold text-foreground bg-muted/80 border border-border/80 px-2 py-0.5 rounded-md">
                                                            #{inquiry.inquiry_id}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {new Date(inquiry.created_at).toLocaleString('en-PH', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2.5 self-end sm:self-center">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold capitalize ${statusConfig.pill}`}
                                                >
                                                    {statusConfig.label}
                                                </span>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-8 rounded-md bg-muted/60 px-3 text-xs font-semibold hover:bg-muted text-foreground"
                                                    asChild
                                                >
                                                    <Link href="/inquiries">
                                                        View
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Quick Access */}
                    <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
                        <h2 className="text-base font-bold text-foreground sm:text-lg">Quick Access</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Jump directly to your sales workspaces</p>

                        <div className="mt-4 space-y-2.5">
                            {[
                                {
                                    title: 'Inquiries',
                                    href: '/inquiries',
                                    description: 'Lead intake & follow-ups',
                                    icon: CircleHelp,
                                },
                                {
                                    title: 'Quotations',
                                    href: '/quotations',
                                    description: 'Price estimates & orders',
                                    icon: FileText,
                                },
                                {
                                    title: 'Inventory',
                                    href: '/products',
                                    description: 'Raw materials & BOMs',
                                    icon: PackageMinus,
                                },
                            ].map((item) => (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    className="group flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3.5 transition-all hover:border-border hover:bg-muted/50 hover:shadow-xs"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-card border border-border/70 shadow-xs text-muted-foreground group-hover:text-primary">
                                            <item.icon className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                                {item.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
