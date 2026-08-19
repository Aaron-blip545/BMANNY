import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { FileText } from 'lucide-react';

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
}

interface Props {
    quotations: Quotation[];
}

const STATUS_COLORS: Record<string, string> = {
    sent:     'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    accepted: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    rejected: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
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

    const sent     = quotations.filter((q) => q.status === 'sent').length;
    const accepted = quotations.filter((q) => q.status === 'accepted').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Quotations" />

            <div className="p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Quotations</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Review sent quotations and convert accepted ones into orders.
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
                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {[
                        { label: 'Total',    value: quotations.length, color: 'text-foreground' },
                        { label: 'Sent',     value: sent,              color: 'text-amber-600 dark:text-amber-400' },
                        { label: 'Accepted', value: accepted,          color: 'text-green-600 dark:text-green-400' },
                    ].map((s) => (
                        <Card key={s.label} className="border-border/60">
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground">{s.label}</p>
                                <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Table */}
                <Card className="border-border/60 shadow-sm">
                    <CardContent className="p-0">
                        {quotations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                                <FileText className="h-10 w-10 opacity-40" />
                                <p className="text-sm">No quotations yet.</p>
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
                                            <th className="p-4 font-medium">Valid Until</th>
                                            <th className="p-4 font-medium">Status</th>
                                            <th className="p-4 font-medium">Sent Date</th>
                                            <th className="p-4 font-medium">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {quotations.map((quotation) => (
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
                                                <td className="p-4 text-muted-foreground text-xs">
                                                    {quotation.valid_until ? formatDate(quotation.valid_until) : '—'}
                                                </td>
                                                <td className="p-4">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[quotation.status] ?? ''}`}
                                                    >
                                                        {quotation.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-muted-foreground text-xs">
                                                    {formatDate(quotation.created_at)}
                                                </td>
                                                <td className="p-4">
                                                    {quotation.status === 'sent' ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleAccept(quotation)}
                                                        >
                                                            Accept &amp; Create Order
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground capitalize">
                                                            {quotation.status}
                                                        </span>
                                                    )}
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
