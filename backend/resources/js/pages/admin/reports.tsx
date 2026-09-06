import { Card, CardContent } from '@/components/ui/card';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CalendarRange, Download, FileText, RefreshCw, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

interface Props {
    filters: { from: string; to: string };
    summary: { inquiries: number; quotations: number; orders: number; orderValue: number };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Reports', href: '/admin/reports' },
];

const peso = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);

function formatPreset(date: Date, timeStr: string = '00:00'): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d} ${timeStr}`;
}

export default function AdminReports({ filters, summary }: Props) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);
    const [importType, setImportType] = useState<'inquiries' | 'quotations' | 'orders'>('inquiries');
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);

    // Export the same range currently used by the server-rendered totals.
    const query = new URLSearchParams(filters).toString();

    const reports = [
        { key: 'inquiries', title: 'Inquiries', value: summary.inquiries, icon: FileText },
        { key: 'quotations', title: 'Quotations', value: summary.quotations, icon: FileText },
        { key: 'orders', title: 'Orders', value: summary.orders, icon: FileText },
    ];

    const importCsv = () => {
        if (!importFile) {
            setImportError('Choose a CSV file first.');
            return;
        }

        setImportError(null);
        setIsImporting(true);
        router.post('/admin/reports/import', { type: importType, file: importFile }, {
            forceFormData: true,
            preserveScroll: true,
            onError: (errors) => setImportError(String(errors.file ?? 'The CSV could not be imported.')),
            onSuccess: () => {
                setImportFile(null);
                if (fileInput.current) fileInput.current.value = '';
            },
            onFinish: () => setIsImporting(false),
        });
    };

    const applyRange = (newFrom = from, newTo = to) => {
        router.get(
            '/admin/reports',
            { from: newFrom, to: newTo },
            { preserveState: true, replace: true }
        );
    };

    const handlePreset = (preset: 'today' | 'week' | 'month' | 'last30') => {
        const now = new Date();
        let startDate = new Date();
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 0);

        if (preset === 'today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0);
        } else if (preset === 'week') {
            const dayOfWeek = now.getDay() || 7; // Sunday is 7
            startDate.setDate(now.getDate() - dayOfWeek + 1);
            startDate.setHours(0, 0, 0, 0);
        } else if (preset === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0);
        } else if (preset === 'last30') {
            startDate.setDate(now.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
        }

        const fromStr = formatPreset(startDate, `${String(startDate.getHours()).padStart(2, '0')}:00`);
        const toStr = formatPreset(endDate, `${String(endDate.getHours()).padStart(2, '0')}:00`);

        setFrom(fromStr);
        setTo(toStr);
        applyRange(fromStr, toStr);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />
            <main className="bmanny-page">
                <div className="mx-auto w-full max-w-[1600px] space-y-6">
                    <header className="bmanny-page-header">
                        <p className="bmanny-page-eyebrow">Administration</p>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Filter by custom date and hourly timeframe, then analyze or export CSV reports.
                        </p>
                    </header>

                    {/* Filter Card with Date & Time Pickers and Quick Presets */}
                    <Card className="rounded-2xl border-[#d6e0ee] bg-card shadow-[0_2px_8px_rgba(7,29,73,0.06)] dark:border-border">
                        <CardContent className="p-5 sm:p-6 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <CalendarRange className="size-4 text-primary" />
                                    <span>Date & Time Range Filter</span>
                                </div>

                                {/* Quick Range Presets */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-xs text-muted-foreground mr-1">Presets:</span>
                                    <button
                                        type="button"
                                        onClick={() => handlePreset('today')}
                                        className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                    >
                                        Today
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handlePreset('week')}
                                        className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                    >
                                        This Week
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handlePreset('month')}
                                        className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                    >
                                        This Month
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handlePreset('last30')}
                                        className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                    >
                                        Last 30 Days
                                    </button>
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
                                        onClick={() => applyRange()}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#1547c0] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#123ba2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <RefreshCw className="size-3.5" />
                                        Apply Range
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary KPI Cards */}
                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Report summary">
                        {[
                            ['Inquiries', summary.inquiries],
                            ['Quotations', summary.quotations],
                            ['Orders', summary.orders],
                            ['Order value', peso(summary.orderValue)],
                        ].map(([label, value]) => (
                            <Card
                                key={label as string}
                                className="rounded-xl border-[#d6e0ee] bg-card shadow-[0_2px_8px_rgba(7,29,73,0.06)] dark:border-border"
                            >
                                <CardContent className="p-5">
                                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                        {label}
                                    </p>
                                    <p className="mt-3 text-3xl font-semibold tracking-tight text-card-foreground">
                                        {value}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </section>

                    {/* CSV Report Downloads */}
                    <section className="grid gap-4 lg:grid-cols-2" aria-label="CSV report downloads">
                        {reports.map(({ key, title, value, icon: Icon }) => (
                            <Card key={key} className="rounded-xl border-border bg-card shadow-sm">
                                <CardContent className="flex items-center gap-4 p-5">
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/20 text-[#0A1A3C] dark:text-slate-200">
                                        <Icon className="size-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="font-semibold text-card-foreground">{title}</h2>
                                        <p className="mt-1 text-sm text-muted-foreground">{value} records</p>
                                    </div>
                                    <a
                                        href={`/admin/reports/${key}/export?${query}`}
                                        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                    >
                                        <Download className="size-4" />
                                        CSV
                                    </a>
                                </CardContent>
                            </Card>
                        ))}
                    </section>

                    <Card className="rounded-xl border-border bg-card shadow-sm">
                        <CardContent className="p-5 sm:p-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="font-semibold text-card-foreground">Import historical data</h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Admin only. Import validated CSV records into the system so they appear in reports and analytics.
                                    </p>
                                </div>
                                <a
                                    href={`/admin/reports/import/${importType}/template`}
                                    className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                >
                                    <Download className="size-4" />
                                    Download template
                                </a>
                            </div>

                            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                                <label className="grid gap-1.5 text-sm font-medium text-foreground sm:w-48">
                                    Data type
                                    <select
                                        value={importType}
                                        onChange={(event) => setImportType(event.target.value as typeof importType)}
                                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                    >
                                        <option value="inquiries">Inquiries</option>
                                        <option value="quotations">Quotations</option>
                                        <option value="orders">Orders</option>
                                    </select>
                                </label>
                                <label className="grid flex-1 gap-1.5 text-sm font-medium text-foreground">
                                    CSV file
                                    <input
                                        ref={fileInput}
                                        type="file"
                                        accept=".csv,text/csv"
                                        onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
                                        className="block h-10 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium"
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={importCsv}
                                    disabled={isImporting}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Upload className="size-4" />
                                    {isImporting ? 'Importing…' : 'Import CSV'}
                                </button>
                            </div>
                            {importError && <p className="mt-3 text-sm text-destructive">{importError}</p>}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </AppLayout>
    );
}
