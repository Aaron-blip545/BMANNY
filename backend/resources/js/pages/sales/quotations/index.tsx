import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { FileText, ImageIcon, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Quotations', href: '/quotations' },
];

interface BusinessClient {
    client_id: number;
    business_name: string;
    contact_person: string;
    user: { email: string } | null;
}

interface Inquiry {
    inquiry_id: number;
    client: BusinessClient | null;
}

interface Quotation {
    quotation_id: number;
    status: 'sent' | 'accepted' | 'rejected';
    total_amount: string | number;
    valid_until: string | null;
    item_details: string | null;
    created_at: string;
    inquiry: Inquiry | null;
    payment_method: string | null;
    payment_proof_url: string | null;
    payment_submitted_at: string | null;
}

interface Props {
    quotations: Quotation[];
}

const STATUS_COLORS: Record<string, string> = {
    sent:     'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    accepted: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    rejected: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    gcash: 'GCash',
    card:  'Card',
    cod:   'Cash on Delivery',
};

// Virtual filter categories - finer-grained than the raw `status` column,
// since "awaiting payment" vs "payment submitted" are both status `sent`
// and only differ by whether payment_submitted_at is set.
const STATUS_FILTERS = ['all', 'awaiting_payment', 'payment_submitted', 'accepted', 'rejected'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
    all:                'All Statuses',
    awaiting_payment:   'Awaiting Payment',
    payment_submitted:  'Payment Submitted',
    accepted:           'Accepted',
    rejected:           'Rejected',
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function formatCurrency(amount: string | number) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(Number(amount));
}

