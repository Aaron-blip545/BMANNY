import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inquiries', href: '/inquiries' },
    { title: 'New Quotation', href: '/quotations/create' },
];

interface PendingInquiry {
    inquiry_id: number;
    status: string;
    created_at: string;
    client: { business_name: string; contact_person: string } | null;
    customizations: { packaging_type: string }[];
}

interface Props {
    pendingInquiries: PendingInquiry[];
    selectedInquiryId: number | null;
}

export default function QuotationCreate({ pendingInquiries, selectedInquiryId }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        inquiry_id:   selectedInquiryId ? String(selectedInquiryId) : '',
        total_amount: '',
        valid_until:  '',
        item_details: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(route('quotations.store'));
    }

    // Find the currently selected inquiry so we can display a summary card
    const selected = pendingInquiries.find((i) => String(i.inquiry_id) === data.inquiry_id);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Quotation" />

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('inquiries.index')}>
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back to Inquiries
                        </Link>
                    </Button>
                </div>

                <div className="mx-auto max-w-2xl">
                    <h1 className="mb-1 text-2xl font-semibold tracking-tight">New Quotation</h1>
                    <p className="mb-6 text-sm text-muted-foreground">
                        Select an inquiry, enter the price, and send the quote to the client.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Inquiry selector */}
                        <Card className="border-border/60">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Select Inquiry</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {pendingInquiries.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No pending inquiries awaiting a quotation.
                                    </p>
                                ) : (
                                    <select
                                        id="inquiry_id"
                                        value={data.inquiry_id}
                                        onChange={(e) => setData('inquiry_id', e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="">— Choose an inquiry —</option>
                                        {pendingInquiries.map((inq) => (
                                            <option key={inq.inquiry_id} value={String(inq.inquiry_id)}>
                                                #{inq.inquiry_id} — {inq.client?.business_name ?? 'Unknown'} (
                                                {inq.customizations.map((c) => c.packaging_type).join(', ')})
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {errors.inquiry_id && (
                                    <p className="text-xs text-destructive">{errors.inquiry_id}</p>
                                )}

                                {/* Summary of selected inquiry */}
                                {selected && (
                                    <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/30">
                                        <p className="font-medium text-blue-900 dark:text-blue-200">
                                            {selected.client?.business_name}
                                        </p>
                                        <p className="text-blue-700 dark:text-blue-400">
                                            Contact: {selected.client?.contact_person}
                                        </p>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {selected.customizations.map((c, idx) => (
                                                <span
                                                    key={idx}
                                                    className="rounded bg-blue-100 px-2 py-0.5 text-xs dark:bg-blue-900/50"
                                                >
                                                    {c.packaging_type}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Pricing */}
                        <Card className="border-border/60">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Pricing & Validity</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label htmlFor="total_amount" className="mb-1 block text-sm font-medium">
                                        Total Amount (₱) <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        id="total_amount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={data.total_amount}
                                        onChange={(e) => setData('total_amount', e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                    {errors.total_amount && (
                                        <p className="mt-1 text-xs text-destructive">{errors.total_amount}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="valid_until" className="mb-1 block text-sm font-medium">
                                        Valid Until
                                    </label>
                                    <input
                                        id="valid_until"
                                        type="date"
                                        value={data.valid_until}
                                        onChange={(e) => setData('valid_until', e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                    {errors.valid_until && (
                                        <p className="mt-1 text-xs text-destructive">{errors.valid_until}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="item_details" className="mb-1 block text-sm font-medium">
                                        Item Details / Notes
                                    </label>
                                    <textarea
                                        id="item_details"
                                        rows={4}
                                        placeholder="List the items, unit prices, quantities, or any notes for the client…"
                                        value={data.item_details}
                                        onChange={(e) => setData('item_details', e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                    {errors.item_details && (
                                        <p className="mt-1 text-xs text-destructive">{errors.item_details}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3">
                            <Button variant="outline" type="button" asChild>
                                <Link href={route('inquiries.index')}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={processing || !data.inquiry_id || !data.total_amount}>
                                {processing ? 'Sending…' : 'Send Quotation'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
