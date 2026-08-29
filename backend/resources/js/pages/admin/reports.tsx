import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Download, FileText, Users } from 'lucide-react';
import { useState } from 'react';

interface Props {
    filters: { from: string; to: string };
    summary: { inquiries: number; quotations: number; orders: number; newUsers: number; orderValue: number };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Reports', href: '/admin/reports' },
];

const peso = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);

export default function AdminReports({ filters, summary }: Props) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);
    // Export the same range currently used by the server-rendered totals.
    // This prevents a CSV from silently using un-applied input edits.
    const query = new URLSearchParams(filters).toString();
    const reports = [
        { key: 'inquiries', title: 'Inquiries', value: summary.inquiries, icon: FileText },
        { key: 'quotations', title: 'Quotations', value: summary.quotations, icon: FileText },
        { key: 'orders', title: 'Orders', value: summary.orders, icon: FileText },
        { key: 'users', title: 'Users', value: summary.newUsers, icon: Users },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />
            <main className="bmanny-page">
                <div className="mx-auto w-full max-w-[1600px] space-y-6">
                    <header className="bmanny-page-header">
                        <p className="bmanny-page-eyebrow">Administration</p>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Choose a period, then download a CSV.</p>
                    </header>

                    <Card className="rounded-xl border-[#d6e0ee] bg-card shadow-[0_2px_8px_rgba(7,29,73,0.06)] dark:border-border">
                        <CardContent className="flex flex-wrap items-end gap-4 p-5">
                            <label className="grid gap-2 text-sm font-medium text-card-foreground">From<input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground" /></label>
                            <label className="grid gap-2 text-sm font-medium text-card-foreground">To<input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground" /></label>
                            <button type="button" onClick={() => router.get('/admin/reports', { from, to }, { preserveState: true, replace: true })} className="inline-flex h-10 items-center rounded-md bg-[#1547c0] px-4 text-sm font-medium text-white transition-colors hover:bg-[#123ba2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Apply range</button>
                        </CardContent>
                    </Card>

                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Report summary">
                        {[['Inquiries', summary.inquiries], ['Quotations', summary.quotations], ['Orders', summary.orders], ['Order value', peso(summary.orderValue)]].map(([label, value]) => <Card key={label as string} className="rounded-xl border-[#d6e0ee] bg-card shadow-[0_2px_8px_rgba(7,29,73,0.06)] dark:border-border"><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-card-foreground">{value}</p></CardContent></Card>)}
                    </section>

                    <section className="grid gap-4 lg:grid-cols-2" aria-label="CSV report downloads">
                        {reports.map(({ key, title, value, icon: Icon }) => <Card key={key} className="rounded-xl border-border bg-card shadow-sm"><CardContent className="flex items-center gap-4 p-5"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/20 text-[#0A1A3C] dark:text-slate-200"><Icon className="size-5" /></span><div className="min-w-0 flex-1"><h2 className="font-semibold text-card-foreground">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{value} records</p></div><a href={`/admin/reports/${key}/export?${query}`} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"><Download className="size-4" />CSV</a></CardContent></Card>)}
                    </section>
                </div>
            </main>
        </AppLayout>
    );
}