export default function QuotationsPage({ quotations }: Props) {
    const { flash, errors } = usePage().props as any;
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    function handleAccept(quotation: Quotation) {
        const client = quotation.inquiry?.client;
        const confirmed = window.confirm(
            `Accept quotation #${quotation.quotation_id} for ${client?.business_name ?? 'this client'} ` +
            `(${formatCurrency(quotation.total_amount)})?\n\n` +
            `This will create a new Order and forward it to the Order Manager.`,
        );
        if (!confirmed) return;

        router.post(
            route('quotations.accept', { id: quotation.quotation_id }),
            {},
            { preserveScroll: true },
        );
    }

    function handleRejectPayment(quotation: Quotation) {
        const confirmed = window.confirm(
            `Reject the payment submitted for quotation #${quotation.quotation_id}? ` +
            `The client will be asked to resubmit proof of payment.`,
        );
        if (!confirmed) return;

        router.post(
            route('quotations.reject-payment', { id: quotation.quotation_id }),
            {},
            { preserveScroll: true },
        );
    }

    const sent     = quotations.filter((q) => q.status === 'sent' && !q.payment_submitted_at).length;
    const awaitingConfirmation = quotations.filter((q) => q.status === 'sent' && q.payment_submitted_at).length;
    const accepted = quotations.filter((q) => q.status === 'accepted').length;

    const filteredQuotations = useMemo(() => {
        const term = search.trim().toLowerCase();

        return quotations.filter((quotation) => {
            const paymentSubmitted = quotation.status === 'sent' && !!quotation.payment_submitted_at;

            const matchesFilter =
                statusFilter === 'all' ||
                (statusFilter === 'awaiting_payment' && quotation.status === 'sent' && !paymentSubmitted) ||
                (statusFilter === 'payment_submitted' && paymentSubmitted) ||
                (statusFilter === 'accepted' && quotation.status === 'accepted') ||
                (statusFilter === 'rejected' && quotation.status === 'rejected');

            if (!matchesFilter) return false;
            if (!term) return true;

            return (
                String(quotation.quotation_id).includes(term) ||
                (quotation.inquiry ? String(quotation.inquiry.inquiry_id).includes(term) : false) ||
                (quotation.inquiry?.client?.business_name.toLowerCase().includes(term) ?? false) ||
                (quotation.inquiry?.client?.contact_person.toLowerCase().includes(term) ?? false) ||
                (quotation.inquiry?.client?.user?.email.toLowerCase().includes(term) ?? false)
            );
        });
    }, [quotations, search, statusFilter]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Quotations" />

            <div className="p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Quotations</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Review sent quotations. Once a client submits payment, confirm it here to create the Order.
                        </p>
                    </div>
                </div>

                {/* Flash / error messages */}
                {flash?.success && (
                    <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
                        {flash.success}
                    </div>
                )}
                {errors?.status && (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                        {errors.status}
                    </div>
                )}

                {/* Stats row */}
                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                        { label: 'Total',                 value: quotations.length,      color: 'text-foreground' },
                        { label: 'Awaiting Payment',      value: sent,                    color: 'text-amber-600 dark:text-amber-400' },
                        { label: 'Payment Submitted',     value: awaitingConfirmation,    color: 'text-blue-600 dark:text-blue-400' },
                        { label: 'Accepted',              value: accepted,                color: 'text-green-600 dark:text-green-400' },
                    ].map((s) => (
                        <Card key={s.label} className="border-border/60">
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground">{s.label}</p>
                                <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Search & filter controls */}
                <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-sm font-medium text-foreground">
                        {filteredQuotations.length} of {quotations.length} quotations
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search business, contact, quote #…"
                                className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-72"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            {STATUS_FILTERS.map((s) => (
                                <option key={s} value={s}>
                                    {STATUS_FILTER_LABELS[s]}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <Card className="border-border/60 shadow-sm">
                    <CardContent className="p-0">
                        {filteredQuotations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                                <FileText className="h-10 w-10 opacity-40" />
                                <p className="text-sm">
                                    {quotations.length === 0 ? 'No quotations yet.' : 'No quotations match your search or filter.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-border text-xs text-muted-foreground">
                                        <tr>
                                            <th className="p-4 font-medium">#</th>
                                            <th className="p-4 font-medium">Client</th>
                                            <th className="p-4 font-medium">Inquiry</th>
                                            <th className="p-4 font-medium">Total Amount</th>
                                            <th className="p-4 font-medium">Status</th>
                                            <th className="p-4 font-medium">Payment</th>
                                            <th className="p-4 font-medium">Sent Date</th>
                                            <th className="p-4 font-medium">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredQuotations.map((quotation) => {
                                            const paymentSubmitted = quotation.status === 'sent' && !!quotation.payment_submitted_at;

                                            return (
                                                <tr
                                                    key={quotation.quotation_id}
                                                    className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                                                >
                                                    <td className="p-4 font-mono text-xs text-muted-foreground">
                                                        #{quotation.quotation_id}
                                                    </td>
                                                    <td className="p-4 font-medium">
                                                        <div>{quotation.inquiry?.client?.business_name ?? '—'}</div>
                                                        <div className="text-xs text-muted-foreground opacity-70">
                                                            {quotation.inquiry?.client?.contact_person ?? ''}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-muted-foreground font-mono text-xs">
                                                        {quotation.inquiry
                                                            ? `#${quotation.inquiry.inquiry_id}`
                                                            : '—'}
                                                    </td>
                                                    <td className="p-4 font-medium tabular-nums">
                                                        {formatCurrency(quotation.total_amount)}
                                                    </td>
                                                    <td className="p-4">
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[quotation.status] ?? ''}`}
                                                        >
                                                            {quotation.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        {paymentSubmitted ? (
                                                            <div className="space-y-1">
                                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                                                                    Submitted
                                                                </span>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {quotation.payment_method
                                                                        ? PAYMENT_METHOD_LABELS[quotation.payment_method] ?? quotation.payment_method
                                                                        : '—'}
                                                                </div>
                                                                {quotation.payment_proof_url && (
                                                                    <a
                                                                        href={quotation.payment_proof_url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="inline-flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
                                                                    >
                                                                        <ImageIcon className="h-3 w-3" />
                                                                        View proof
                                                                    </a>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">
                                                                {quotation.status === 'sent' ? 'Awaiting payment' : '—'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-muted-foreground text-xs">
                                                        {formatDate(quotation.created_at)}
                                                    </td>
                                                    <td className="p-4">
                                                        {paymentSubmitted ? (
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleAccept(quotation)}
                                                                >
                                                                    Accept &amp; Create Order
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-destructive hover:text-destructive"
                                                                    onClick={() => handleRejectPayment(quotation)}
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </div>
                                                        ) : quotation.status === 'sent' ? (
                                                            <span className="text-xs text-muted-foreground">
                                                                Waiting for client to pay
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground capitalize">
                                                                {quotation.status}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
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
