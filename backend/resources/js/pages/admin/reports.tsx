import { DateTimePicker } from '@/components/ui/date-time-picker';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    CalendarClock,
    CalendarRange,
    ClipboardCheck,
    Download,
    FileText,
    Package,
    RefreshCw,
    TrendingDown,
    Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';

interface CancellationInsights {
    lost_count: number;
    lost_rate: number;
    cancelled_orders_count: number;
    cancelled_orders_rate: number;
    most_common_overall?: {
        reason: string;
        inquiry_count: number;
        order_count: number;
        total: number;
        percentage: number;
    } | null;
    combined_reasons?: Array<{
        reason: string;
        inquiry_count: number;
        order_count: number;
        total: number;
        percentage: number;
    }>;
}

interface Props {
    role?: string;
    canImport?: boolean;
    allowedReports?: string[];
    cancellationInsights?: CancellationInsights | null;
    filters: { from: string; to: string };
    summary: {
        inquiries: number;
        quotations: number;
        orders: number;
        orderValue: number;
        lostLeads?: number;
        productRequests?: number;
        inventory?: number;
        production?: number;
        reorders?: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Reports', href: '/reports' }];

const peso = (value: number) =>
    new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);

function formatPreset(date: Date, timeStr: string = '00:00'): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d} ${timeStr}`;
}

export default function AdminReports({
    role = 'admin',
    canImport = false,
    allowedReports = ['inquiries', 'quotations', 'orders'],
    cancellationInsights = null,
    filters,
    summary,
}: Props) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);
    const [importType, setImportType] = useState<'inquiries' | 'quotations' | 'orders'>('inquiries');
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);

    const query = new URLSearchParams(filters).toString();

    const allReportCards = [
        { key: 'inquiries', title: 'Inquiries Report', desc: 'All client inquiries, statuses & types', value: summary.inquiries, icon: FileText },
        { key: 'quotations', title: 'Quotations Report', desc: 'Quoted amounts, milestones & validity', value: summary.quotations, icon: FileText },
        { key: 'orders', title: 'Orders & Fulfillment Report', desc: 'Orders, priorities, tracking & payment verification', value: summary.orders, icon: FileText },
        { key: 'reorders', title: 'Sales & Production for Reorders', desc: 'Repeat batches, packaging replenishments, sales value & production status', value: summary.reorders ?? 0, icon: RefreshCw },
        { key: 'lost_leads', title: 'Lost & Cancelled Leads Report', desc: 'Drop-offs with lost/cancellation reasons', value: summary.lostLeads ?? 0, icon: TrendingDown },
        { key: 'product_requests', title: 'Product Requests Review Report', desc: 'Product Control feasibility decisions & notes', value: summary.productRequests ?? 0, icon: ClipboardCheck },
        { key: 'production', title: 'Production Schedules Report', desc: 'Batch schedules, target vs. actual dates & overdue status', value: summary.production ?? 0, icon: CalendarClock },
        { key: 'inventory', title: 'Inventory & Expiration Risk Report', desc: 'Raw material stock, overstock, expiry dates & valuation', value: summary.inventory ?? 0, icon: Package },
    ].filter((r) => allowedReports.includes(r.key));

    const importCsv = () => {
        if (!importFile) {
            setImportError('Choose a CSV file first.');
            return;
        }

        setImportError(null);
        setIsImporting(true);
        router.post(
            '/admin/reports/import',
            { type: importType, file: importFile },
            {
                forceFormData: true,
                preserveScroll: true,
                onError: (errors) => setImportError(String(errors.file ?? 'The CSV could not be imported.')),
                onSuccess: () => {
                    setImportFile(null);
                    if (fileInput.current) fileInput.current.value = '';
                },
                onFinish: () => setIsImporting(false),
            },
        );
    };

    const isRangeInvalid = Boolean(from && to && from > to);

    const applyRange = (newFrom = from, newTo = to) => {
        if (newFrom && newTo && newFrom > newTo) return;
        router.get('/reports', { from: newFrom, to: newTo }, { preserveState: true, replace: true });
    };

    const handlePreset = (preset: 'today' | 'week' | 'month' | 'last30') => {
        const now = new Date();
        let startDate = new Date();
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);

        if (preset === 'today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0);
        } else if (preset === 'week') {
            const dayOfWeek = now.getDay() || 7;
            startDate.setDate(now.getDate() - dayOfWeek + 1);
            startDate.setHours(0, 0, 0, 0);
        } else if (preset === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0);
        } else if (preset === 'last30') {
            startDate.setDate(now.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
        }

        const fromStr = formatPreset(startDate, '00:00');
        const toStr = formatPreset(endDate, '23:59');

        setFrom(fromStr);
        setTo(toStr);
        applyRange(fromStr, toStr);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />
            <div className="bmanny-page">
                <div className="bmanny-page-inner space-y-6">
                    {/* Header Banner */}
                    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="border-l-4 border-amber-400 pl-3.5">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                {role.replace('_', ' ')} Reports
                            </p>
                            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
                                REPORTS
                            </h1>
                            <p className="text-xs text-muted-foreground sm:text-sm">
                                Filter by date &amp; time range, then export role-appropriate CSV or printable PDF reports.
                            </p>
                        </div>

                        {role === 'admin' && (
                            <a
                                href={`/reports/summary/pdf?${query}&autoprint=1`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                            >
                                <FileText className="size-4" />
                                Print Executive Summary PDF
                            </a>
                        )}
                    </header>

                    {/* Date & Time Range Filter Card */}
                    <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <CalendarRange className="size-4 text-muted-foreground" />
                                <span>Date &amp; Time Range Filter</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs text-muted-foreground mr-1">Presets:</span>
                                {(['today', 'week', 'month', 'last30'] as const).map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => handlePreset(preset)}
                                        className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                    >
                                        {preset === 'today' ? 'Today' : preset === 'week' ? 'This Week' : preset === 'month' ? 'This Month' : 'Last 30 Days'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-end gap-4">
                            <DateTimePicker
                                label="From (Date & Time)"
                                value={from}
                                onChange={(val) => setFrom(val)}
                                placeholder="Select start date & hour"
                                className="min-w-[260px] flex-1 sm:flex-initial"
                            />
                            <DateTimePicker
                                label="To (Date & Time)"
                                value={to}
                                onChange={(val) => setTo(val)}
                                placeholder="Select end date & hour"
                                className="min-w-[260px] flex-1 sm:flex-initial"
                            />
                            <div className="flex items-center gap-2 pt-1">
                                <button
                                    type="button"
                                    disabled={isRangeInvalid}
                                    onClick={() => applyRange()}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <RefreshCw className="size-3.5" />
                                    Apply Range
                                </button>
                            </div>
                        </div>
                        {isRangeInvalid && (
                            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                                Invalid date range: &ldquo;From&rdquo; date &amp; time must not be later than &ldquo;To&rdquo; date &amp; time.
                            </p>
                        )}
                    </div>

                    {/* Summary KPI Cards */}
                    <section className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-label="Report summary">
                        {[
                            ['INQUIRIES', summary.inquiries],
                            ['QUOTATIONS', summary.quotations],
                            ['ORDERS', summary.orders],
                            ['ORDER VALUE', peso(summary.orderValue)],
                        ].map(([label, value]) => (
                            <div key={label as string} className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
                                <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
                            </div>
                        ))}
                    </section>

                    {/* Top Cancellation Reasons Insight (for Selected Date Range) */}
                    {cancellationInsights && (cancellationInsights.lost_count > 0 || cancellationInsights.cancelled_orders_count > 0) && (
                        <section className="rounded-xl border border-rose-500/25 bg-card p-5 shadow-sm space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
                                <div className="flex items-center gap-2">
                                    <TrendingDown className="size-5 text-rose-600" />
                                    <div>
                                        <h2 className="text-sm font-bold text-foreground">
                                            Top Cancellation Reasons (Inquiries &amp; Orders)
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            Based on the selected report timeframe
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                                    <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-rose-700 dark:text-rose-300">
                                        {cancellationInsights.lost_count} Cancelled Inquiries ({cancellationInsights.lost_rate}%)
                                    </span>
                                    <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-amber-700 dark:text-amber-300">
                                        {cancellationInsights.cancelled_orders_count} Cancelled Orders ({cancellationInsights.cancelled_orders_rate}%)
                                    </span>
                                </div>
                            </div>

                            {cancellationInsights.most_common_overall && (
                                <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                                        Most Common Reason
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
                                        <p className="text-sm font-bold text-foreground">
                                            &ldquo;{cancellationInsights.most_common_overall.reason}&rdquo;
                                        </p>
                                        <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-300">
                                            {cancellationInsights.most_common_overall.total} cases ({cancellationInsights.most_common_overall.percentage}%)
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        {cancellationInsights.most_common_overall.inquiry_count} inquiries · {cancellationInsights.most_common_overall.order_count} orders
                                    </p>
                                </div>
                            )}

                            {cancellationInsights.combined_reasons && cancellationInsights.combined_reasons.length > 0 && (
                                <div className="grid gap-3 md:grid-cols-2">
                                    {cancellationInsights.combined_reasons.slice(0, 6).map((item) => (
                                        <div key={item.reason} className="space-y-1 text-xs">
                                            <div className="flex justify-between gap-2">
                                                <span className="font-semibold text-foreground truncate">{item.reason}</span>
                                                <span className="shrink-0 font-mono text-muted-foreground">
                                                    {item.total} ({item.percentage}%)
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                <div className="h-full rounded-full bg-rose-500" style={{ width: `${item.percentage}%` }} />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">
                                                {item.inquiry_count} inquiry · {item.order_count} order
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {/* Report Downloads */}
                    <section className="grid gap-4 lg:grid-cols-2" aria-label="Report downloads">
                        {allReportCards.map(({ key, title, desc, value, icon: Icon }) => (
                            <div
                                key={key}
                                className="rounded-xl border border-border/70 bg-card p-5 shadow-sm flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/20 text-muted-foreground">
                                        <Icon className="size-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="font-semibold text-foreground">{title}</h2>
                                        <p className="text-xs text-muted-foreground">{desc}</p>
                                        <p className="mt-1 text-xs font-bold text-primary">{value} records</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 shrink-0">
                                    <a
                                        href={`/reports/${key}/export?${query}`}
                                        className="inline-flex h-9 min-w-[92px] items-center justify-center gap-2 rounded-lg border border-border bg-card px-3.5 text-xs font-bold text-foreground transition-colors hover:bg-muted shadow-xs"
                                        title="Download CSV"
                                    >
                                        <Download className="size-4 text-muted-foreground" />
                                        CSV
                                    </a>
                                    <a
                                        href={`/reports/${key}/pdf?${query}&autoprint=1`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex h-9 min-w-[92px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-3.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 shadow-xs"
                                        title="Print / Save as PDF"
                                    >
                                        <FileText className="size-4" />
                                        PDF
                                    </a>
                                </div>
                            </div>
                        ))}
                    </section>

                    {/* Import Historical Data (Admin Only) */}
                    {canImport && (
                        <div className="rounded-xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm space-y-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="font-semibold text-foreground">Import historical data</h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Admin only. Import validated CSV records into the system so they appear in reports and analytics.
                                    </p>
                                </div>
                                <a
                                    href={`/admin/reports/import/${importType}/template`}
                                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted shadow-xs"
                                >
                                    <Download className="size-3.5 text-muted-foreground" />
                                    Download template
                                </a>
                            </div>

                            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                                <label className="grid gap-1.5 text-xs font-semibold text-foreground sm:w-48">
                                    Data type
                                    <select
                                        value={importType}
                                        onChange={(event) => setImportType(event.target.value as typeof importType)}
                                        className="h-10 rounded-lg border border-input/80 bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="inquiries">Inquiries</option>
                                        <option value="quotations">Quotations</option>
                                        <option value="orders">Orders</option>
                                    </select>
                                </label>
                                <label className="grid flex-1 gap-1.5 text-xs font-semibold text-foreground">
                                    CSV file
                                    <input
                                        ref={fileInput}
                                        type="file"
                                        accept=".csv,text/csv"
                                        onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
                                        className="block h-10 w-full rounded-lg border border-input/80 bg-background px-3 py-1.5 text-xs text-foreground file:mr-3 file:border-0 file:bg-transparent file:text-xs file:font-semibold file:text-foreground focus:outline-none"
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={importCsv}
                                    disabled={isImporting}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Upload className="size-3.5" />
                                    {isImporting ? 'Importing…' : 'Import CSV'}
                                </button>
                            </div>
                            {importError && (
                                <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">{importError}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
