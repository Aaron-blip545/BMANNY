import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ClipboardList, MessageSquare, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Inquiries', href: '/inquiries' }];

interface Customization {
    customization_id: number;
    packaging_type: string;
    packaging_finish: string | null;
    serving_size: string | null;
    client_notes: string | null;
}

interface BusinessClient {
    client_id: number;
    business_name: string;
    contact_person: string;
    user: { email: string } | null;
}

interface Inquiry {
    inquiry_id: number;
    status: 'pending' | 'reviewed' | 'responded' | 'closed';
    created_at: string;
    client: BusinessClient | null;
    customizations: Customization[];
    quotation: null | { quotation_id: number };
}

interface Props {
    inquiries: Inquiry[];
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-muted text-muted-foreground',
    reviewed: 'bg-muted text-muted-foreground',
    responded: 'bg-muted text-muted-foreground',
    closed: 'bg-muted text-muted-foreground',
};

const STATUS_FILTERS = ['all', 'pending', 'reviewed', 'responded', 'closed'] as const;

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function InquiriesPage({ inquiries }: Props) {
    const { flash } = usePage().props as any;
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('all');

    const pending   = inquiries.filter((i) => i.status === 'pending').length;
    const responded = inquiries.filter((i) => i.status === 'responded').length;

    const filteredInquiries = useMemo(() => {
        const term = search.trim().toLowerCase();

        return inquiries.filter((inquiry) => {
            if (statusFilter !== 'all' && inquiry.status !== statusFilter) return false;
            if (!term) return true;

            return (
                String(inquiry.inquiry_id).includes(term) ||
                (inquiry.client?.business_name.toLowerCase().includes(term) ?? false) ||
                (inquiry.client?.contact_person.toLowerCase().includes(term) ?? false) ||
                (inquiry.client?.user?.email.toLowerCase().includes(term) ?? false) ||
                inquiry.customizations.some((c) => c.packaging_type.toLowerCase().includes(term))
            );
        });
    }, [inquiries, search, statusFilter]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inquiries" />

            <div className="bg-background p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Inquiries</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Customer rebranding &amp; packaging inquiries. Create a quotation to respond.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={route('quotations.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Quotation
                        </Link>
                    </Button>
                </div>

                {/* Flash message */}
                {flash?.success && (
                    <div className="mb-4 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground">
                        {flash.success}
                    </div>
                )}

                {/* Stats row */}
                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                        { label: 'Total',     value: inquiries.length },
                        { label: 'Pending',   value: pending },
                        { label: 'Responded', value: responded },
                        { label: 'Closed',    value: inquiries.filter((i) => i.status === 'closed').length },
                    ].map((s) => (
                        <Card key={s.label} className="rounded-xl border-border bg-card shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                                <p className="mt-1 text-2xl font-semibold tracking-tight text-card-foreground">{s.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Search & filter controls */}
                <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-sm font-medium text-foreground">
                        {filteredInquiries.length} of {inquiries.length} inquiries
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search business, contact, email…"
                                className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-72"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_FILTERS)[number])}
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            {STATUS_FILTERS.map((s) => (
                                <option key={s} value={s} className="capitalize">
                                    {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <Card className="rounded-xl border-border bg-card shadow-sm">
                    <CardContent className="p-0">
                        {filteredInquiries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                                <ClipboardList className="h-10 w-10 opacity-40" />
                                <p className="text-sm">
                                    {inquiries.length === 0 ? 'No inquiries yet.' : 'No inquiries match your search or filter.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-border text-xs text-muted-foreground">
                                        <tr>
                                            <th className="p-4 font-medium">#</th>
                                            <th className="p-4 font-medium">Business</th>
                                            <th className="p-4 font-medium">Contact</th>
                                            <th className="p-4 font-medium">Packaging Types</th>
                                            <th className="p-4 font-medium">Status</th>
                                            <th className="p-4 font-medium">Date</th>
                                            <th className="p-4 font-medium">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredInquiries.map((inquiry) => (
                                            <tr
                                                key={inquiry.inquiry_id}
                                                className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/50"
                                            >
                                                <td className="p-4 font-mono text-xs text-muted-foreground">
                                                    #{inquiry.inquiry_id}
                                                </td>
                                                <td className="p-4 font-medium">
                                                    {inquiry.client?.business_name ?? '—'}
                                                </td>
                                                <td className="p-4 text-muted-foreground">
                                                    <div>{inquiry.client?.contact_person ?? '—'}</div>
                                                    <div className="text-xs opacity-70">{inquiry.client?.user?.email ?? ''}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {inquiry.customizations.length === 0 ? (
                                                            <span className="text-muted-foreground">—</span>
                                                        ) : (
                                                            inquiry.customizations.map((c) => (
                                                                <span
                                                                    key={c.customization_id}
                                                                    className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                                                                >
                                                                    {c.packaging_type}
                                                                </span>
                                                            ))
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span
                                                        className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium capitalize ${STATUS_COLORS[inquiry.status] ?? ''}`}
                                                    >
                                                        {inquiry.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-muted-foreground text-xs">
                                                    {formatDate(inquiry.created_at)}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        {/* Chat — always available */}
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={route('chat.show', inquiry.inquiry_id)}>
                                                                <MessageSquare className="mr-1 h-3.5 w-3.5" />
                                                                Chat
                                                            </Link>
                                                        </Button>

                                                        {/* Quote — only on pending/reviewed */}
                                                        {inquiry.status === 'pending' || inquiry.status === 'reviewed' ? (
                                                            <Button variant="outline" size="sm" asChild>
                                                                <Link href={route('quotations.create', { inquiry_id: inquiry.inquiry_id })}>
                                                                    Quote
                                                                </Link>
                                                            </Button>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground capitalize">{inquiry.status}</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
