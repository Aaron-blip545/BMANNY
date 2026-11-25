import { confirmModal } from '@/lib/sweetalert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckCircle2, ChevronDown, Clock, FileText, ImageIcon, Plus, Search, Send } from 'lucide-react';
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
    order: { order_id: number; status: string; balance_payment_amount: string | number | null; balance_payment_submitted_at: string | null; balance_payment_verified_at: string | null; balance_payment_proof_url: string | null } | null;
}

interface Props {
    quotations: Quotation[];
}

const STATUS_COLORS: Record<string, string> = {
    sent: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300',
    accepted: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300',
    rejected: 'bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-300',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    gcash: 'GCash',
    bank_transfer: 'Bank Transfer (BDO)',
    card: 'Card',
    cod: 'Cash on Delivery',
};

const STATUS_FILTERS = ['all', 'awaiting_payment', 'payment_submitted', 'accepted', 'rejected'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
    all: 'All Statuses',
    awaiting_payment: 'Awaiting Payment',
    payment_submitted: 'Payment Submitted',
    accepted: 'Accepted',
    rejected: 'Rejected',
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
    const [proofPreview, setProofPreview] = useState<{ url: string; quotationId: number } | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<{ url: string; quotationId: number; milestone: 'Initial' | 'Balance' } | null>(null);

    async function handleAccept(quotation: Quotation) {
        const client = quotation.inquiry?.client;
        const confirmed = await confirmModal({
            title: `Accept Quotation #${quotation.quotation_id}?`,
            text: `Accept quotation for ${client?.business_name ?? 'this client'} (${formatCurrency(quotation.total_amount)})? This will create a new Order and forward it to the Order Manager.`,
            confirmButtonText: 'Accept Quotation',
            cancelButtonText: 'Cancel',
            icon: 'question',
        });
        if (!confirmed) return;

        router.post(
            route('quotations.accept', { id: quotation.quotation_id }),
            {},
            { preserveScroll: true },
        );
    }

    async function handleRejectPayment(quotation: Quotation) {
        const confirmed = await confirmModal({
            title: `Reject Payment #${quotation.quotation_id}?`,
            text: `Reject the payment submitted for quotation #${quotation.quotation_id}? The client will be asked to resubmit proof of payment.`,
            confirmButtonText: 'Reject Payment',
            cancelButtonText: 'Cancel',
            isDestructive: true,
            icon: 'warning',
        });
        if (!confirmed) return;

        router.post(
            route('quotations.reject-payment', { id: quotation.quotation_id }),
            {},
            { preserveScroll: true },
        );
    }

    async function handleVerifyBalance(orderId: number) {
        const confirmed = await confirmModal({
            title: `Verify balance for Order #${orderId}?`,
            text: 'This clears the order for pickup or dispatch.',
            confirmButtonText: 'Verify balance',
            cancelButtonText: 'Cancel',
            icon: 'question',
        });
        if (confirmed) {
            router.post(route('orders.verify-balance-payment', { id: orderId }), {}, { preserveScroll: true });
        }
    }

    const sent = quotations.filter((q) => q.status === 'sent' && !q.payment_submitted_at).length;
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

            <div className="bmanny-page">
                {/* Header Banner */}
                <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="border-l-4 border-amber-400 pl-3.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sales Workspace</p>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">QUOTATIONS</h1>
                        <p className="text-xs text-muted-foreground sm:text-sm">
                            Review sent quotations. Once a client submits payment, confirm it here to create the Order.
                        </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Button
                            className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                            asChild
                        >
                            <Link href={route('quotations.create')}>
                                <Plus className="mr-1.5 h-4 w-4" />
                                New Quotation
                            </Link>
                        </Button>
                    </div>
                </header>

                {/* Flash / error messages */}
                {(flash?.success || flash?.error || errors?.status) && (
                    <div className="mb-4 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground">
                        {flash?.success ?? flash?.error ?? errors?.status}
                    </div>
                )}

                {/* Metric Summary Cards */}
                <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[
                        {
                            label: 'Total',
                            value: quotations.length,
                            description: 'All quotations',
                            icon: FileText,
                        },
                        {
                            label: 'Awaiting Payment',
                            value: sent,
                            description: 'Waiting for client action',
                            icon: Clock,
                        },
                        {
                            label: 'Payment Submitted',
                            value: awaitingConfirmation,
                            description: 'Ready for review',
                            icon: Send,
                        },
                        {
                            label: 'Accepted',
                            value: accepted,
                            description: 'Forwarded to orders',
                            icon: CheckCircle2,
                        },
                    ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-border/70 bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                                <item.icon className="h-5 w-5 text-muted-foreground/70" />
                            </div>
                            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{item.value}</p>
                            <p className="mt-4 text-xs text-muted-foreground">{item.description}</p>
                        </div>
                    ))}
                </div>

                {/* Filter & Search Bar */}
                <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border/70 bg-card px-5 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-foreground">
                        {filteredQuotations.length}/{quotations.length} Quotations
                    </p>
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search business, contact, quote #…"
                                className="h-9 w-full rounded-lg border border-input/80 bg-muted/20 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-80"
                            />
                        </div>
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                className="h-9 w-full appearance-none rounded-lg border border-input/80 bg-muted/20 px-3 pr-8 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-auto"
                            >
                                {STATUS_FILTERS.map((s) => (
                                    <option key={s} value={s}>
                                        {STATUS_FILTER_LABELS[s]}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>
                </div>

                {/* Quotations Table */}
                {filteredQuotations.length === 0 ? (
                    <div className="rounded-xl border border-border/70 bg-card py-16 text-center text-muted-foreground shadow-sm">
                        <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
                        <h2 className="text-base font-semibold text-foreground">No quotations found</h2>
                        <p className="mt-1 text-sm">
                            {quotations.length === 0 ? 'No quotations yet.' : 'No quotations match your search or filter.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-y-2.5 text-left text-sm">
                            <thead>
                                <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                                    <th className="px-5 py-3 font-semibold">Quote #</th>
                                    <th className="px-5 py-3 font-semibold">Client</th>
                                    <th className="px-5 py-3 font-semibold">Inquiry</th>
                                    <th className="px-5 py-3 font-semibold">Total Amount</th>
                                    <th className="px-5 py-3 font-semibold">Status</th>
                                    <th className="px-5 py-3 font-semibold">Payment</th>
                                    <th className="px-5 py-3 font-semibold">Sent Date</th>
                                    <th className="px-5 py-3 font-semibold">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredQuotations.map((quotation) => {
                                    const paymentSubmitted = quotation.status === 'sent' && !!quotation.payment_submitted_at;

                                    return (
                                        <tr
                                            key={quotation.quotation_id}
                                            className="group rounded-xl border border-border/70 bg-card shadow-xs transition-shadow hover:shadow-md"
                                        >
                                            {/* Quote # */}
                                            <td className="rounded-l-xl border-y border-l border-border/70 p-5 align-middle">
                                                <span className="font-mono text-sm font-bold text-foreground rounded-md bg-muted/60 px-2.5 py-1">
                                                    #{quotation.quotation_id}
                                                </span>
                                            </td>

                                            {/* Client */}
                                            <td className="border-y border-border/70 p-5 align-middle">
                                                <p className="text-base font-bold text-foreground">
                                                    {quotation.inquiry?.client?.business_name ?? '—'}
                                                </p>
                                                <p className="mt-0.5 text-sm text-muted-foreground">
                                                    {quotation.inquiry?.client?.user?.email || quotation.inquiry?.client?.contact_person || 'No contact'}
                                                </p>
                                            </td>

                                            {/* Inquiry */}
                                            <td className="border-y border-border/70 p-5 align-middle">
                                                {quotation.inquiry ? (
                                                    <span className="font-mono text-sm font-semibold text-muted-foreground">
                                                        #{quotation.inquiry.inquiry_id}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">—</span>
                                                )}
                                            </td>

                                            {/* Total Amount */}
                                            <td className="border-y border-border/70 p-5 align-middle">
                                                <p className="text-base font-bold font-mono text-foreground">
                                                    {formatCurrency(quotation.total_amount)}
                                                </p>
                                            </td>

                                            {/* Status */}
                                            <td className="border-y border-border/70 p-5 align-middle">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold sm:text-base capitalize ${STATUS_COLORS[quotation.status] ?? 'bg-muted text-muted-foreground'}`}
                                                >
                                                    {quotation.status}
                                                </span>
                                            </td>

                                            {/* Payment */}
                                            <td className="border-y border-border/70 p-5 align-middle">
                                                {paymentSubmitted ? (
                                                    <div className="space-y-1.5">
                                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-900 dark:bg-blue-500/20 dark:text-blue-300">
                                                            Submitted
                                                        </span>
                                                        <div className="text-xs font-medium text-muted-foreground">
                                                            {quotation.payment_method
                                                                ? PAYMENT_METHOD_LABELS[quotation.payment_method] ?? quotation.payment_method
                                                                : '—'}
                                                        </div>
                                                        {quotation.payment_proof_url && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setProofPreview({ url: quotation.payment_proof_url!, quotationId: quotation.quotation_id })}
                                                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-2 hover:underline"
                                                            >
                                                                <ImageIcon className="h-3.5 w-3.5" />
                                                                View proof
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-medium text-muted-foreground">
                                                        {quotation.status === 'sent' ? 'Awaiting payment' : '—'}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Sent Date */}
                                            <td className="border-y border-border/70 p-5 align-middle">
                                                <p className="text-sm font-medium text-foreground">
                                                    {formatDate(quotation.created_at)}
                                                </p>
                                            </td>

                                            {/* Action */}
                                            <td className="rounded-r-xl border-y border-r border-border/70 p-5 align-middle">
                                                {paymentSubmitted ? (
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            className="h-8 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
                                                            onClick={() => handleAccept(quotation)}
                                                        >
                                                            Accept &amp; Create Order
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 rounded-md border-border/80 px-3 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            onClick={() => handleRejectPayment(quotation)}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                ) : quotation.status === 'sent' ? (
                                                    <span className="text-sm text-muted-foreground font-medium">
                                                        Waiting for client
                                                    </span>
                                                ) : quotation.order?.status === 'ready_for_pickup' && quotation.order.balance_payment_submitted_at && !quotation.order.balance_payment_verified_at ? (
                                                    <div className="flex flex-col items-start gap-1.5">
                                                        {quotation.order.balance_payment_proof_url && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setProofPreview({ url: quotation.order!.balance_payment_proof_url!, quotationId: quotation.quotation_id })}
                                                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-2 hover:underline"
                                                            >
                                                                <ImageIcon className="h-3.5 w-3.5" />
                                                                View balance proof
                                                            </button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            className="h-8 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                                                            onClick={() => handleVerifyBalance(quotation.order!.order_id)}
                                                        >
                                                            Verify balance
                                                        </Button>
                                                    </div>
                                                ) : quotation.order ? (
                                                    <div className="flex flex-col items-start gap-1.5">
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="h-8 rounded-md bg-muted/60 px-3 text-xs font-semibold hover:bg-muted text-foreground"
                                                            onClick={() => setReceiptPreview({ url: route('orders.payment-receipt', { id: quotation.order!.order_id, milestone: 'initial' }), quotationId: quotation.quotation_id, milestone: 'Initial' })}
                                                        >
                                                            <FileText className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                                                            Initial payment receipt
                                                        </Button>
                                                        {quotation.order.balance_payment_verified_at && (
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                className="h-8 rounded-md bg-muted/60 px-3 text-xs font-semibold hover:bg-muted text-foreground"
                                                                onClick={() => setReceiptPreview({ url: route('orders.payment-receipt', { id: quotation.order!.order_id, milestone: 'balance' }), quotationId: quotation.quotation_id, milestone: 'Balance' })}
                                                            >
                                                                <FileText className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                                                                Balance payment receipt
                                                            </Button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-medium text-muted-foreground capitalize">
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

                {/* Proof preview dialog */}
                <Dialog open={proofPreview !== null} onOpenChange={(open) => !open && setProofPreview(null)}>
                    <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl border-border/70 p-0 shadow-2xl">
                        <DialogHeader className="border-b border-border/60 px-6 py-4 pr-12 text-left">
                            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">Payment proof</DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">Quotation #{proofPreview?.quotationId}</DialogDescription>
                        </DialogHeader>
                        {proofPreview && (
                            <div className="bg-muted/20 p-6 flex justify-center">
                                <img
                                    src={proofPreview.url}
                                    alt={`Payment proof for quotation #${proofPreview.quotationId}`}
                                    className="max-h-[68vh] w-full rounded-xl object-contain border border-border/60 shadow-sm"
                                />
                            </div>
                        )}
                        <div className="flex items-center justify-end border-t border-border/60 bg-muted/20 px-6 py-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 rounded-lg border-border/80 bg-background px-5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
                                onClick={() => setProofPreview(null)}
                            >
                                Close
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Receipt preview dialog */}
                <Dialog open={receiptPreview !== null} onOpenChange={(open) => !open && setReceiptPreview(null)}>
                    <DialogContent className="flex h-[90vh] max-w-3xl flex-col overflow-hidden rounded-2xl border-border/70 p-0 shadow-2xl">
                        <DialogHeader className="border-b border-border/60 px-6 py-4 pr-12 text-left">
                            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">{receiptPreview?.milestone} payment receipt</DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">Quotation #{receiptPreview?.quotationId}</DialogDescription>
                        </DialogHeader>
                        {receiptPreview && (
                            <div className="min-h-0 flex-1 p-4 bg-muted/20">
                                <iframe
                                    src={receiptPreview.url}
                                    title={`${receiptPreview.milestone} payment receipt for quotation #${receiptPreview.quotationId}`}
                                    className="h-full w-full rounded-xl border border-border/60 bg-white shadow-sm"
                                />
                            </div>
                        )}
                        <div className="flex items-center justify-end border-t border-border/60 bg-muted/20 px-6 py-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 rounded-lg border-border/80 bg-background px-5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
                                onClick={() => setReceiptPreview(null)}
                            >
                                Close
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
