import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { useState, useMemo, useRef, useEffect } from 'react';
import {
    Search,
    ChevronDown,
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
} from 'lucide-react';

type Variant = { variant_id: number; name: string; sku?: string | null; is_available?: boolean; product_type?: { name: string } };
type Packaging = { packaging_id: number; name: string; category: string };
type Product = { product_type_id: number; name: string; variants: Variant[]; packaging_options: Packaging[] };
type Review = {
    product_request_review_id: number;
    status: string;
    request_notes: string | null;
    response_notes: string | null;
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

export default function ProductRequests({ requests, productTypes }: { requests: Review[]; productTypes: Product[] }) {
    const [editing, setEditing] = useState<Review | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<number | null>(null);
    const [sectionsOpen, setSectionsOpen] = useState({
        inquiry: true,
        configuration: true,
        decision: true,
    });

    const handleDrawerScroll = () => {
        setIsScrolling(true);
        if (scrollTimeoutRef.current) {
            window.clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = window.setTimeout(() => {
            setIsScrolling(false);
        }, 200);
    };

    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                window.clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    const form = useForm({
        status: 'available',
        suggested_variant_id: '',
        suggested_packaging_id: '',
        response_notes: '',
    });

    const availableVariants = productTypes.flatMap((product) =>
        product.variants.map((variant) => ({ ...variant, product_name: product.name }))
    );
    const packaging = productTypes
        .flatMap((product) => product.packaging_options)
        .filter((item, index, all) => all.findIndex((other) => other.packaging_id === item.packaging_id) === index);

    const openReview = (review: Review) => {
        setEditing(review);
        setSectionsOpen({ inquiry: true, configuration: true, decision: true });
        form.setData({
            status: review.status === 'pending' ? 'available' : review.status,
            suggested_variant_id: review.suggested_variant?.variant_id?.toString() ?? '',
            suggested_packaging_id: review.suggested_packaging?.packaging_id?.toString() ?? '',
            response_notes: review.response_notes ?? '',
        });
    };

    const submit = () =>
        editing &&
        form.patch(route('product-controller.requests.review', editing.product_request_review_id), {
            onSuccess: () => setEditing(null),
        });

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

                    {/* SIDEBAR DRAWER: Review / Respond to Inquiry (Right slide-over) */}
                    <Sheet open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
                        <SheetContent
                            side="right"
                            hideClose
                            className="flex h-full w-full flex-col justify-between overflow-hidden border-l border-border/70 bg-card p-0 shadow-2xl sm:max-w-xl md:max-w-2xl lg:max-w-3xl text-card-foreground"
                        >
                            <div
                                onScroll={handleDrawerScroll}
                                className={`p-6 pb-4 flex-1 overflow-y-auto drawer-scrollbar space-y-4 ${
                                    isScrolling ? 'is-scrolling' : ''
                                }`}
                            >
                                <SheetHeader className="space-y-1.5 text-left">
                                    <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
                                        Respond to inquiry #{editing?.inquiry.inquiry_id}
                                    </SheetTitle>
                                    <SheetDescription className="text-sm text-muted-foreground">
                                        Give Sales a clear availability decision before a quotation is prepared.
                                    </SheetDescription>
                                </SheetHeader>

                                {editing && (
                                    <div className="space-y-3 pt-2">
                                        {/* SECTION 1: Inquiry Details (Collapsible) */}
                                        <div className="rounded-xl border border-border/70 overflow-hidden bg-card shadow-xs">
                                            <button
                                                type="button"
                                                onClick={() => setSectionsOpen((s) => ({ ...s, inquiry: !s.inquiry }))}
                                                className="flex w-full items-center justify-between p-4 text-left font-semibold text-sm bg-muted/30 hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <User className="size-4 text-primary" />
                                                    <span className="text-foreground">Inquiry &amp; Customer Details</span>
                                                </div>
                                                <ChevronDown
                                                    className={`size-4 text-muted-foreground transition-transform duration-200 ${sectionsOpen.inquiry ? 'rotate-180' : ''
                                                        }`}
                                                />
                                            </button>

                                            {sectionsOpen.inquiry && (
                                                <div className="p-4 border-t border-border/60 space-y-4 animate-in fade-in-50 duration-150">
                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        <div className="space-y-2">
                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                                Customer Information
                                                            </h4>
                                                            <dl className="grid grid-cols-[6rem_1fr] gap-x-2 gap-y-1.5 text-xs">
                                                                <dt className="text-muted-foreground">Business</dt>
                                                                <dd className="font-semibold text-foreground">
                                                                    {detailValue(editing.inquiry.client?.business_name)}
                                                                </dd>
                                                                <dt className="text-muted-foreground">Contact</dt>
                                                                <dd className="text-foreground">
                                                                    {detailValue(editing.inquiry.client?.contact_person)}
                                                                </dd>
                                                                <dt className="text-muted-foreground">Email</dt>
                                                                <dd className="break-all text-foreground font-mono">
                                                                    {detailValue(editing.inquiry.client?.user?.email)}
                                                                </dd>
                                                                <dt className="text-muted-foreground">Type</dt>
                                                                <dd className="text-foreground">
                                                                    {detailValue(editing.inquiry.client?.business_type)}
                                                                </dd>
                                                                <dt className="text-muted-foreground">Address</dt>
                                                                <dd className="text-foreground">
                                                                    {detailValue(editing.inquiry.client?.business_address)}
                                                                </dd>
                                                            </dl>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                                Requested Product
                                                            </h4>
                                                            <dl className="grid grid-cols-[6rem_1fr] gap-x-2 gap-y-1.5 text-xs">
                                                                <dt className="text-muted-foreground">Product</dt>
                                                                <dd className="font-semibold text-primary">
                                                                    {editing.product_type?.name ?? 'Custom product request'}
                                                                </dd>
                                                                <dt className="text-muted-foreground">Submitted</dt>
                                                                <dd className="text-foreground font-mono">
                                                                    {editing.inquiry.created_at
                                                                        ? new Date(editing.inquiry.created_at).toLocaleDateString()
                                                                        : 'Not recorded'}
                                                                </dd>
                                                            </dl>
                                                            {editing.inquiry.message && (
                                                                <div className="mt-2 rounded-lg bg-muted/40 p-2.5">
                                                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                                                                        Inquiry message
                                                                    </p>
                                                                    <p className="mt-1 text-xs text-foreground whitespace-pre-wrap">
                                                                        {editing.inquiry.message}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* SECTION 2: Requested Configuration (Collapsible) */}
                                        <div className="rounded-xl border border-border/70 overflow-hidden bg-card shadow-xs">
                                            <button
                                                type="button"
                                                onClick={() => setSectionsOpen((s) => ({ ...s, configuration: !s.configuration }))}
                                                className="flex w-full items-center justify-between p-4 text-left font-semibold text-sm bg-muted/30 hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <Box className="size-4 text-primary" />
                                                    <span className="text-foreground">Requested Configuration</span>
                                                </div>
                                                <ChevronDown
                                                    className={`size-4 text-muted-foreground transition-transform duration-200 ${sectionsOpen.configuration ? 'rotate-180' : ''
                                                        }`}
                                                />
                                            </button>

                                            {sectionsOpen.configuration && (
                                                <div className="p-4 border-t border-border/60 space-y-3 animate-in fade-in-50 duration-150">
                                                    {editing.inquiry.customizations.length === 0 ? (
                                                        <p className="text-xs text-muted-foreground py-2">No configuration details were submitted.</p>
                                                    ) : (
                                                        editing.inquiry.customizations.map((customization, index) => {
                                                            const parsedCustomerNotes = parseDelimitedNotes(customization.client_notes);
                                                            return (
                                                                <div
                                                                    key={customization.customization_id}
                                                                    className="rounded-xl border border-border/80 bg-background/50 p-4 shadow-2xs space-y-3.5"
                                                                >
                                                                    {/* Header with badge */}
                                                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                                                                                {index + 1}
                                                                            </span>
                                                                            <h5 className="text-sm font-bold text-foreground">
                                                                                Configuration {index + 1}: {detailValue(customization.customization_type)}
                                                                            </h5>
                                                                        </div>
                                                                        {customization.selected_package && (
                                                                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800">
                                                                                {customization.selected_package}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* 4-Item Specifications Grid */}
                                                                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                                                        <div className="rounded-lg border border-border/60 bg-card p-3 shadow-2xs">
                                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Package</p>
                                                                            <p className="mt-1 text-xs font-semibold text-foreground capitalize">
                                                                                {detailValue(customization.selected_package)}
                                                                            </p>
                                                                        </div>
                                                                        <div className="rounded-lg border border-border/60 bg-card p-3 shadow-2xs">
                                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Packaging</p>
                                                                            <p className="mt-1 text-xs font-semibold text-foreground">
                                                                                {detailValue(customization.packaging_type)}
                                                                            </p>
                                                                        </div>
                                                                        <div className="rounded-lg border border-border/60 bg-card p-3 shadow-2xs">
                                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Finish</p>
                                                                            <p className="mt-1 text-xs font-semibold text-foreground">
                                                                                {detailValue(customization.packaging_finish)}
                                                                            </p>
                                                                        </div>
                                                                        <div className="rounded-lg border border-border/60 bg-card p-3 shadow-2xs">
                                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Serving Size / Dim</p>
                                                                            <p className="mt-1 text-xs font-semibold text-foreground">
                                                                                {detailValue(customization.serving_size)}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Formulation requirements */}
                                                                    {customization.formulation_notes && (
                                                                        <div className="rounded-lg border border-border/60 bg-card p-3.5 space-y-1">
                                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                                                Formulation Requirements
                                                                            </p>
                                                                            <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                                                                                {customization.formulation_notes}
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    {/* Customer instructions / breakdown */}
                                                                    {customization.client_notes && (
                                                                        <div className="rounded-lg border border-border/60 bg-card p-3.5 space-y-2.5">
                                                                            <div className="flex items-center justify-between">
                                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                                                    Customer Instructions &amp; Specifications
                                                                                </p>
                                                                                {parsedCustomerNotes && (
                                                                                    <span className="text-[10px] font-mono text-muted-foreground">
                                                                                        {parsedCustomerNotes.length} fields
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            {parsedCustomerNotes ? (
                                                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-1">
                                                                                    {parsedCustomerNotes
                                                                                        .filter((item) => item.label?.toLowerCase() !== 'package terms')
                                                                                        .map((item, idx) => (
                                                                                        <div
                                                                                            key={idx}
                                                                                            className="flex flex-col rounded-md border border-border/50 bg-muted/20 px-3 py-2"
                                                                                        >
                                                                                            {item.label && (
                                                                                                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                                                                                    {item.label}
                                                                                                </span>
                                                                                            )}
                                                                                            <span className="text-xs font-medium text-foreground">
                                                                                                {item.value}
                                                                                            </span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            ) : (
                                                                                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                                                                                    {customization.client_notes}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {/* Requested ingredient note */}
                                                                    {customization.requested_ingredient_note && (
                                                                        <div className="rounded-lg border border-border/60 bg-card p-3.5 space-y-1">
                                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                                                Requested Ingredient / Desired Effect
                                                                            </p>
                                                                            <p className="text-xs text-foreground whitespace-pre-wrap">
                                                                                {customization.requested_ingredient_note}
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    {/* Design File / Artwork */}
                                                                    {customization.design_file_path && (
                                                                        <div className="pt-1">
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

                                                    {editing.request_notes && (
                                                        <div className="mt-3 rounded-lg border border-border/70 bg-amber-50/30 dark:bg-amber-950/20 p-3">
                                                            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                                                Sales notes
                                                            </p>
                                                            <p className="mt-1 text-xs text-foreground whitespace-pre-wrap">{editing.request_notes}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* SECTION 3: Availability Decision & Response (Collapsible) */}
                                        <div className="rounded-xl border border-border/70 overflow-hidden bg-card shadow-xs">
                                            <button
                                                type="button"
                                                onClick={() => setSectionsOpen((s) => ({ ...s, decision: !s.decision }))}
                                                className="flex w-full items-center justify-between p-4 text-left font-semibold text-sm bg-muted/30 hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <CheckCircle2 className="size-4 text-primary" />
                                                    <span className="text-foreground">Availability Decision &amp; Response</span>
                                                </div>
                                                <ChevronDown
                                                    className={`size-4 text-muted-foreground transition-transform duration-200 ${sectionsOpen.decision ? 'rotate-180' : ''
                                                        }`}
                                                />
                                            </button>

                                            {sectionsOpen.decision && (
                                                <div className="p-4 border-t border-border/60 space-y-4 animate-in fade-in-50 duration-150">
                                                    <div className="space-y-4">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs font-semibold text-foreground">
                                                                Availability decision <span className="text-destructive">*</span>
                                                            </Label>
                                                            <Select value={form.data.status} onValueChange={(value) => form.setData('status', value)}>
                                                                <SelectTrigger className="h-10 rounded-lg border-input/80 text-xs shadow-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="z-[90]">
                                                                    <SelectItem value="available">Available as requested</SelectItem>
                                                                    <SelectItem value="alternative">Offer an alternative</SelectItem>
                                                                    <SelectItem value="unavailable">Unavailable</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            {form.errors.status && <p className="text-destructive text-xs">{form.errors.status}</p>}
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs font-semibold text-foreground">
                                                                Response to Sales
                                                            </Label>
                                                            <textarea
                                                                rows={4}
                                                                className="w-full rounded-lg border border-input/80 bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                                                value={form.data.response_notes}
                                                                onChange={(e) => form.setData('response_notes', e.target.value)}
                                                                placeholder="State availability, limits, or why the alternative is recommended."
                                                            />
                                                            {form.errors.response_notes && <p className="text-destructive text-xs">{form.errors.response_notes}</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 border-t border-border/60 bg-muted/20 px-6 py-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditing(null)}
                                    className="h-10 rounded-lg border-border/80 bg-background px-5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={submit}
                                    disabled={form.processing}
                                    className="h-10 rounded-lg bg-blue-600 hover:bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
                                >
                                    {form.processing ? 'Sending...' : 'Send response'}
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </main>
        </AppLayout>
    );
}
