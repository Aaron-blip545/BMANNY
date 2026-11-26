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
    Check,
    ChevronDown,
    ClipboardList,
    Eye,
    FileText,
    Mail,
    MapPin,
    Package,
    Sparkles,
    User,
    X,
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
    selected_package?: string | null;
    requested_ingredient_note?: string | null;
    design_file_path?: string | null;
    client_notes: string | null;
}

interface PackagingBalanceSummary {
    balance_id: number;
    brand_name: string;
    package_slug: string;
    total_pouches: number;
    used_pouches: number;
    remaining_pouches: number;
    production_unit_cost: string | number;
    packaging_unit_cost: string | number;
    batch_min_quantity: number;
    cylinder_paid: boolean;
    expires_at: string | null;
    status: string;
}

interface PendingInquiry {
    inquiry_id: number;
    status: string;
    inquiry_type?: 'new' | 'reorder_batch' | 'packaging_replenishment' | string;
    reorder_batch_quantity?: number | null;
    source_order_id?: number | null;
    packaging_balance?: PackagingBalanceSummary | null;
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
    packageCatalog: PackageCatalogItem[];
}

interface PackageCatalogItem {
    slug: string;
    name: string;
    minimum_quantity: number;
    packaging_details: string;
    label_details: string;
    net_weight: string;
    lead_time_text: string;
    initial_price: string | number;
    before_production_amount?: string | number | null;
    before_production_label?: string | null;
    before_pickup_amount?: string | number | null;
    before_pickup_label?: string | null;
    payment_terms: string;
    cost_breakdown?: Array<{ label: string; amount: number; quantity: string }> | null;
    package_notes?: string | null;
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

export function parseCustomizationSheet(c?: Customization | null, inq?: PendingInquiry | null, packageItem?: PackageCatalogItem | null): StarterPackageSheetData {
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
        primary: packageItem?.packaging_details ?? primary,
        printing: packageItem?.label_details ?? printing,
        netWeight: packageItem?.net_weight ?? netWeight,
        ingredients,
        moq: packageItem ? `${Number(packageItem.minimum_quantity).toLocaleString()} pouch` : moqFormatted,
        priceUnit: packageItem ? 'Package price' : priceUnit,
        priceTotal: packageItem ? `₱ ${Number(packageItem.initial_price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : priceTotal,
        date: formattedDate,
        isGcash,
    };
}

function selectedPackage(inq?: PendingInquiry | null, catalog: PackageCatalogItem[] = []): PackageCatalogItem | null {
    const slug = inq?.customizations?.[0]?.selected_package;
    return slug ? catalog.find((item) => item.slug === slug) ?? null : null;
}

export function calculateInquiryTotal(inq?: PendingInquiry | null, catalog: PackageCatalogItem[] = []): string {
    if (inq?.inquiry_type === 'reorder_batch' && inq.packaging_balance) {
        const qty = Number(inq.reorder_batch_quantity) || Number(inq.packaging_balance.batch_min_quantity) || 150;
        const unitCost = Number(inq.packaging_balance.production_unit_cost) || 55;
        return (qty * unitCost).toFixed(2);
    }
    if (inq?.inquiry_type === 'packaging_replenishment' && inq.packaging_balance) {
        const qty = Number(inq.reorder_batch_quantity) || Number(inq.packaging_balance.batch_min_quantity) || 150;
        const prodCost = qty * (Number(inq.packaging_balance.production_unit_cost) || 55);
        const packCost = Number(inq.packaging_balance.total_pouches) * (Number(inq.packaging_balance.packaging_unit_cost) || 10);
        return (packCost + prodCost).toFixed(2);
    }
    const packageItem = selectedPackage(inq, catalog);
    if (packageItem) return Number(packageItem.initial_price).toFixed(2);
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

function calculateInquiryMilestones(inq?: PendingInquiry | null, catalog: PackageCatalogItem[] = [], totalOverride?: string) {
    const totalNum = Number(totalOverride ?? calculateInquiryTotal(inq, catalog)) || 0;

    if (inq?.inquiry_type === 'reorder_batch') {
        const qty = Number(inq.reorder_batch_quantity) || Number(inq.packaging_balance?.batch_min_quantity) || 0;
        return {
            initial: totalNum > 0 ? totalNum.toFixed(2) : '',
            balance: totalNum > 0 ? '0.00' : '',
            initialLabel: qty ? `Before production (Batch: ${qty.toLocaleString()} pouches)` : 'Before production (100% batch cost)',
            balanceLabel: 'Before pickup (₱0 — Paid upfront)',
        };
    }

    if (inq?.inquiry_type === 'packaging_replenishment' && inq.packaging_balance) {
        const packCost = Number(inq.packaging_balance.total_pouches) * (Number(inq.packaging_balance.packaging_unit_cost) || 10);
        const initial = Math.min(packCost, totalNum);
        const balance = Math.max(0, totalNum - initial);
        const qty = Number(inq.reorder_batch_quantity) || Number(inq.packaging_balance.batch_min_quantity) || 0;
        return {
            initial: totalNum > 0 ? initial.toFixed(2) : '',
            balance: totalNum > 0 ? balance.toFixed(2) : '',
            initialLabel: 'Before production (Packaging Refill · ₱0 Cylinder)',
            balanceLabel: qty ? `Before pickup (Production: ${qty.toLocaleString()} pouches)` : 'Before pickup (Production)',
        };
    }

    const packageItem = selectedPackage(inq, catalog);

    if (packageItem && packageItem.before_production_amount != null) {
        const defaultBeforeProd = Number(packageItem.before_production_amount);
        const initial = Math.min(defaultBeforeProd, totalNum);
        const balance = Math.max(0, totalNum - initial);
        return {
            initial: totalNum > 0 ? initial.toFixed(2) : '',
            balance: totalNum > 0 ? balance.toFixed(2) : '',
            initialLabel: packageItem.before_production_label || 'Before production',
            balanceLabel: packageItem.before_pickup_label || 'Before pickup',
        };
    }

    const half = totalNum / 2;
    return {
        initial: totalNum > 0 ? half.toFixed(2) : '',
        balance: totalNum > 0 ? (totalNum - Number(half.toFixed(2))).toFixed(2) : '',
        initialLabel: 'Before production (50%)',
        balanceLabel: 'Before pickup (50%)',
    };
}

export function buildAutoItemDetails(inq?: PendingInquiry | null, catalog: PackageCatalogItem[] = []): string {
    if (!inq) return '';
    if (inq.inquiry_type === 'reorder_batch' && inq.packaging_balance) {
        const bal = inq.packaging_balance;
        const qty = Number(inq.reorder_batch_quantity) || Number(bal.batch_min_quantity);
        const unitCost = Number(bal.production_unit_cost);
        const total = qty * unitCost;
        const pkgTitle = `${bal.package_slug.charAt(0).toUpperCase()}${bal.package_slug.slice(1)} Package`;
        return [
            `Item: ${pkgTitle} — Repeat Batch Reorder (${bal.brand_name})`,
            `• Batch Quantity: ${qty.toLocaleString()} pouches`,
            `• Production Rate: ₱${unitCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })} / pouch`,
            `• Packaging Cost: ₱0.00 (Deducted from stored MOQ: ${bal.remaining_pouches.toLocaleString()} / ${bal.total_pouches.toLocaleString()} remaining)`,
            '• Cylinder Cost: ₱0.00 (One-time payment already settled)',
            `• Total Batch Production Cost: ₱${total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
            '',
            'Payment Milestones:',
            `• Before production (100% batch production): ₱${total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
            '• Before pickup: ₱0.00',
            '',
            'Commercial Terms & Conditions:',
            '• Deducted from client stored packaging balance (valid for 2 years from initial order).',
            '• Payment by bank transfer; payment instructions will be provided by Sales.',
            '• Freight: FOB CDO | VAT: Exclusive',
        ].join('\n');
    }

    if (inq.inquiry_type === 'packaging_replenishment' && inq.packaging_balance) {
        const bal = inq.packaging_balance;
        const qty = Number(inq.reorder_batch_quantity) || Number(bal.batch_min_quantity);
        const unitCost = Number(bal.production_unit_cost);
        const packUnit = Number(bal.packaging_unit_cost) || 10;
        const packCost = Number(bal.total_pouches) * packUnit;
        const prodCost = qty * unitCost;
        const total = packCost + prodCost;
        const pkgTitle = `${bal.package_slug.charAt(0).toUpperCase()}${bal.package_slug.slice(1)} Package`;
        return [
            `Item: ${pkgTitle} — Packaging Replenishment + Batch (${bal.brand_name})`,
            `• Packaging Refill: ₱${packUnit.toLocaleString('en-PH', { minimumFractionDigits: 2 })} × ${Number(bal.total_pouches).toLocaleString()} pouches = ₱${packCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
            '• Cylinder Cost: ₱0.00 (One-time payment already settled)',
            `• Production Payment: ₱${unitCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })} × ${qty.toLocaleString()} pouches = ₱${prodCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
            `• Total Amount: ₱${total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
            '',
            'Payment Milestones:',
            `• Before production (Packaging Refill · ₱0 Cylinder): ₱${packCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
            `• Before pickup (Production: ${qty.toLocaleString()} pouches): ₱${prodCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
            '',
            'Commercial Terms & Conditions:',
            '• Remaining replenished pouches will be stored for up to 2 years.',
            '• Payment by bank transfer; payment instructions will be provided by Sales.',
            '• Freight: FOB CDO | VAT: Exclusive',
        ].join('\n');
    }

    const packageItem = selectedPackage(inq, catalog);
    if (packageItem) {
        const customerRequest = inq.customizations[0]?.requested_ingredient_note;
        const milestones = calculateInquiryMilestones(inq, catalog);
        const breakdownLines = Array.isArray(packageItem.cost_breakdown) && packageItem.cost_breakdown.length > 0
            ? [
                '',
                'Package Cost Breakdown:',
                ...packageItem.cost_breakdown.map(
                    (line) => `• ${line.label}: ₱${Number(line.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}${line.quantity ? ` (${line.quantity})` : ''}`,
                ),
            ]
            : [];

        return [
            `Item: ${packageItem.name}`,
            `• MOQ: ${Number(packageItem.minimum_quantity).toLocaleString()} pouches`,
            `• Packaging: ${packageItem.packaging_details} (${packageItem.label_details})`,
            `• Net Weight: ${packageItem.net_weight}`,
            `• Package Amount: ₱${Number(packageItem.initial_price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
            `• Lead Time: ${packageItem.lead_time_text}`,
            customerRequest ? `• Customer request: ${customerRequest}` : null,
            ...breakdownLines,
            '',
            'Payment Milestones:',
            `• ${milestones.initialLabel}: ₱${Number(milestones.initial || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
            `• ${milestones.balanceLabel}: ₱${Number(milestones.balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
            '',
            'Commercial Terms & Conditions:',
            `• ${packageItem.payment_terms}`,
            packageItem.package_notes ? `• ${packageItem.package_notes}` : null,
            '• Payment by bank transfer; payment instructions will be provided by Sales.',
            '• Freight: FOB CDO | VAT: Exclusive',
        ].filter((line) => line !== null).join('\n');
    }
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

export default function QuotationCreate({ pendingInquiries, selectedInquiryId, packageCatalog }: Props) {
    const initialInq = pendingInquiries.find((i) => String(i.inquiry_id) === String(selectedInquiryId));
    const initialTotal = initialInq ? calculateInquiryTotal(initialInq, packageCatalog) : '';
    const initialMilestones = initialInq
        ? calculateInquiryMilestones(initialInq, packageCatalog, initialTotal)
        : { initial: '', balance: '', initialLabel: 'Before production', balanceLabel: 'Before pickup' };
    const initialDetails = initialInq ? buildAutoItemDetails(initialInq, packageCatalog) : '';

    const { data, setData, post, processing, errors } = useForm({
        inquiry_id: selectedInquiryId ? String(selectedInquiryId) : '',
        total_amount: initialTotal,
        initial_payment_amount: initialMilestones.initial,
        balance_payment_amount: initialMilestones.balance,
        valid_until: '',
        item_details: initialDetails,
    });

    const [validUntilOpen, setValidUntilOpen] = useState(false);
    const [viewCustomizationsOpen, setViewCustomizationsOpen] = useState(false);

    // Auto-populate item details, total, and milestones when inquiry_id is selected/changed
    useEffect(() => {
        if (data.inquiry_id && !data.item_details) {
            const inq = pendingInquiries.find((i) => String(i.inquiry_id) === String(data.inquiry_id));
            if (inq) {
                const autoDetails = buildAutoItemDetails(inq, packageCatalog);
                const autoTotal = calculateInquiryTotal(inq, packageCatalog);
                const autoMilestones = calculateInquiryMilestones(inq, packageCatalog, autoTotal);
                setData((prev) => ({
                    ...prev,
                    total_amount: prev.total_amount || autoTotal,
                    initial_payment_amount: prev.initial_payment_amount || autoMilestones.initial,
                    balance_payment_amount: prev.balance_payment_amount || autoMilestones.balance,
                    item_details: prev.item_details || autoDetails,
                }));
            }
        }
    }, [data.inquiry_id, pendingInquiries]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!data.inquiry_id || !(Number(data.total_amount) > 0)) return;
        post(route('quotations.store'));
    }

    const numericTotal = Number(data.total_amount);
    const numericInitial = Number(data.initial_payment_amount || 0);
    const numericBalance = Number(data.balance_payment_amount || 0);
    const milestonesMatchTotal = Math.abs((numericInitial + numericBalance) - numericTotal) <= 0.01;
    const isTotalAccepted = data.total_amount !== '' && !Number.isNaN(numericTotal) && numericTotal > 0 && milestonesMatchTotal;

    // Find the currently selected inquiry so we can display its details
    const selected = pendingInquiries.find((i) => String(i.inquiry_id) === data.inquiry_id);
    const activeMilestones = calculateInquiryMilestones(selected, packageCatalog, data.total_amount);
    const initialMilestoneLabel = activeMilestones.initialLabel;
    const balanceMilestoneLabel = activeMilestones.balanceLabel;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Quotation" />

            <main className="bmanny-page">
                <div className="bmanny-page-inner space-y-6">
                    {/* Header Banner matching inquiries.tsx */}
                    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="border-l-4 border-amber-400 pl-3.5">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sales Workspace</p>
                            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">NEW QUOTATION</h1>
                            <p className="text-xs text-muted-foreground sm:text-sm">
                                Select an inquiry, review or adjust the item details and price, and send the quote to the client
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-10 rounded-lg border-border/80 bg-card px-4 text-xs font-semibold text-foreground shadow-sm hover:bg-muted"
                        >
                            <Link href={route('inquiries.index')}>
                                <ArrowLeft className="mr-1.5 h-4 w-4 text-muted-foreground" />
                                Back to Inquiries
                            </Link>
                        </Button>
                    </header>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Form column */}
                        <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-2">
                            {/* Inquiry selector */}
                            <div className="rounded-xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
                                <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                                    <ClipboardList className="size-4 text-primary" />
                                    <h2 className="text-base font-bold text-foreground">Select Inquiry</h2>
                                </div>
                                <div>
                                    {pendingInquiries.length === 0 ? (
                                        <p className="text-xs text-muted-foreground py-2">
                                            No pending inquiries awaiting a quotation.
                                        </p>
                                    ) : (
                                        <div className="relative">
                                            <select
                                                id="inquiry_id"
                                                value={data.inquiry_id}
                                                onChange={(e) => {
                                                    const inqId = e.target.value;
                                                    const inq = pendingInquiries.find((i) => String(i.inquiry_id) === inqId);
                                                    if (inq) {
                                                        const autoTotal = calculateInquiryTotal(inq, packageCatalog);
                                                        const autoMilestones = calculateInquiryMilestones(inq, packageCatalog, autoTotal);
                                                        const autoDetails = buildAutoItemDetails(inq, packageCatalog);
                                                        setData((prev) => ({
                                                            ...prev,
                                                            inquiry_id: inqId,
                                                            total_amount: autoTotal || prev.total_amount,
                                                            initial_payment_amount: autoMilestones.initial,
                                                            balance_payment_amount: autoMilestones.balance,
                                                            item_details: autoDetails,
                                                        }));
                                                    } else {
                                                        setData((prev) => ({
                                                            ...prev,
                                                            inquiry_id: '',
                                                            total_amount: '',
                                                            initial_payment_amount: '',
                                                            balance_payment_amount: '',
                                                            item_details: '',
                                                        }));
                                                    }
                                                }}
                                                className="h-10 w-full appearance-none rounded-lg border border-input/80 bg-muted/20 px-3.5 pr-10 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                            >
                                                <option value="">— Choose an inquiry —</option>
                                                {pendingInquiries.map((inq) => (
                                                    <option key={inq.inquiry_id} value={String(inq.inquiry_id)}>
                                                        #{inq.inquiry_id} — {inq.client?.business_name ?? 'Unknown'} (
                                                        {(inq.customizations ?? []).map((c) => c.packaging_type).join(', ')})
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        </div>
                                    )}
                                    {errors.inquiry_id && (
                                        <p className="mt-1.5 text-xs text-destructive">{errors.inquiry_id}</p>
                                    )}
                                </div>
                            </div>

                            {/* Pricing & Validity */}
                            <div className="rounded-xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                    <h2 className="text-base font-bold text-foreground">Pricing &amp; Validity</h2>
                                    {data.total_amount !== '' && (
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${isTotalAccepted
                                                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-700/10 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                    : 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-700/10 dark:bg-rose-950/40 dark:text-rose-300'
                                                }`}
                                        >
                                            {isTotalAccepted ? <Check className="size-3" /> : <X className="size-3" />}
                                            {isTotalAccepted ? 'Accepted' : 'Must be > ₱0.00'}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-4 pt-1">
                                    <div>
                                        <label htmlFor="total_amount" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Total Amount (₱) <span className="text-destructive">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                                ₱
                                            </span>
                                            <input
                                                id="total_amount"
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                required
                                                placeholder="0.00"
                                                value={data.total_amount}
                                                onChange={(e) => {
                                                    const nextTotal = e.target.value;
                                                    const milestones = calculateInquiryMilestones(selected, packageCatalog, nextTotal);
                                                    setData((prev) => ({
                                                        ...prev,
                                                        total_amount: nextTotal,
                                                        initial_payment_amount: milestones.initial,
                                                        balance_payment_amount: milestones.balance,
                                                    }));
                                                }}
                                                className="h-10 w-full rounded-lg border border-input/80 bg-muted/20 pl-8 pr-3.5 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                            />
                                        </div>
                                        {errors.total_amount && (
                                            <p className="mt-1 text-xs text-destructive">{errors.total_amount}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="initial_payment_amount" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                {initialMilestoneLabel} (₱)
                                            </label>
                                            <div className="relative">
                                                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                                    ₱
                                                </span>
                                                <input
                                                    id="initial_payment_amount"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                    placeholder="0.00"
                                                    value={data.initial_payment_amount}
                                                    onChange={(e) => {
                                                        const nextInitial = e.target.value;
                                                        const initNum = Number(nextInitial) || 0;
                                                        const balNum = Number(data.balance_payment_amount) || 0;
                                                        setData((prev) => ({
                                                            ...prev,
                                                            initial_payment_amount: nextInitial,
                                                            total_amount: (initNum + balNum).toFixed(2),
                                                        }));
                                                    }}
                                                    className="h-10 w-full rounded-lg border border-input/80 bg-muted/20 pl-8 pr-3.5 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                                />
                                            </div>
                                            {errors.initial_payment_amount && (
                                                <p className="mt-1 text-xs text-destructive">{errors.initial_payment_amount}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="balance_payment_amount" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                {balanceMilestoneLabel} (₱)
                                            </label>
                                            <div className="relative">
                                                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                                    ₱
                                                </span>
                                                <input
                                                    id="balance_payment_amount"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                    placeholder="0.00"
                                                    value={data.balance_payment_amount}
                                                    onChange={(e) => {
                                                        const nextBalance = e.target.value;
                                                        const initNum = Number(data.initial_payment_amount) || 0;
                                                        const balNum = Number(nextBalance) || 0;
                                                        setData((prev) => ({
                                                            ...prev,
                                                            balance_payment_amount: nextBalance,
                                                            total_amount: (initNum + balNum).toFixed(2),
                                                        }));
                                                    }}
                                                    className="h-10 w-full rounded-lg border border-input/80 bg-muted/20 pl-8 pr-3.5 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                                />
                                            </div>
                                            {errors.balance_payment_amount && (
                                                <p className="mt-1 text-xs text-destructive">{errors.balance_payment_amount}</p>
                                            )}
                                        </div>
                                    </div>
                                    {!milestonesMatchTotal && data.total_amount !== '' && (
                                        <p className="text-xs text-destructive">
                                            Before production and before pickup amounts must add up to the total amount.
                                        </p>
                                    )}

                                    <div>
                                        <label htmlFor="valid_until" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Valid Until
                                        </label>
                                        <Popover open={validUntilOpen} onOpenChange={setValidUntilOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    id="valid_until"
                                                    type="button"
                                                    variant="outline"
                                                    className={cn(
                                                        'h-10 w-full justify-start rounded-lg border border-input/80 bg-muted/20 px-3.5 py-2 text-left text-xs font-semibold',
                                                        !data.valid_until && 'text-muted-foreground',
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
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
                                        <div className="mb-1.5 flex items-center justify-between">
                                            <label htmlFor="item_details" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                Item Details / Notes
                                            </label>
                                            {selected && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 rounded-md px-2 text-xs font-semibold text-primary hover:bg-primary/10"
                                                    onClick={() => {
                                                        const autoDetails = buildAutoItemDetails(selected, packageCatalog);
                                                        const autoTotal = calculateInquiryTotal(selected, packageCatalog);
                                                        const autoMilestones = calculateInquiryMilestones(selected, packageCatalog, autoTotal);
                                                        setData((prev) => ({
                                                            ...prev,
                                                            total_amount: autoTotal || prev.total_amount,
                                                            initial_payment_amount: autoMilestones.initial,
                                                            balance_payment_amount: autoMilestones.balance,
                                                            item_details: autoDetails,
                                                        }));
                                                    }}
                                                    title="Re-populate item details from the selected inquiry"
                                                >
                                                    <Sparkles className="mr-1 h-3.5 w-3.5" />
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
                                            maxLength={4000}
                                            placeholder="List the items, unit prices, quantities, or any notes for the client…"
                                            value={data.item_details}
                                            onChange={(e) => setData('item_details', e.target.value)}
                                            className="w-full rounded-lg border border-input/80 bg-muted/20 p-3.5 text-xs font-mono leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary drawer-scrollbar"
                                        />
                                        {errors.item_details && (
                                            <p className="mt-1 text-xs text-destructive">{errors.item_details}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    type="button"
                                    asChild
                                    className="h-10 rounded-lg border-border/80 bg-card px-5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted"
                                >
                                    <Link href={route('inquiries.index')}>Cancel</Link>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing || !data.inquiry_id || !isTotalAccepted}
                                    className="h-10 rounded-lg bg-blue-600 px-6 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {processing ? 'Sending…' : 'Send Quotation'}
                                </Button>
                            </div>
                        </form>

                        {/* Inquiry details sidebar */}
                        <div className="lg:col-span-1">
                            <div className="lg:sticky lg:top-6">
                                <div className="rounded-xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                        <h2 className="text-base font-bold text-foreground">Inquiry Details</h2>
                                        {selected && (
                                            <span className="font-mono text-xs font-bold text-primary">
                                                #{selected.inquiry_id}
                                            </span>
                                        )}
                                    </div>

                                    {!selected ? (
                                        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
                                            <ClipboardList className="h-8 w-8 opacity-40" />
                                            <p className="text-xs">Select an inquiry to see its details here.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 text-xs">
                                            <div>
                                                <p className="text-[11px] font-mono text-muted-foreground">
                                                    Submitted {formatDate(selected.created_at)}
                                                </p>
                                            </div>

                                            <div className="space-y-2.5 rounded-lg border border-border/60 bg-muted/20 p-3.5">
                                                <div className="flex items-start gap-2.5">
                                                    <Building2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                                    <div>
                                                        <p className="font-bold text-foreground">{selected.client?.business_name ?? '—'}</p>
                                                        {selected.client?.business_type && (
                                                            <p className="text-[11px] text-muted-foreground">
                                                                {selected.client.business_type}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2.5">
                                                    <User className="size-4 shrink-0 text-muted-foreground" />
                                                    <p className="font-medium text-foreground">{selected.client?.contact_person ?? '—'}</p>
                                                </div>

                                                {selected.client?.user?.email && (
                                                    <div className="flex items-center gap-2.5">
                                                        <Mail className="size-4 shrink-0 text-muted-foreground" />
                                                        <p className="break-all font-mono text-[11px] text-foreground">{selected.client.user.email}</p>
                                                    </div>
                                                )}

                                                {selected.client?.business_address && (
                                                    <div className="flex items-start gap-2.5">
                                                        <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                                        <p className="text-muted-foreground">
                                                            {selected.client.business_address}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {selected.product_request_review?.suggested_variant?.product_type && (
                                                <div className="space-y-2 border-t border-border/60 pt-3">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                        Approved Product Specification
                                                    </p>
                                                    <div className="space-y-1.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
                                                        {(() => {
                                                            const variant = selected.product_request_review!.suggested_variant!;
                                                            const product = variant.product_type!;
                                                            return (
                                                                <>
                                                                    <p className="font-bold text-foreground">
                                                                        {product.name}
                                                                        {variant.name ? ` — ${variant.name}` : ''}
                                                                    </p>
                                                                    {product.net_weight && (
                                                                        <p><span className="font-medium text-muted-foreground">Net content:</span> {product.net_weight}</p>
                                                                    )}
                                                                    {(selected.product_request_review?.suggested_packaging?.name || product.packaging_specification) && (
                                                                        <p>
                                                                            <span className="font-medium text-muted-foreground">Packaging:</span>{' '}
                                                                            {selected.product_request_review?.suggested_packaging?.name ?? product.packaging_specification}
                                                                        </p>
                                                                    )}
                                                                    {product.label_specification && (
                                                                        <p><span className="font-medium text-muted-foreground">Label:</span> {product.label_specification}</p>
                                                                    )}
                                                                    {product.formulation_notes && (
                                                                        <p><span className="font-medium text-muted-foreground">Ingredients:</span> {product.formulation_notes}</p>
                                                                    )}
                                                                    {variant.current_moq?.min_quantity && (
                                                                        <p><span className="font-medium text-muted-foreground">MOQ:</span> {variant.current_moq.min_quantity}</p>
                                                                    )}
                                                                    <p>
                                                                        <span className="font-medium text-muted-foreground">Reference price:</span> ₱{Number(product.suggested_srp ?? 0).toFixed(2)} ·{' '}
                                                                        <span className="font-medium text-muted-foreground">Lead time:</span> {product.lead_time_days ?? 'Not set'} days
                                                                    </p>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground">This approved specification will be saved with the quotation when it is sent.</p>
                                                </div>
                                            )}

                                            <div className="space-y-3 border-t border-border/60 pt-3">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                        Requested Customizations
                                                    </p>
                                                </div>
                                                {(selected.customizations ?? []).length === 0 ? (
                                                    <p className="text-xs text-muted-foreground">No customization details provided.</p>
                                                ) : (
                                                    (selected.customizations ?? []).map((c, idx) => {
                                                        const sheet = parseCustomizationSheet(c, selected, selectedPackage(selected, packageCatalog));
                                                        return (
                                                            <div
                                                                key={c.customization_id || idx}
                                                                className="space-y-2.5 rounded-lg border border-border/70 bg-card p-3.5 shadow-2xs"
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-bold text-foreground text-xs">
                                                                        {sheet.productName}
                                                                    </span>
                                                                    <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-inset ring-rose-700/10 dark:bg-rose-950/40 dark:text-rose-300">
                                                                        {sheet.priceUnit}
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                                    <div>
                                                                        <p className="text-[10px] uppercase text-muted-foreground">Package</p>
                                                                        <p className="font-medium text-foreground">{sheet.primary}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] uppercase text-muted-foreground">Finish</p>
                                                                        <p className="font-medium text-foreground">{sheet.printing}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] uppercase text-muted-foreground">Net Wt</p>
                                                                        <p className="font-medium text-foreground">{sheet.netWeight}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] uppercase text-muted-foreground">MOQ</p>
                                                                        <p className="font-medium text-foreground">{sheet.moq}</p>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-full h-8 text-xs font-semibold gap-1.5 rounded-lg border-border/80 bg-muted/20 text-foreground hover:bg-muted"
                                                                    onClick={() => setViewCustomizationsOpen(true)}
                                                                >
                                                                    <FileText className="size-3.5" />
                                                                    View {selectedPackage(selected, packageCatalog)?.name ?? 'Package'} Sheet
                                                                </Button>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
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
                                        {selectedPackage(selected, packageCatalog)?.name ?? 'Package'} Sheet
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
                                const packageItem = selectedPackage(selected, packageCatalog);
                                const sheet = parseCustomizationSheet(c, selected, packageItem);
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
                                                    {sheet.productName} {packageItem?.name?.replace(' Package', '') ?? 'Starter'} PACKAGE
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
                                                    <p className="font-semibold text-slate-900">{packageItem?.payment_terms ?? '50% DP before production; 50% balance before pickup'}</p>
                                                </div>
                                                <div className="shrink-0 text-slate-900 font-semibold">
                                                    c) Order Lead Time {packageItem?.lead_time_text ?? '10-15 days'}
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
                                    const autoTotal = calculateInquiryTotal(selected, packageCatalog);
                                    const autoDetails = buildAutoItemDetails(selected, packageCatalog);
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
