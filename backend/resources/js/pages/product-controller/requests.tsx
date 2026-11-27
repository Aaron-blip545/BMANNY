import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import {
    ArrowLeft,
    ChevronDown,
    Search,
    Clock,
    CheckCircle2,
    Layers,
    AlertCircle,
    User,
    Box,
    ClipboardList,
    FileText,
    ExternalLink,
    Sparkles,
    FlaskConical,
    Plus,
    X,
} from 'lucide-react';

type Variant = { variant_id: number; name: string; sku?: string | null; is_available?: boolean; product_type?: { name: string } };
type Packaging = { packaging_id: number; name: string; category: string };
type Product = { product_type_id: number; name: string; variants: Variant[]; packaging_options: Packaging[] };
type RawMaterialOption = {
    product_id: number;
    sku: string;
    name: string;
    rate: number;
    unit_of_measure: string;
    stock_quantity: number;
    reorder_level: number;
};
type BaseBomRecipe = {
    recipe_id: number;
    product_id: number;
    raw_material_name: string;
    raw_material_sku: string;
    unit_of_measure: string;
    stock_quantity: number;
    quantity_per_unit: number;
    rate: number;
    amount: number;
};
type CustomBomItem = {
    product_id: number;
    name: string;
    sku: string;
    unit_of_measure: string;
    quantity_per_unit: string | number;
    rate: number;
    amount: number;
};
type Review = {
    product_request_review_id: number;
    status: string;
    request_notes: string | null;
    response_notes: string | null;
    custom_bom_items?: CustomBomItem[] | null;
    reviewed_at: string | null;
    inquiry: {
        inquiry_id: number;
        subject: string | null;
        message: string | null;
        created_at: string | null;
        client: {
            business_name: string;
            business_type: string | null;
            contact_person: string;
            business_address: string | null;
            user: { full_name: string; email: string } | null;
        } | null;
        customizations: {
            customization_id: number;
            customization_type: string | null;
            selected_package: string | null;
            packaging_type: string | null;
            packaging_finish: string | null;
            serving_size: string | null;
            formulation_notes: string | null;
            requested_ingredient_note: string | null;
            design_file_path: string | null;
            client_notes: string | null;
        }[];
    };
    product_type: Product | null;
    requested_variant: Variant | null;
    suggested_variant: Variant | null;
    suggested_packaging: Packaging | null;
    requester: { full_name: string } | null;
};

function getStatusBadge(status: string) {
    switch (status) {
        case 'available':
            return {
                label: 'Available',
                pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
            };
        case 'alternative':
            return {
                label: 'Alternative Offered',
                pill: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
            };
        case 'unavailable':
            return {
                label: 'Unavailable',
                pill: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
            };
        case 'pending':
        default:
            return {
                label: 'Awaiting Review',
                pill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
            };
    }
}

function detailValue(value: string | null | undefined) {
    return value?.trim() || 'Not provided';
}

function parseDelimitedNotes(notes: string | null | undefined): Array<{ label: string; value: string }> | null {
    if (!notes || !notes.includes(' | ')) return null;
    const parts = notes.split(' | ').map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return null;
    return parts.map((part) => {
        const colonIdx = part.indexOf(':');
        if (colonIdx !== -1) {
            return {
                label: part.slice(0, colonIdx).trim(),
                value: part.slice(colonIdx + 1).trim(),
            };
        }
        return { label: '', value: part };
    });
}

