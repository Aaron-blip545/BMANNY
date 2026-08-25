import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, Building2, CalendarIcon, ClipboardList, Mail, MapPin, User } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inquiries', href: '/inquiries' },
    { title: 'New Quotation', href: '/quotations/create' },
];

interface Customization {
    customization_id: number;
    customization_type: string | null;
    packaging_type: string | null;
    packaging_finish: string | null;
    serving_size: string | null;
    formulation_notes: string | null;
    client_notes: string | null;
}

interface PendingInquiry {
    inquiry_id: number;
    status: string;
    created_at: string;
    client: {
        business_name: string;
        contact_person: string;
        business_type?: string | null;
        business_address?: string | null;
        user?: { email: string } | null;
    } | null;
    customizations: Customization[];
}

interface Props {
    pendingInquiries: PendingInquiry[];
    selectedInquiryId: number | null;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function QuotationCreate({ pendingInquiries, selectedInquiryId }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        inquiry_id:   selectedInquiryId ? String(selectedInquiryId) : '',
        total_amount: '',
        valid_until:  '',
        item_details: '',
    });

    const [validUntilOpen, setValidUntilOpen] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(route('quotations.store'));
    }

    // Find the currently selected inquiry so we can display its details
    const selected = pendingInquiries.find((i) => String(i.inquiry_id) === data.inquiry_id);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Quotation" />

            <main className="bmanny-page">
                <div className="mb-6 flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('inquiries.index')}>
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back to Inquiries
                        </Link>
                    </Button>
                </div>

                <div className="mx-auto max-w-5xl">
                    <p className="bmanny-page-eyebrow">Sales Workspace</p>
                    <h1 className="mb-1 text-2xl font-semibold tracking-tight">New Quotation</h1>
                    <p className="mb-6 text-sm text-muted-foreground">
                        Select an inquiry, enter the price, and send the quote to the client.
                    </p>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Form column */}
                        <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-2">
                            {/* Inquiry selector */}
                            <Card className="bmanny-form-card">
                                <CardHeader className="border-b border-border pb-3">
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
                                                    {(inq.customizations ?? []).map((c) => c.packaging_type).join(', ')})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {errors.inquiry_id && (
                                        <p className="text-xs text-destructive">{errors.inquiry_id}</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Pricing */}
                            <Card className="bmanny-form-card">
                                <CardHeader className="border-b border-border pb-3">
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
                                        <Popover open={validUntilOpen} onOpenChange={setValidUntilOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    id="valid_until"
                                                    type="button"
                                                    variant="outline"
                                                    className={cn(
                                                        'w-full justify-start bg-background px-3 py-2 text-left font-normal',
                                                        !data.valid_until && 'text-muted-foreground',
                                                    )}
                                                >
                                                    <CalendarIcon className="h-4 w-4" />
                                                    {data.valid_until ? format(new Date(data.valid_until + 'T00:00:00'), 'PPP') : 'Pick a date'}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={data.valid_until ? new Date(data.valid_until + 'T00:00:00') : undefined}
                                                    onSelect={(date) => {
                                                        setData('valid_until', date ? format(date, 'yyyy-MM-dd') : '');
                                                        setValidUntilOpen(false);
                                                    }}
                                                    disabled={{ before: new Date() }}
                                                    autoFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
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

                        {/* Inquiry details sidebar */}
                        <div className="lg:col-span-1">
                            <div className="lg:sticky lg:top-6">
                                <Card className="bmanny-workspace overflow-hidden">
                                    <CardHeader className="border-b border-border pb-3">
                                        <CardTitle className="text-base">Inquiry Details</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {!selected ? (
                                            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
                                                <ClipboardList className="h-8 w-8 opacity-40" />
                                                <p className="text-sm">Select an inquiry to see its details here.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 text-sm">
                                                <div>
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        #{selected.inquiry_id}
                                                    </span>
                                                    <p className="text-xs text-muted-foreground">
                                                        Submitted {formatDate(selected.created_at)}
                                                    </p>
                                                </div>

                                                <div className="space-y-2 border-t border-border/60 pt-3">
                                                    <div className="flex items-start gap-2">
                                                        <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-medium">{selected.client?.business_name ?? '—'}</p>
                                                            {selected.client?.business_type && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    {selected.client.business_type}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-2">
                                                        <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                                        <p>{selected.client?.contact_person ?? '—'}</p>
                                                    </div>

                                                    {selected.client?.user?.email && (
                                                        <div className="flex items-start gap-2">
                                                            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                                            <p className="break-all">{selected.client.user.email}</p>
                                                        </div>
                                                    )}

                                                    {selected.client?.business_address && (
                                                        <div className="flex items-start gap-2">
                                                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                                            <p className="text-muted-foreground">
                                                                {selected.client.business_address}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-3 border-t border-border/60 pt-3">
                                                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                        Requested Customizations
                                                    </p>
                                                    {(selected.customizations ?? []).length === 0 ? (
                                                        <p className="text-xs text-muted-foreground">No customization details provided.</p>
                                                    ) : (
                                                        (selected.customizations ?? []).map((c) => (
                                                            <div
                                                                key={c.customization_id}
                                                                className="space-y-1 rounded-md border border-border/60 bg-muted/40 p-3"
                                                            >
                                                                {c.packaging_type && (
                                                                    <p className="font-medium">{c.packaging_type}</p>
                                                                )}
                                                                <dl className="space-y-1 text-xs text-muted-foreground">
                                                                    {c.packaging_finish && (
                                                                        <div className="flex gap-1">
                                                                            <dt className="shrink-0 font-medium">Finish:</dt>
                                                                            <dd>{c.packaging_finish}</dd>
                                                                        </div>
                                                                    )}
                                                                    {c.serving_size && (
                                                                        <div className="flex gap-1">
                                                                            <dt className="shrink-0 font-medium">Serving Size:</dt>
                                                                            <dd>{c.serving_size}</dd>
                                                                        </div>
                                                                    )}
                                                                    {c.formulation_notes && (
                                                                        <div className="flex gap-1">
                                                                            <dt className="shrink-0 font-medium">Formulation:</dt>
                                                                            <dd>{c.formulation_notes}</dd>
                                                                        </div>
                                                                    )}
                                                                    {c.client_notes && (
                                                                        <div className="flex gap-1">
                                                                            <dt className="shrink-0 font-medium">Client Notes:</dt>
                                                                            <dd>{c.client_notes}</dd>
                                                                        </div>
                                                                    )}
                                                                </dl>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}
