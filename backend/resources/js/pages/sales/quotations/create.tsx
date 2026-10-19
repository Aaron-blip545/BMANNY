import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    ArrowLeft,
    Building2,
    CalendarIcon,
    ClipboardList,
    Eye,
    FileText,
    Mail,
    MapPin,
    Package,
    Sparkles,
    User,
} from 'lucide-react';
import { useState, useEffect } from 'react';

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
    product_request_review?: {
        status: string;
        suggested_packaging?: { name: string } | null;
        suggested_variant?: {
            name: string;
            sku?: string | null;
            current_moq?: { min_quantity: number } | null;
            product_type?: {
                name: string;
                net_weight?: string | null;
                packaging_specification?: string | null;
                label_specification?: string | null;
                formulation_notes?: string | null;
                suggested_srp?: number | null;
                lead_time_days?: number | null;
            } | null;
        } | null;
    } | null;
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

export interface StarterPackageSheetData {
    companyName: string;
    contactPerson: string;
    brand: string;
    productName: string;
    primary: string;
    printing: string;
    netWeight: string;
    ingredients: string;
    moq: string;
    priceUnit: string;
    priceTotal: string;
    date: string;
    isGcash: boolean;
}

export function parseCustomizationSheet(c?: Customization | null, inq?: PendingInquiry | null): StarterPackageSheetData {
    const rawNotes = c?.client_notes || '';

    function getVal(key: string, fallback: string = ''): string {
        const regex = new RegExp(`(?:^|\\|\\s*)${key}\\s*:\\s*([^|]+)`, 'i');
        const match = rawNotes.match(regex);
        return match ? match[1].trim() : fallback;
    }

    const companyName = getVal('Company Name', inq?.client?.business_name || 'BManny Client');
    const contactPerson = getVal('Contact Person', inq?.client?.contact_person || 'Client Representative');
    const brand = getVal('Brand', 'YOUR BRAND');

    let productName = getVal('Finished Product');
    if (!productName && inq?.product_request_review?.suggested_variant?.product_type?.name) {
        productName = inq.product_request_review.suggested_variant.product_type.name;
    }
    if (!productName) {
        productName = 'AshigoPlus Coffee Drink Mix';
    }
    const cleanedProductName = productName.replace(/\s*\([^)]*\)$/, '').trim();

    const primary = getVal('Packaging', c?.packaging_type || 'POUCH 12X20CM');
    const printing = getVal('Printing', c?.packaging_finish || 'STICKER LABEL');
    const netWeight = getVal('Net Weight', c?.serving_size?.split('x')[0]?.trim() || '120g');

    // Ingredients
    let ingredients = '';
    if (c?.formulation_notes) {
        const rmMatches = Array.from(c.formulation_notes.matchAll(/\d+\.\s*([^(:;]+)/g)).map((m) => m[1].trim());
        if (rmMatches.length > 0) {
            ingredients = `${cleanedProductName.toUpperCase()} with ${rmMatches.slice(0, 3).join(' & ')}`;
        }
    }
    if (!ingredients) {
        ingredients = `${cleanedProductName.toUpperCase()} with NATURAL EXTRACTS`;
    }

    const moqVal = getVal('Batch Quantity', c?.serving_size?.split('x')[1]?.replace(/units?/i, '')?.trim() || '100');
    const moqFormatted = `${moqVal.replace(/[^0-9]/g, '') || '100'} ${primary.toLowerCase().includes('pouch') ? 'pouch' : 'units'}`;

    let priceUnit = getVal('Price / Unit', '₱450.00');
    if (!priceUnit.startsWith('₱')) priceUnit = `₱${priceUnit}`;

    let priceTotal = getVal('Total Price', '');
    if (!priceTotal) {
        const numUnit = parseFloat(priceUnit.replace(/[^0-9.]/g, '')) || 0;
        const numQty = parseInt(moqVal.replace(/[^0-9]/g, ''), 10) || 100;
        priceTotal = `₱ ${(numUnit * numQty).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (!priceTotal.startsWith('₱')) {
        priceTotal = `₱ ${priceTotal}`;
    }

    const paymentMethod = getVal('Payment Method', '');
    const isGcash = paymentMethod.toLowerCase().includes('gcash');

    const formattedDate = inq?.created_at
        ? formatDate(inq.created_at)
        : new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

    return {
        companyName,
        contactPerson,
        brand,
        productName: cleanedProductName,
        primary,
        printing,
        netWeight,
        ingredients,
        moq: moqFormatted,
        priceUnit,
        priceTotal,
        date: formattedDate,
        isGcash,
    };
}

export function calculateInquiryTotal(inq?: PendingInquiry | null): string {
    if (!inq?.customizations?.length) return '';
    let total = 0;
    for (const c of inq.customizations) {
        const sheet = parseCustomizationSheet(c, inq);
        const rawTotalStr = sheet.priceTotal.replace(/[^0-9.]/g, '');
        const rawTotal = parseFloat(rawTotalStr);
        if (!isNaN(rawTotal) && rawTotal > 0) {
            total += rawTotal;
        } else {
            const unit = parseFloat(sheet.priceUnit.replace(/[^0-9.]/g, '')) || 0;
            const qty = parseInt(sheet.moq.replace(/[^0-9]/g, ''), 10) || 100;
            total += unit * qty;
        }
    }
    return total > 0 ? total.toFixed(2) : '';
}

export function buildAutoItemDetails(inq?: PendingInquiry | null): string {
    if (!inq) return '';
    const customizations = inq.customizations || [];
    if (customizations.length === 0) {
        return [
            'Item: Custom OEM/ODM Starter Package',
            '• Quantity: 100 units',
            '• Terms: 50% Downpayment before production, 50% balance before shipment',
            '• Accepted Payment Methods: GCash or Bank Transfer (BDO)',
            '• Order Lead Time: 10-15 business days upon proof of downpayment',
            '• Freight: FOB CDO | VAT: Exclusive',
        ].join('\n');
    }

    const items = customizations.map((c, index) => {
        const sheet = parseCustomizationSheet(c, inq);
        const header = customizations.length > 1
            ? `${index + 1}. ${sheet.productName} Starter Package`
            : `Item: ${sheet.productName} Starter Package`;

        const lines = [
            header,
            `  • Brand: ${sheet.brand || inq.client?.business_name || 'Client Brand'}`,
            `  • Packaging: ${sheet.primary} (${sheet.printing})`,
            `  • Net Weight: ${sheet.netWeight}`,
            `  • Batch Quantity / MOQ: ${sheet.moq}`,
            `  • Unit Price: ${sheet.priceUnit}`,
            `  • Total Amount: ${sheet.priceTotal}`,
        ];

        if (sheet.ingredients) {
            lines.push(`  • Formulation Recipe: ${sheet.ingredients}`);
        }

        return lines.join('\n');
    });

    const commercialTerms = [
        'Commercial Terms & Conditions:',
        '• 50% Downpayment before production, 50% balance before shipment',
        '• Accepted Payment Methods: GCash or Bank Transfer (BDO)',
        '• Order Lead Time: 10-15 business days upon proof of downpayment',
        '• Freight: FOB CDO | VAT: Exclusive',
    ].join('\n');

    return `${items.join('\n\n')}\n\n${commercialTerms}`;
}

export default function QuotationCreate({ pendingInquiries, selectedInquiryId }: Props) {
    const initialInq = pendingInquiries.find((i) => String(i.inquiry_id) === String(selectedInquiryId));
    const initialTotal = initialInq ? calculateInquiryTotal(initialInq) : '';
    const initialDetails = initialInq ? buildAutoItemDetails(initialInq) : '';

    const { data, setData, post, processing, errors } = useForm({
        inquiry_id:   selectedInquiryId ? String(selectedInquiryId) : '',
        total_amount: initialTotal,
        valid_until:  '',
        item_details: initialDetails,
    });

    const [validUntilOpen, setValidUntilOpen] = useState(false);
    const [viewCustomizationsOpen, setViewCustomizationsOpen] = useState(false);

    // Auto-populate item details and total when inquiry_id is selected/changed
    useEffect(() => {
        if (data.inquiry_id && !data.item_details) {
            const inq = pendingInquiries.find((i) => String(i.inquiry_id) === String(data.inquiry_id));
            if (inq) {
                const autoDetails = buildAutoItemDetails(inq);
                const autoTotal = calculateInquiryTotal(inq);
                setData((prev) => ({
                    ...prev,
                    total_amount: prev.total_amount || autoTotal,
                    item_details: prev.item_details || autoDetails,
                }));
            }
        }
    }, [data.inquiry_id, pendingInquiries]);

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
                        Select an inquiry, review or adjust the item details and price, and send the quote to the client.
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
                                            onChange={(e) => {
                                                const inqId = e.target.value;
                                                const inq = pendingInquiries.find((i) => String(i.inquiry_id) === inqId);
                                                if (inq) {
                                                    const autoTotal = calculateInquiryTotal(inq);
                                                    const autoDetails = buildAutoItemDetails(inq);
                                                    setData((prev) => ({
                                                        ...prev,
                                                        inquiry_id: inqId,
                                                        total_amount: autoTotal || prev.total_amount,
                                                        item_details: autoDetails,
                                                    }));
                                                } else {
                                                    setData((prev) => ({
                                                        ...prev,
                                                        inquiry_id: '',
                                                        total_amount: '',
                                                        item_details: '',
                                                    }));
                                                }
                                            }}
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
                                        <div className="mb-1 flex items-center justify-between">
                                            <label htmlFor="item_details" className="text-sm font-medium">
                                                Item Details / Notes
                                            </label>
                                            {selected && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 text-xs text-primary hover:text-primary/90"
                                                    onClick={() => {
                                                        const autoDetails = buildAutoItemDetails(selected);
                                                        const autoTotal = calculateInquiryTotal(selected);
                                                        setData((prev) => ({
                                                            ...prev,
                                                            total_amount: autoTotal || prev.total_amount,
                                                            item_details: autoDetails,
                                                        }));
                                                    }}
                                                    title="Re-populate item details from the selected inquiry"
                                                >
                                                    <Sparkles className="mr-1 h-3 w-3" />
                                                    Auto-fill from Inquiry
                                                </Button>
                                            )}
                                        </div>
                                        <p className="mb-2 text-xs text-muted-foreground">
                                            Automatically listed from the inquiry. You can freely edit or customize any item names, quantities, unit prices, or notes below.
                                        </p>
                                        <textarea
                                            id="item_details"
                                            rows={8}
                                            placeholder="List the items, unit prices, quantities, or any notes for the client…"
                                            value={data.item_details}
                                            onChange={(e) => setData('item_details', e.target.value)}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
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

                                                {selected.product_request_review?.suggested_variant?.product_type && (
                                                    <div className="space-y-2 border-t border-border/60 pt-3">
                                                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Approved Product Specification</p>
                                                        <div className="space-y-1 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs">
                                                            {(() => {
                                                                const variant = selected.product_request_review!.suggested_variant!;
                                                                const product = variant.product_type!;
                                                                return <>
                                                                    <p className="font-semibold text-foreground">{product.name}{variant.name ? ` — ${variant.name}` : ''}</p>
                                                                    {product.net_weight && <p><span className="font-medium">Net content:</span> {product.net_weight}</p>}
                                                                    {(selected.product_request_review?.suggested_packaging?.name || product.packaging_specification) && <p><span className="font-medium">Packaging:</span> {selected.product_request_review?.suggested_packaging?.name ?? product.packaging_specification}</p>}
                                                                    {product.label_specification && <p><span className="font-medium">Label:</span> {product.label_specification}</p>}
                                                                    {product.formulation_notes && <p><span className="font-medium">Ingredients:</span> {product.formulation_notes}</p>}
                                                                    {variant.current_moq?.min_quantity && <p><span className="font-medium">MOQ:</span> {variant.current_moq.min_quantity}</p>}
                                                                    <p><span className="font-medium">Reference price:</span> ₱{Number(product.suggested_srp ?? 0).toFixed(2)} · <span className="font-medium">Lead time:</span> {product.lead_time_days ?? 'Not set'} days</p>
                                                                </>;
                                                            })()}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">This approved specification will be saved with the quotation when it is sent.</p>
                                                    </div>
                                                )}

                                                <div className="space-y-3 border-t border-border/60 pt-3">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                            Requested Customizations
                                                        </p>
                                                    </div>
                                                    {(selected.customizations ?? []).length === 0 ? (
                                                        <p className="text-xs text-muted-foreground">No customization details provided.</p>
                                                    ) : (
                                                        (selected.customizations ?? []).map((c, idx) => {
                                                            const sheet = parseCustomizationSheet(c, selected);
                                                            return (
                                                                <div
                                                                    key={c.customization_id || idx}
                                                                    className="space-y-2 rounded-lg border border-border/70 bg-card p-3 shadow-2xs"
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="font-semibold text-foreground text-sm">
                                                                            {sheet.productName}
                                                                        </span>
                                                                        <span className="text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-900">
                                                                            {sheet.priceUnit}
                                                                        </span>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                                                                        <p><span className="font-medium text-foreground">Package:</span> {sheet.primary}</p>
                                                                        <p><span className="font-medium text-foreground">Finish:</span> {sheet.printing}</p>
                                                                        <p><span className="font-medium text-foreground">Net Wt:</span> {sheet.netWeight}</p>
                                                                        <p><span className="font-medium text-foreground">MOQ:</span> {sheet.moq}</p>
                                                                    </div>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="w-full h-7 text-xs font-medium gap-1.5 text-primary border-primary/30 hover:bg-primary hover:text-white transition-all cursor-pointer"
                                                                        onClick={() => setViewCustomizationsOpen(true)}
                                                                    >
                                                                        <FileText className="h-3.5 w-3.5" />
                                                                        View Starter Package Sheet
                                                                    </Button>
                                                                </div>
                                                            );
                                                        })
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

            {/* ── Requested Customizations / Starter Package Specification Sheet Modal ── */}
            <Dialog open={viewCustomizationsOpen} onOpenChange={setViewCustomizationsOpen}>
                <DialogContent className="max-w-4xl border-border bg-card text-card-foreground shadow-2xl p-6">
                    <DialogHeader className="space-y-1 border-b border-border/70 pb-4 text-left">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                                <Package className="h-5 w-5" />
                            </span>
                            <div>
                                <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                                    Requested Customization Details
                                    <span className="rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">
                                        Starter Package Sheet
                                    </span>
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    Inquiry #{selected?.inquiry_id} &bull; {selected?.client?.business_name ?? 'Client'}
                                    {selected?.created_at ? ` &bull; Submitted ${formatDate(selected.created_at)}` : ''}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="max-h-[75vh] overflow-y-auto py-2 pr-1">
                        {(selected?.customizations ?? []).length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                <Package className="mx-auto h-8 w-8 opacity-40 mb-2" />
                                <p className="text-sm">No customization specs found for this inquiry.</p>
                            </div>
                        ) : (
                            (selected?.customizations ?? []).map((c, idx) => {
                                const sheet = parseCustomizationSheet(c, selected);
                                return (
                                    <div key={c.customization_id || idx} className="space-y-4 mb-6">
                                        <div className="overflow-x-auto rounded-lg border-2 border-slate-700 bg-white shadow-md text-slate-900">
                                            {/* Row 1: Pink Header COMPANY INFO */}
                                            <div className="bg-[#fce8ee] border-b border-slate-700 py-1.5 px-4 text-center">
                                                <span className="text-xs font-black tracking-wider text-slate-900 uppercase">
                                                    COMPANY INFO
                                                </span>
                                            </div>

                                            {/* Row 2: Company Info 2-Column Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-700 divide-y md:divide-y-0 md:divide-x divide-slate-700 text-xs">
                                                <div className="p-2.5 space-y-1">
                                                    <div className="flex items-center">
                                                        <span className="w-28 font-bold text-slate-800 shrink-0">Company Name:</span>
                                                        <span className="font-semibold text-slate-900">{sheet.companyName}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="w-28 font-bold text-slate-800 shrink-0">Contact Person:</span>
                                                        <span className="font-semibold text-slate-900">{sheet.contactPerson}</span>
                                                    </div>
                                                </div>
                                                <div className="p-2.5 space-y-1">
                                                    <div className="flex items-center">
                                                        <span className="w-32 font-bold text-slate-800 shrink-0">Date:</span>
                                                        <span className="font-medium text-slate-900">{sheet.date}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="w-32 font-bold text-slate-800 shrink-0">Customer Support:</span>
                                                        <span className="font-medium text-slate-900">BManny Partners Inc.</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Row 3: Yellow Banner [PRODUCT] STARTER PACKAGE */}
                                            <div className="bg-[#fef08a] border-b border-slate-700 py-2 px-4 text-center">
                                                <span className="text-xs sm:text-sm font-black tracking-wider text-slate-900 uppercase">
                                                    {sheet.productName} STARTER PACKAGE
                                                </span>
                                            </div>

                                            {/* Row 4 & 5: Main Specification Table */}
                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse text-xs">
                                                    <thead>
                                                        <tr className="border-b border-slate-700 bg-slate-50 text-slate-900 font-black">
                                                            <th className="border-r border-slate-700 p-2.5 text-left w-5/12 uppercase tracking-wide">
                                                                PACKAGING DETAILS
                                                            </th>
                                                            <th className="border-r border-slate-700 p-2.5 text-center w-2/12 uppercase tracking-wide">
                                                                MOQ
                                                            </th>
                                                            <th className="border-r border-slate-700 p-2.5 text-center w-2/12 uppercase tracking-wide">
                                                                PRICE/UNIT
                                                            </th>
                                                            <th className="p-2.5 text-center w-3/12 uppercase tracking-wide">
                                                                PRICE / TOTAL
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr className="border-b border-slate-700 align-top">
                                                            <td className="border-r border-slate-700 p-3 space-y-2 leading-tight">
                                                                <div>
                                                                    <span className="font-bold text-slate-800 block text-[11px]">PRODUCT NAME:</span>
                                                                    <span className="font-black text-red-600 uppercase text-xs">{sheet.productName}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="font-bold text-slate-800 block text-[11px]">PRIMARY:</span>
                                                                    <span className="font-black text-red-600 uppercase text-xs">{sheet.primary}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="font-bold text-slate-800 block text-[11px]">PRINTING:</span>
                                                                    <span className="font-black text-red-600 uppercase text-xs">{sheet.printing}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="font-bold text-slate-800 block text-[11px]">NET WT.:</span>
                                                                    <span className="font-black text-red-600 uppercase text-xs">{sheet.netWeight}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="font-bold text-slate-800 block text-[11px]">INGREDIENTS:</span>
                                                                    <span className="font-bold text-red-600 italic text-[11px] leading-snug block">
                                                                        {sheet.ingredients}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="border-r border-slate-700 p-3 text-center align-middle">
                                                                <span className="font-black text-red-600 text-sm block">
                                                                    {sheet.moq}
                                                                </span>
                                                            </td>
                                                            <td className="border-r border-slate-700 p-3 text-center align-middle">
                                                                <span className="font-black text-red-600 text-sm block">
                                                                    {sheet.priceUnit}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-center align-middle">
                                                                <span className="font-black text-red-600 text-sm block">
                                                                    {sheet.priceTotal || sheet.priceUnit}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Row 6: Payment Terms Details */}
                                            <div className="border-b border-slate-700 p-2.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                                                <div className="font-bold text-slate-800 shrink-0 w-32 uppercase text-[11px]">
                                                    PAYMENT TERMS
                                                </div>
                                                <div className="flex-1 space-y-0.5">
                                                    <p className="font-semibold text-slate-900">a) 50% DP before production</p>
                                                    <p className="font-semibold text-slate-900">b) 50% balance before shipment</p>
                                                </div>
                                                <div className="shrink-0 text-slate-900 font-semibold">
                                                    c) Order Lead Time 10-15 days
                                                </div>
                                            </div>

                                            {/* Row 7: Pink Header PAYMENT TERMS */}
                                            <div className="bg-[#fce8ee] border-b border-slate-700 py-1.5 px-4 text-center">
                                                <span className="text-xs font-black tracking-wider text-slate-900 uppercase">
                                                    PAYMENT TERMS
                                                </span>
                                            </div>

                                            {/* Row 8: FOB & VAT */}
                                            <div className="border-b border-slate-700 p-2.5 bg-white flex items-center gap-8 text-xs font-bold">
                                                <div>
                                                    <span className="text-slate-800 mr-2">FOB:</span>
                                                    <span className="text-red-600 font-black">CDO</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-800 mr-2">VAT:</span>
                                                    <span className="text-red-600 font-black">VAT EXCLUSIVE</span>
                                                </div>
                                            </div>

                                            {/* Row 9: Pink Header Account Details */}
                                            <div className="bg-[#fce8ee] border-b border-slate-700 py-1.5 px-4 text-center">
                                                <span className="text-xs font-black tracking-wider text-slate-900 uppercase">
                                                    {sheet.isGcash ? 'COMPANY GCASH ACCOUNT DETAILS' : 'COMPANY BANK ACCOUNT DETAILS'}
                                                </span>
                                            </div>

                                            {/* Row 10: Account Details */}
                                            <div className="p-3 bg-white text-center space-y-0.5">
                                                <p className="font-black text-red-600 text-xs sm:text-sm">
                                                    {sheet.isGcash ? 'GCash Account #: 0917 500 2815' : 'BDO UNIBANK Savings Acnt #: 010050028154'}
                                                </p>
                                                <p className="font-bold italic text-red-600 text-xs">
                                                    Account Name: BManny Partners Inc.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <DialogFooter className="border-t border-border/70 pt-3 flex items-center justify-between sm:justify-between">
                        {selected?.customizations?.[0] && (
                            <Button
                                type="button"
                                variant="default"
                                size="sm"
                                onClick={() => {
                                    const autoTotal = calculateInquiryTotal(selected);
                                    const autoDetails = buildAutoItemDetails(selected);
                                    if (autoTotal) setData('total_amount', autoTotal);
                                    if (autoDetails) setData('item_details', autoDetails);
                                    setViewCustomizationsOpen(false);
                                }}
                            >
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Apply to Quotation
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setViewCustomizationsOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