export default function ProductRequests({
    requests,
    productTypes,
    rawMaterials = [],
    baseBomRecipes = [],
}: {
    requests: Review[];
    productTypes: Product[];
    rawMaterials?: RawMaterialOption[];
    baseBomRecipes?: BaseBomRecipe[];
}) {
    const [editing, setEditing] = useState<Review | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [customBomRows, setCustomBomRows] = useState<CustomBomItem[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitErrors, setSubmitErrors] = useState<Record<string, string>>({});

    const form = useForm({
        status: 'available',
        suggested_variant_id: '',
        suggested_packaging_id: '',
        response_notes: '',
    });

    const openReview = (review: Review) => {
        setEditing(review);
        setSubmitErrors({});
        form.setData({
            status: review.status === 'pending' ? 'available' : review.status,
            suggested_variant_id: review.suggested_variant?.variant_id?.toString() ?? '',
            suggested_packaging_id: review.suggested_packaging?.packaging_id?.toString() ?? '',
            response_notes: review.response_notes ?? '',
        });
        setCustomBomRows(
            Array.isArray(review.custom_bom_items)
                ? review.custom_bom_items.map((item) => ({
                      product_id: Number(item.product_id),
                      name: item.name || '',
                      sku: item.sku || '',
                      unit_of_measure: item.unit_of_measure || 'kg',
                      quantity_per_unit: item.quantity_per_unit,
                      rate: Number(item.rate) || 0,
                      amount: Number(item.amount) || 0,
                  }))
                : []
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const editingPackageSlug = (editing?.inquiry.customizations?.[0]?.selected_package || 'starter').toLowerCase();
    const customBomLimit = editingPackageSlug === 'elite' ? 8 : editingPackageSlug === 'gold' ? 6 : 0;

    const handleAddCustomBomRow = () => {
        if (customBomLimit <= 0 || customBomRows.length >= customBomLimit) return;
        const usedIds = new Set(customBomRows.map((r) => r.product_id));
        const available = rawMaterials.find((m) => !usedIds.has(m.product_id)) || rawMaterials[0];
        if (!available) return;
        setCustomBomRows((prev) => [
            ...prev,
            {
                product_id: available.product_id,
                name: available.name,
                sku: available.sku,
                unit_of_measure: available.unit_of_measure,
                quantity_per_unit: '',
                rate: available.rate,
                amount: 0,
            },
        ]);
    };

    const handleUpdateCustomBomRow = (index: number, field: 'product_id' | 'quantity_per_unit', value: string | number) => {
        setCustomBomRows((prev) => {
            const next = [...prev];
            const row = { ...next[index] };
            if (field === 'product_id') {
                const mat = rawMaterials.find((m) => m.product_id === Number(value));
                if (mat) {
                    row.product_id = mat.product_id;
                    row.name = mat.name;
                    row.sku = mat.sku;
                    row.unit_of_measure = mat.unit_of_measure;
                    row.rate = mat.rate;
                }
            } else {
                row.quantity_per_unit = value;
            }
            const qty = parseFloat(String(row.quantity_per_unit)) || 0;
            row.amount = Math.round(qty * row.rate * 100) / 100;
            next[index] = row;
            return next;
        });
    };

    const handleRemoveCustomBomRow = (index: number) => {
        setCustomBomRows((prev) => prev.filter((_, i) => i !== index));
    };

    const submit = () => {
        if (!editing) return;
        setSubmitting(true);
        setSubmitErrors({});
        const validBom =
            customBomLimit > 0
                ? customBomRows
                      .filter((r) => r.product_id && parseFloat(String(r.quantity_per_unit)) > 0)
                      .map((r) => ({
                          product_id: r.product_id,
                          quantity_per_unit: parseFloat(String(r.quantity_per_unit)),
                      }))
                : [];

        router.patch(
            route('product-controller.requests.review', editing.product_request_review_id),
            {
                status: form.data.status,
                suggested_variant_id: form.data.suggested_variant_id || null,
                suggested_packaging_id: form.data.suggested_packaging_id || null,
                response_notes: form.data.response_notes,
                custom_bom_items: validBom,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSubmitting(false);
                    setEditing(null);
                },
                onError: (errs) => {
                    setSubmitErrors(errs as Record<string, string>);
                    setSubmitting(false);
                },
            }
        );
    };

    const filteredRequests = useMemo(() => {
        return requests.filter((review) => {
            if (statusFilter !== 'all' && review.status !== statusFilter) return false;
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return (
                String(review.inquiry.inquiry_id).includes(q) ||
                (review.inquiry.client?.business_name.toLowerCase().includes(q) ?? false) ||
                (review.inquiry.client?.contact_person.toLowerCase().includes(q) ?? false) ||
                (review.product_type?.name.toLowerCase().includes(q) ?? false) ||
                (review.requester?.full_name.toLowerCase().includes(q) ?? false)
            );
        });
    }, [requests, search, statusFilter]);

    const editingBatchQty = useMemo(() => {
        if (!editing) return 100;
        const first = editing.inquiry.customizations?.[0];
        const pkg = (first?.selected_package || 'starter').toLowerCase();
        if (pkg === 'gold') return 150;
        if (pkg === 'elite') return 350;
        const match =
            first?.serving_size?.match(/[×x]\s*([\d,]+)/i) ||
            first?.client_notes?.match(/(?:^|\|\s*)MOQ\s*:\s*([\d,]+)/i);
        if (match) {
            const parsed = parseInt(match[1].replace(/,/g, ''), 10);
            if (!Number.isNaN(parsed) && parsed > 0) return parsed;
        }
        return 100;
    }, [editing]);

    if (editing) {
        const baseCost = baseBomRecipes.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        const addonCost = customBomRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        const totalFormulaCost = baseCost + addonCost;
        const isAtLimit = customBomLimit > 0 && customBomRows.length >= customBomLimit;

        return (
            <AppLayout
                breadcrumbs={[
                    { title: 'Product Controller', href: '/product-controller/dashboard' },
                    { title: 'Product Requests', href: '/product-controller/requests' },
                    { title: `Inquiry #${editing.inquiry.inquiry_id}`, href: '/product-controller/requests' },
                ]}
            >
                <Head title={`Review Inquiry #${editing.inquiry.inquiry_id}`} />
                <main className="bmanny-page">
                    <div className="bmanny-page-inner space-y-5">
                        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-4">
                            <div className="flex items-center gap-3.5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditing(null)}
                                    className="h-9 rounded-lg border-border/80 bg-card px-3 text-xs font-semibold"
                                >
                                    <ArrowLeft className="mr-1.5 size-4" />
                                    Back to Requests
                                </Button>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
                                            Respond to Inquiry #{editing.inquiry.inquiry_id}
                                        </h1>
                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold capitalize text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                            {editingPackageSlug} Package
                                        </span>
                                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                            Production Batch: {editingBatchQty.toLocaleString()} pouches
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Review client specs, configure {editingPackageSlug === 'gold' ? 'Gold (+6)' : editingPackageSlug === 'elite' ? 'Elite (+8)' : 'base'} BOM, and send your availability decision to Sales.
                                    </p>
                                </div>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
                            <div className="space-y-5 lg:col-span-8">
                                <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs space-y-4">
                                    <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
                                        <User className="size-4 text-primary" />
                                        <h2 className="text-sm font-bold text-foreground">Inquiry &amp; Customer Details</h2>
                                    </div>
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Customer Information</h4>
                                            <dl className="grid grid-cols-[6rem_1fr] gap-x-2 gap-y-1.5 text-xs">
                                                <dt className="text-muted-foreground">Business</dt>
                                                <dd className="font-semibold text-foreground">{detailValue(editing.inquiry.client?.business_name)}</dd>
                                                <dt className="text-muted-foreground">Contact</dt>
                                                <dd className="text-foreground">{detailValue(editing.inquiry.client?.contact_person)}</dd>
                                                <dt className="text-muted-foreground">Email</dt>
                                                <dd className="break-all font-mono text-foreground">{detailValue(editing.inquiry.client?.user?.email)}</dd>
                                                <dt className="text-muted-foreground">Type</dt>
                                                <dd className="text-foreground">{detailValue(editing.inquiry.client?.business_type)}</dd>
                                                <dt className="text-muted-foreground">Address</dt>
                                                <dd className="text-foreground">{detailValue(editing.inquiry.client?.business_address)}</dd>
                                            </dl>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Requested Product</h4>
                                            <dl className="grid grid-cols-[6rem_1fr] gap-x-2 gap-y-1.5 text-xs">
                                                <dt className="text-muted-foreground">Product</dt>
                                                <dd className="font-semibold text-primary">{editing.product_type?.name ?? 'AshigoPlus Coffee Drink Mix'}</dd>
                                                <dt className="text-muted-foreground">Submitted</dt>
                                                <dd className="font-mono text-foreground">
                                                    {editing.inquiry.created_at ? new Date(editing.inquiry.created_at).toLocaleDateString() : 'Not recorded'}
                                                </dd>
                                            </dl>
                                            {editing.request_notes && (
                                                <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 p-3">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Sales Notes</p>
                                                    <p className="mt-1 text-xs text-foreground whitespace-pre-wrap">{editing.request_notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs space-y-4">
                                    <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
                                        <Box className="size-4 text-primary" />
                                        <h2 className="text-sm font-bold text-foreground">Requested Configuration</h2>
                                    </div>
                                    {editing.inquiry.customizations.length === 0 ? (
                                        <p className="text-xs text-muted-foreground">No configuration details were submitted.</p>
                                    ) : (
                                        editing.inquiry.customizations.map((customization) => {
                                            const parsedCustomerNotes = parseDelimitedNotes(customization.client_notes);
                                            return (
                                                <div key={customization.customization_id} className="space-y-3.5">
                                                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                                        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Package</p>
                                                            <p className="mt-1 text-xs font-semibold text-foreground capitalize">{detailValue(customization.selected_package)}</p>
                                                        </div>
                                                        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Packaging</p>
                                                            <p className="mt-1 text-xs font-semibold text-foreground">{detailValue(customization.packaging_type)}</p>
                                                        </div>
                                                        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Finish</p>
                                                            <p className="mt-1 text-xs font-semibold text-foreground">{detailValue(customization.packaging_finish)}</p>
                                                        </div>
                                                        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Serving / Qty</p>
                                                            <p className="mt-1 text-xs font-semibold text-foreground">{detailValue(customization.serving_size)}</p>
                                                        </div>
                                                    </div>

                                                    {customization.requested_ingredient_note && (
                                                        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-1">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                                                Client Requested Herbal Ingredients / Desired Effect
                                                            </p>
                                                            <p className="text-xs font-medium text-foreground whitespace-pre-wrap">
                                                                {customization.requested_ingredient_note}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {customization.client_notes && parsedCustomerNotes && (
                                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                            {parsedCustomerNotes
                                                                .filter((item) => item.label?.toLowerCase() !== 'package terms')
                                                                .map((item, idx) => (
                                                                    <div key={idx} className="flex flex-col rounded-md border border-border/50 bg-muted/20 px-3 py-2">
                                                                        {item.label && (
                                                                            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                                                                {item.label}
                                                                            </span>
                                                                        )}
                                                                        <span className="text-xs font-medium text-foreground">{item.value}</span>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    )}

                                                    {customization.design_file_path && (
                                                        <div>
                                                            <a
                                                                className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-muted dark:text-blue-400 shadow-2xs"
                                                                href={`/storage/${customization.design_file_path}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                <ExternalLink className="size-3.5" />
                                                                View Customer Artwork
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                                        <div className="flex items-center gap-2.5">
                                            <FlaskConical className="size-4 text-primary" />
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h2 className="text-sm font-bold text-foreground">Inquiry Bill of Materials (BOM)</h2>
                                                    {customBomLimit > 0 ? (
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${isAtLimit ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-primary/15 text-primary'}`}>
                                                            +{customBomRows.length} / {customBomLimit} herbal add-ons
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                                            Base Formula Only
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                                    {customBomLimit > 0
                                                        ? `Global AshigoPlus base (${baseBomRecipes.length} items) + up to ${customBomLimit} custom herbal ingredients for this ${editingPackageSlug} inquiry.`
                                                        : 'Starter Package uses the fixed global AshigoPlus base formula only (no custom herbal add-ons).'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] text-muted-foreground font-medium">Calculated Formulation Cost</p>
                                            <p className="text-xl font-black text-blue-600 dark:text-blue-400">
                                                ₱{totalFormulaCost.toFixed(2)}
                                                <span className="text-xs font-normal text-muted-foreground ml-1">/ unit</span>
                                            </p>
                                        </div>
                                    </div>

                                    {submitErrors.custom_bom_items && (
                                        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                                            {submitErrors.custom_bom_items}
                                        </div>
                                    )}

                                    <div className="overflow-x-auto rounded-xl border border-border/70">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[11px] font-semibold bg-muted/40">
                                                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                                                    <th className="py-2.5 px-3 w-[40%]">Item (Raw Material)</th>
                                                    <th className="py-2.5 px-3 w-[20%]">Qty / Unit</th>
                                                    <th className="py-2.5 px-3 w-[18%]">Batch Need ({editingBatchQty})</th>
                                                    <th className="py-2.5 px-3 w-[12%]">Amount</th>
                                                    <th className="py-2.5 px-3 w-10 text-center"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/60">
                                                {baseBomRecipes.map((row, bIdx) => {
                                                    const batchNeed = Number((row.quantity_per_unit * editingBatchQty).toFixed(4));
                                                    const isShort = row.stock_quantity + 1e-6 < batchNeed;
                                                    return (
                                                        <tr key={`base-${row.recipe_id}`} className="bg-muted/15">
                                                            <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{bIdx + 1}</td>
                                                            <td className="py-2.5 px-3">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="font-medium text-foreground truncate">
                                                                        {row.raw_material_name} {row.raw_material_sku ? `(${row.raw_material_sku})` : ''}
                                                                    </span>
                                                                    <span className="shrink-0 rounded bg-background px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground border border-border/60">
                                                                        Base
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="py-2.5 px-3 font-mono text-foreground">
                                                                {row.quantity_per_unit} {row.unit_of_measure}
                                                            </td>
                                                            <td className="py-2.5 px-3 font-mono">
                                                                <span className={isShort ? 'font-bold text-destructive' : 'text-emerald-700 dark:text-emerald-400'}>
                                                                    {batchNeed} {row.unit_of_measure}
                                                                </span>
                                                                <span className="block text-[10px] text-muted-foreground">
                                                                    Stock: {row.stock_quantity} {row.unit_of_measure}
                                                                </span>
                                                            </td>
                                                            <td className="py-2.5 px-3 font-mono font-semibold text-foreground">
                                                                ₱{Number(row.amount).toFixed(2)}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-center text-muted-foreground">—</td>
                                                        </tr>
                                                    );
                                                })}

                                                {customBomLimit > 0 &&
                                                    customBomRows.map((row, idx) => {
                                                        const mat = rawMaterials.find((m) => m.product_id === row.product_id);
                                                        const stock = mat?.stock_quantity ?? 0;
                                                        const qtyNum = parseFloat(String(row.quantity_per_unit)) || 0;
                                                        const batchNeed = Number((qtyNum * editingBatchQty).toFixed(4));
                                                        const isShort = qtyNum > 0 && stock + 1e-6 < batchNeed;
                                                        return (
                                                            <tr key={`custom-${idx}`} className="hover:bg-muted/20">
                                                                <td className="py-2.5 px-3 text-center font-mono font-bold text-primary">
                                                                    {baseBomRecipes.length + idx + 1}
                                                                </td>
                                                                <td className="py-2.5 px-3">
                                                                    <select
                                                                        value={row.product_id}
                                                                        onChange={(e) => handleUpdateCustomBomRow(idx, 'product_id', Number(e.target.value))}
                                                                        className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                                                    >
                                                                        {rawMaterials.map((m) => (
                                                                            <option key={m.product_id} value={m.product_id}>
                                                                                {m.name} ({m.sku}) — ₱{m.rate.toFixed(2)}/{m.unit_of_measure} · Stock: {m.stock_quantity}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </td>
                                                                <td className="py-2.5 px-3">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Input
                                                                            type="number"
                                                                            step="0.0001"
                                                                            min="0"
                                                                            value={row.quantity_per_unit}
                                                                            onChange={(e) => handleUpdateCustomBomRow(idx, 'quantity_per_unit', e.target.value)}
                                                                            placeholder="0.00"
                                                                            className="h-9 text-xs font-mono bg-background"
                                                                        />
                                                                        <span className="text-muted-foreground whitespace-nowrap">{row.unit_of_measure}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-2.5 px-3 font-mono">
                                                                    <span className={isShort ? 'font-bold text-destructive' : 'text-emerald-700 dark:text-emerald-400'}>
                                                                        {batchNeed} {row.unit_of_measure}
                                                                    </span>
                                                                    <span className="block text-[10px] text-muted-foreground">
                                                                        Stock: {stock} {row.unit_of_measure}
                                                                    </span>
                                                                </td>
                                                                <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                                                                    ₱{Number(row.amount).toFixed(2)}
                                                                </td>
                                                                <td className="py-2.5 px-3 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveCustomBomRow(idx)}
                                                                        className="text-muted-foreground hover:text-destructive rounded-full p-1"
                                                                        title="Remove herbal ingredient"
                                                                    >
                                                                        <X className="size-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {customBomLimit > 0 ? (
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={isAtLimit}
                                                onClick={handleAddCustomBomRow}
                                                className="h-9 rounded-lg border-primary/30 text-primary hover:bg-primary/10 text-xs font-semibold gap-1.5 disabled:opacity-50"
                                            >
                                                <Plus className="size-3.5" />
                                                <span>
                                                    {isAtLimit ? `Maximum +${customBomLimit} herbal add-ons reached` : 'Add Herbal Ingredient'}
                                                </span>
                                            </Button>
                                            <span className="text-[11px] text-muted-foreground">
                                                Saved with this inquiry and automatically deducted with base BOM upon payment confirmation.
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-200">
                                            <span className="font-bold">Starter Package:</span> Uses the fixed global AshigoPlus base formula only. Custom herbal add-ons are only available for Gold (+6) and Elite (+8) inquiries.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="lg:col-span-4 lg:sticky lg:top-6">
                                <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs space-y-4">
                                    <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
                                        <CheckCircle2 className="size-4 text-primary" />
                                        <h2 className="text-sm font-bold text-foreground">Availability Decision &amp; Response</h2>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-foreground">
                                                Availability decision <span className="text-destructive">*</span>
                                            </Label>
                                            <Select value={form.data.status} onValueChange={(value) => form.setData('status', value)}>
                                                <SelectTrigger className="h-10 rounded-lg border-input/80 text-xs shadow-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="available">Available as requested</SelectItem>
                                                    <SelectItem value="alternative">Offer an alternative</SelectItem>
                                                    <SelectItem value="unavailable">Unavailable</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {submitErrors.status && <p className="text-destructive text-xs">{submitErrors.status}</p>}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-foreground">
                                                Response to Sales <span className="text-destructive">*</span>
                                            </Label>
                                            <textarea
                                                rows={5}
                                                className="w-full rounded-lg border border-input/80 bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                                value={form.data.response_notes}
                                                onChange={(e) => form.setData('response_notes', e.target.value)}
                                                placeholder="State raw-material availability, approved herbal add-ons, or why an alternative is recommended."
                                            />
                                            {submitErrors.response_notes && <p className="text-destructive text-xs">{submitErrors.response_notes}</p>}
                                        </div>

                                        <div className="flex items-center justify-end gap-2.5 border-t border-border/60 pt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setEditing(null)}
                                                className="h-10 rounded-lg border-border/80 bg-background px-4 text-xs font-semibold"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={submit}
                                                disabled={submitting}
                                                className="h-10 rounded-lg bg-blue-600 hover:bg-blue-700 px-5 text-xs font-semibold text-white shadow-sm disabled:opacity-50"
                                            >
                                                {submitting ? 'Sending...' : 'Send response'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Product Controller', href: '/product-controller/dashboard' },
                { title: 'Product Requests', href: '/product-controller/requests' },
            ]}
        >
            <Head title="Product Requests" />
            <main className="bmanny-page">
                <div className="bmanny-page-inner space-y-5">
                    {/* Header Banner matching Sales inquiries.tsx */}
                    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="border-l-4 border-amber-400 pl-3.5">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Product Controller Workspace</p>
                            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">PRODUCT REQUESTS</h1>
                            <p className="text-xs text-muted-foreground sm:text-sm">Check requests forwarded by Sales, then confirm availability or send alternatives</p>
                        </div>
                    </header>

                    {/* Metric Summary Cards */}
                    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                        {[
                            {
                                label: 'Awaiting Review',
                                value: requests.filter((r) => r.status === 'pending').length,
                                description: 'Needs availability check',
                                icon: Clock,
                            },
                            {
                                label: 'Available',
                                value: requests.filter((r) => r.status === 'available').length,
                                description: 'Confirmed as requested',
                                icon: CheckCircle2,
                            },
                            {
                                label: 'Alternative Offered',
                                value: requests.filter((r) => r.status === 'alternative').length,
                                description: 'Suggested options sent',
                                icon: Layers,
                            },
                            {
                                label: 'Unavailable',
                                value: requests.filter((r) => r.status === 'unavailable').length,
                                description: 'Cannot be manufactured',
                                icon: AlertCircle,
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
                            {filteredRequests.length}/{requests.length} Requests
                        </p>
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search business, contact, product, inquiry #..."
                                    className="h-9 w-full rounded-lg border border-input/80 bg-muted/20 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-80"
                                />
                            </div>
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-9 w-full appearance-none rounded-lg border border-input/80 bg-muted/20 px-3 pr-8 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-auto"
                                >
                                    <option value="all">All Decisions</option>
                                    <option value="pending">Awaiting Review</option>
                                    <option value="available">Available</option>
                                    <option value="alternative">Alternative</option>
                                    <option value="unavailable">Unavailable</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            </div>
                        </div>
                    </div>

                    {/* Floating Card Rows Table */}
                    {filteredRequests.length === 0 ? (
                        <div className="rounded-xl border border-border/70 bg-card py-16 text-center text-muted-foreground shadow-sm">
                            <ClipboardList className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                            <h2 className="text-base font-semibold text-foreground">No product requests found</h2>
                            <p className="mt-1 text-xs">No requests match the selected search or filter criteria.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px] border-separate border-spacing-y-2.5 text-left text-sm">
                                <thead>
                                    <tr>
                                        <th className="px-5 py-3 text-sm font-bold text-foreground">Inquiry</th>
                                        <th className="px-5 py-3 text-sm font-bold text-foreground">Requested Configuration</th>
                                        <th className="px-5 py-3 text-sm font-bold text-foreground">Customer Details</th>
                                        <th className="px-5 py-3 text-sm font-bold text-foreground">Sales Notes</th>
                                        <th className="px-5 py-3 text-sm font-bold text-foreground">Decision</th>
                                        <th className="px-5 py-3 text-right text-sm font-bold text-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRequests.map((review) => {
                                        const statusConfig = getStatusBadge(review.status);
                                        return (
                                            <tr
                                                key={review.product_request_review_id}
                                                className="group bg-card shadow-sm transition-shadow hover:shadow-md"
                                            >
                                                {/* Inquiry */}
                                                <td className="rounded-l-xl border-y border-l border-border/70 p-5 align-middle">
                                                    <p className="text-base font-bold text-foreground">
                                                        #{review.inquiry.inquiry_id}
                                                    </p>
                                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                                        {review.requester?.full_name ?? 'Sales Agent'}
                                                    </p>
                                                    {review.inquiry.created_at && (
                                                        <p className="mt-1 text-xs font-mono text-muted-foreground">
                                                            {new Date(review.inquiry.created_at).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Requested Configuration */}
                                                <td className="border-y border-border/70 p-5 align-middle">
                                                    <p className="text-base font-bold text-foreground">
                                                        {review.product_type?.name ?? 'Custom product request'}
                                                    </p>
                                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                                        {(review.requested_variant?.name ??
                                                            review.inquiry.customizations
                                                                .map((item) => item.selected_package ?? item.packaging_type)
                                                                .filter(Boolean)
                                                                .join(', ')) ||
                                                            'Standard'}
                                                    </p>
                                                </td>

                                                {/* Customer Details */}
                                                <td className="border-y border-border/70 p-5 align-middle">
                                                    <p className="text-base font-bold text-foreground">
                                                        {review.inquiry.client?.business_name ?? '—'}
                                                    </p>
                                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                                        {review.inquiry.client?.user?.email || review.inquiry.client?.contact_person || 'No contact'}
                                                    </p>
                                                </td>

                                                {/* Sales Notes */}
                                                <td className="border-y border-border/70 p-5 align-middle max-w-64">
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {review.request_notes || '—'}
                                                    </p>
                                                </td>

                                                {/* Decision */}
                                                <td className="border-y border-border/70 p-5 align-middle">
                                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${statusConfig.pill}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                    {review.response_notes && (
                                                        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                                                            {review.response_notes}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="rounded-r-xl border-y border-r border-border/70 p-5 align-middle text-right">
                                                    <Button
                                                        onClick={() => openReview(review)}
                                                        className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                                                    >
                                                        {review.status === 'pending' ? 'Review' : 'Update response'}
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </AppLayout>
    );
}
