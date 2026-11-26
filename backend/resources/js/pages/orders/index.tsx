import { alertModal, confirmModal, showProductionShortageModal } from '@/lib/sweetalert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    FileCheck,
    FileText,
    Layers,
    Mail,
    MapPin,
    Package,
    PackageCheck,
    Search,
    Sparkles,
    Truck,
    User,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Orders', href: '/orders' }];

interface BusinessClient {
    client_id: number;
    business_name: string;
    contact_person: string;
    business_type?: string | null;
    business_address?: string | null;
    user?: { email: string } | null;
}

interface Customization {
    customization_id: number;
    customization_type?: string | null;
    packaging_type?: string | null;
    packaging_finish?: string | null;
    serving_size?: string | null;
    formulation_notes?: string | null;
    selected_package?: string | null;
    requested_ingredient_note?: string | null;
    design_file_path?: string | null;
}

interface Quotation {
    quotation_id: number;
    inquiry_id?: number | null;
    total_amount: string;
    item_details?: string | null;
    product_specification?: any;
    status: string;
    valid_until?: string | null;
    payment_method?: string | null;
    payment_proof_url?: string | null;
    inquiry?: {
        inquiry_id: number;
        created_at?: string;
        customizations?: Customization[];
    } | null;
}

interface OrderItem {
    order_item_id?: number;
    quantity: number;
    unit_price: string;
    product?: {
        name: string;
        sku?: string;
        unit_of_measure?: string;
    } | null;
}

interface Order {
    order_id: number;
    status: OrderStatus;
    total_amount: string;
    initial_payment_amount?: string | number | null;
    initial_payment_verified_at?: string | null;
    balance_payment_amount?: string | number | null;
    balance_payment_verified_at?: string | null;
    created_at: string;
    courier_name: string | null;
    courier_tracking_number: string | null;
    client: BusinessClient | null;
    quotation: Quotation | null;
    items?: OrderItem[];
}

interface Props {
    orders: Order[];
}

const ORDER_STATUSES = ['approved', 'in_production', 'ready_for_pickup', 'completed', 'cancelled'] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

// The dropdown is only for progressing an order through its normal
// lifecycle. Cancelling is destructive and handled by its own button +
// confirmation dialog below, so it's deliberately left out of this list.
const SELECTABLE_STATUSES = ORDER_STATUSES.filter((s) => s !== 'cancelled');

const STATUS_FILTER_OPTIONS = ['all', ...ORDER_STATUSES] as const;
type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number];

function getStatusBadge(status: OrderStatus) {
    switch (status) {
        case 'approved':
            return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300';
        case 'in_production':
            return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300';
        case 'ready_for_pickup':
            return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
        case 'completed':
            return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
        case 'cancelled':
            return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
    }
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function formatAmount(amount: string) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(amount));
}

function parseCustomerInstructions(raw: string) {
    if (!raw) return null;
    if (raw.includes('|')) {
        const pairs: { label: string; value: string }[] = [];
        raw.split('|').forEach((part) => {
            const idx = part.indexOf(':');
            if (idx > -1) {
                const label = part.slice(0, idx).trim();
                const value = part.slice(idx + 1).trim();
                if (label && value) pairs.push({ label, value });
            }
        });
        if (pairs.length > 0) return pairs;
    }
    return null;
}

interface OrderRowProps {
    order: Order;
    updatingId: number | null;
    onUpdateStatus: (orderId: number, status: OrderStatus) => void;
    onRequestCancel: (order: Order) => void;
    onTrackingUpdate: (orderId: number, field: 'courier_name' | 'courier_tracking_number', value: string) => void;
    onViewOrder: (order: Order) => void;
}

function OrderRow({ order, updatingId, onUpdateStatus, onRequestCancel, onTrackingUpdate, onViewOrder }: OrderRowProps) {
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);

    // Keep the dropdown in sync once the server confirms a status change
    useEffect(() => {
        setSelectedStatus(order.status);
    }, [order.status]);

    const isUpdating = updatingId === order.order_id;
    const isFinal = order.status === 'cancelled' || order.status === 'completed';
    const options = SELECTABLE_STATUSES.includes(order.status as (typeof SELECTABLE_STATUSES)[number])
        ? SELECTABLE_STATUSES
        : [order.status, ...SELECTABLE_STATUSES];

    return (
        <tr
            onClick={() => onViewOrder(order)}
            className="group bg-card shadow-sm transition-shadow hover:shadow-md cursor-pointer"
        >
            {/* Order # */}
            <td className="w-[110px] rounded-l-xl border-y border-l border-border/70 p-5 align-middle">
                <span className="font-mono text-base font-bold text-foreground">#{order.order_id}</span>
            </td>

            {/* Client */}
            <td className="min-w-[200px] border-y border-border/70 p-5 align-middle">
                <p className="text-base font-bold text-foreground">{order.client?.business_name ?? '—'}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{order.client?.contact_person ?? ''}</p>
            </td>

            {/* Quote # */}
            <td className="w-[120px] border-y border-border/70 p-5 align-middle">
                <span className="font-mono text-base font-bold text-foreground">
                    {order.quotation ? `#${order.quotation.quotation_id}` : '—'}
                </span>
            </td>

            {/* Total */}
            <td className="w-[140px] border-y border-border/70 p-5 align-middle">
                <span className="text-sm font-bold text-foreground">{formatAmount(order.total_amount)}</span>
            </td>

            {/* Date */}
            <td className="w-[130px] border-y border-border/70 p-5 align-middle text-xs text-muted-foreground font-medium">
                {formatDate(order.created_at)}
            </td>

            {/* Status */}
            <td className="w-[150px] border-y border-border/70 p-5 align-middle">
                <span className={cn('inline-flex items-center rounded-full px-3.5 py-1 text-sm font-semibold capitalize', getStatusBadge(order.status))}>
                    {order.status.replace(/_/g, ' ')}
                </span>
            </td>

            {/* Update Status */}
            <td className="w-[230px] border-y border-border/70 p-5 align-middle" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select
                            value={selectedStatus}
                            disabled={isUpdating || isFinal}
                            onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                            className="h-8 appearance-none rounded-lg border border-input/80 bg-muted/20 px-3 pr-7 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 capitalize"
                        >
                            {options.map((s) => (
                                <option key={s} value={s} className="capitalize">
                                    {s.replace(/_/g, ' ')}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={isUpdating || isFinal || selectedStatus === order.status}
                        onClick={() => onUpdateStatus(order.order_id, selectedStatus)}
                        className="h-8 rounded-lg border-border/80 bg-card px-3 text-xs font-semibold text-foreground shadow-sm hover:bg-muted disabled:opacity-50"
                    >
                        {isUpdating ? 'Updating…' : 'Update'}
                    </Button>
                </div>
                {!isFinal && (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="mt-1.5 h-6 px-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/30"
                        disabled={isUpdating}
                        onClick={() => onRequestCancel(order)}
                    >
                        Cancel Order
                    </Button>
                )}
            </td>

            {/* Delivery Tracking */}
            <td className="w-[230px] rounded-r-xl border-y border-r border-border/70 p-5 align-middle" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col gap-1.5 min-w-[180px]">
                    <input
                        type="text"
                        maxLength={100}
                        placeholder="Courier (e.g. J&T)"
                        defaultValue={order.courier_name ?? ''}
                        onBlur={(e) => onTrackingUpdate(order.order_id, 'courier_name', e.target.value.trim())}
                        className="h-7 w-full rounded-md border border-input/80 bg-muted/20 px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                        type="text"
                        maxLength={100}
                        placeholder="Tracking number"
                        defaultValue={order.courier_tracking_number ?? ''}
                        onBlur={(e) => onTrackingUpdate(order.order_id, 'courier_tracking_number', e.target.value.trim())}
                        className="h-7 w-full rounded-md border border-input/80 bg-muted/20 px-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
            </td>
        </tr>
    );
}

export default function OrdersIndex({ orders }: Props) {
    const { flash, errors } = usePage().props as any;
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
    const [cancelConfirmText, setCancelConfirmText] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

    // Auto-hiding scrollbar on the drawer
    const [isDrawerScrolling, setIsDrawerScrolling] = useState(false);
    const drawerScrollTimer = useRef<number | null>(null);

    const handleDrawerScroll = () => {
        setIsDrawerScrolling(true);
        if (drawerScrollTimer.current) window.clearTimeout(drawerScrollTimer.current);
        drawerScrollTimer.current = window.setTimeout(() => {
            setIsDrawerScrolling(false);
        }, 180);
    };

    function showOrderErrorModal(errorMsg: string) {
        if (
            errorMsg.toLowerCase().includes('insufficient') ||
            errorMsg.includes('Required:') ||
            errorMsg.toLowerCase().includes('raw materials')
        ) {
            showProductionShortageModal(errorMsg);
        } else {
            alertModal({
                title: 'Cannot Start Production',
                text: errorMsg,
                icon: 'error',
                confirmButtonText: 'Understood',
            });
        }
    }

    const lastErrorRef = useRef<string | null>(null);
    useEffect(() => {
        const errorMsg = flash?.error || errors?.inventory || errors?.error;
        if (errorMsg && errorMsg !== lastErrorRef.current) {
            lastErrorRef.current = errorMsg;
            showOrderErrorModal(errorMsg);
        }
    }, [flash?.error, errors?.inventory, errors?.error]);

    async function handleUpdateStatus(orderId: number, newStatus: OrderStatus) {
        const isProd = newStatus === 'in_production';
        const statusLabel = newStatus.replace(/_/g, ' ');
        const formattedLabel = statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1);

        const confirmed = await confirmModal({
            title: isProd ? `Start Production for Order #${orderId}?` : `Update Order #${orderId}?`,
            text: isProd
                ? `Change status to "In Production"? This will check and deduct the required raw materials from inventory.`
                : `Update order #${orderId} status to "${formattedLabel}"?`,
            confirmButtonText: isProd ? 'Start Production' : 'Update Status',
            cancelButtonText: 'Cancel',
            icon: 'question',
        });

        if (!confirmed) return;

        setUpdatingId(orderId);
        router.patch(
            route('orders.update-status', orderId),
            { status: newStatus },
            {
                preserveScroll: true,
                onFinish: () => setUpdatingId(null),
                onError: (errs) => {
                    const message = errs.inventory || errs.error || Object.values(errs).join(' ') || 'Could not update order status.';
                    showOrderErrorModal(message);
                },
                onSuccess: (page: any) => {
                    if (page.props?.flash?.error) {
                        showOrderErrorModal(page.props.flash.error);
                    } else if (page.props?.flash?.success) {
                        alertModal({
                            title: 'Status Updated',
                            text: page.props.flash.success,
                            icon: 'success',
                            confirmButtonText: 'OK',
                        });
                    }
                },
            },
        );
    }

    function handleTrackingUpdate(orderId: number, field: 'courier_name' | 'courier_tracking_number', value: string) {
        router.patch(
            route('orders.update-tracking', orderId),
            { [field]: value },
            { preserveScroll: true },
        );
    }

    function requestCancel(order: Order) {
        setCancelConfirmText('');
        setCancelTarget(order);
    }

    function confirmCancel() {
        if (!cancelTarget) return;
        setUpdatingId(cancelTarget.order_id);
        router.patch(
            route('orders.update-status', cancelTarget.order_id),
            { status: 'cancelled' },
            {
                onFinish: () => {
                    setUpdatingId(null);
                    setCancelTarget(null);
                    setCancelConfirmText('');
                },
            },
        );
    }

    const cancelInputMatches = cancelTarget !== null && cancelConfirmText.trim() === String(cancelTarget.order_id);

    const counts = ORDER_STATUSES.reduce(
        (acc, s) => ({ ...acc, [s]: orders.filter((o) => o.status === s).length }),
        {} as Record<OrderStatus, number>,
    );

    const filteredOrders = useMemo(() => {
        const term = search.trim().toLowerCase();

        return orders.filter((order) => {
            if (statusFilter !== 'all' && order.status !== statusFilter) return false;
            if (!term) return true;

            return (
                String(order.order_id).includes(term) ||
                (order.quotation ? String(order.quotation.quotation_id).includes(term) : false) ||
                (order.client?.business_name.toLowerCase().includes(term) ?? false) ||
                (order.client?.contact_person.toLowerCase().includes(term) ?? false) ||
                (order.courier_name?.toLowerCase().includes(term) ?? false) ||
                (order.courier_tracking_number?.toLowerCase().includes(term) ?? false)
            );
        });
    }, [orders, search, statusFilter]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Orders" />

            <div className="bmanny-page">
                <div className="bmanny-page-inner space-y-5">
                    {/* Header Banner */}
                    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="border-l-4 border-amber-400 pl-3.5">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Order Operations</p>
                            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">ORDERS</h1>
                            <p className="text-xs text-muted-foreground sm:text-sm">
                                Manage production and delivery status for all orders
                            </p>
                        </div>
                    </header>

                    {/* Flash Messages */}
                    {flash?.success && (
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                            {flash.success}
                        </div>
                    )}

                    {/* Metric Summary Cards */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                        {[
                            {
                                label: 'Approved',
                                value: counts.approved,
                                description: 'Orders confirmed by client',
                                icon: CheckCircle2,
                            },
                            {
                                label: 'In Production',
                                value: counts.in_production,
                                description: 'Currently being manufactured',
                                icon: Layers,
                            },
                            {
                                label: 'Ready for Pickup',
                                value: counts.ready_for_pickup,
                                description: 'Packed & ready for dispatch',
                                icon: PackageCheck,
                            },
                            {
                                label: 'Completed',
                                value: counts.completed,
                                description: 'Delivered & fulfilled',
                                icon: Sparkles,
                            },
                            {
                                label: 'Cancelled',
                                value: counts.cancelled,
                                description: 'Terminated orders',
                                icon: XCircle,
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
                    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card px-5 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-foreground">
                            {filteredOrders.length}/{orders.length} Orders
                        </p>
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search client, order #, tracking…"
                                    className="h-9 w-full rounded-lg border border-input/80 bg-muted/20 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-80"
                                />
                            </div>
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                    className="h-9 w-full appearance-none rounded-lg border border-input/80 bg-muted/20 px-3 pr-8 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-auto capitalize"
                                >
                                    {STATUS_FILTER_OPTIONS.map((s) => (
                                        <option key={s} value={s} className="capitalize">
                                            {s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            </div>
                        </div>
                    </div>

                    {/* Orders Table / Card Rows */}
                    {filteredOrders.length === 0 ? (
                        <div className="rounded-xl border border-border/70 bg-card py-16 text-center text-muted-foreground shadow-sm">
                            <PackageCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                            <h2 className="text-base font-semibold text-foreground">No orders found</h2>
                            <p className="mt-1 text-xs">
                                {orders.length === 0 ? 'No orders yet.' : 'No orders match your search or filter.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px] border-separate border-spacing-y-2.5 text-left text-sm">
                                <thead>
                                    <tr>
                                        <th className="w-[110px] px-5 py-3 text-sm font-bold text-foreground">Order #</th>
                                        <th className="min-w-[200px] px-5 py-3 text-sm font-bold text-foreground">Client</th>
                                        <th className="w-[120px] px-5 py-3 text-sm font-bold text-foreground">Quote #</th>
                                        <th className="w-[140px] px-5 py-3 text-sm font-bold text-foreground">Total</th>
                                        <th className="w-[130px] px-5 py-3 text-sm font-bold text-foreground">Date</th>
                                        <th className="w-[150px] px-5 py-3 text-sm font-bold text-foreground">Status</th>
                                        <th className="w-[230px] px-5 py-3 text-sm font-bold text-foreground">Update Status</th>
                                        <th className="w-[230px] px-5 py-3 text-sm font-bold text-foreground">Delivery Tracking</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map((order) => (
                                        <OrderRow
                                            key={order.order_id}
                                            order={order}
                                            updatingId={updatingId}
                                            onUpdateStatus={handleUpdateStatus}
                                            onRequestCancel={requestCancel}
                                            onTrackingUpdate={handleTrackingUpdate}
                                            onViewOrder={setViewingOrder}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* SIDEBAR DRAWER: View Quoted Order Details (Right slide-over) */}
            <Sheet open={Boolean(viewingOrder)} onOpenChange={(open) => !open && setViewingOrder(null)}>
                <SheetContent
                    side="right"
                    hideClose
                    className="flex h-full w-full flex-col justify-between overflow-hidden border-l border-border/70 bg-card p-0 shadow-2xl sm:max-w-xl md:max-w-2xl lg:max-w-3xl text-card-foreground"
                >
                    <div
                        onScroll={handleDrawerScroll}
                        className={`p-6 pb-4 flex-1 overflow-y-auto drawer-scrollbar space-y-5 ${isDrawerScrolling ? 'is-scrolling' : ''
                            }`}
                    >
                        {viewingOrder && (
                            <>
                                <SheetHeader className="space-y-1.5 text-left">
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                                            Order #{viewingOrder.order_id}
                                        </span>
                                        <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize', getStatusBadge(viewingOrder.status))}>
                                            {viewingOrder.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <SheetTitle className="text-xl font-black uppercase tracking-tight text-foreground">
                                        QUOTED PRODUCTION SPECIFICATIONS
                                    </SheetTitle>
                                    <SheetDescription className="text-xs text-muted-foreground">
                                        Quotation details, formulation instructions, and packaging specifications for manufacturing.
                                    </SheetDescription>
                                </SheetHeader>

                                {/* Order & Client Summary Card */}
                                <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Client Information</p>
                                            <p className="mt-1 text-sm font-bold text-foreground">{viewingOrder.client?.business_name ?? '—'}</p>
                                            <p className="text-xs text-muted-foreground">{viewingOrder.client?.contact_person ?? ''}</p>
                                            {viewingOrder.client?.user?.email && (
                                                <p className="text-xs font-mono text-muted-foreground">{viewingOrder.client.user.email}</p>
                                            )}
                                            {viewingOrder.client?.business_address && (
                                                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                                                    <MapPin className="size-3 shrink-0" /> {viewingOrder.client.business_address}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Order &amp; Quotation Reference</p>
                                            <p className="mt-1 text-xs text-foreground">
                                                <span className="text-muted-foreground">Quotation: </span>
                                                <span className="font-mono font-bold text-primary">
                                                    {viewingOrder.quotation ? `#${viewingOrder.quotation.quotation_id}` : 'None'}
                                                </span>
                                            </p>
                                            <p className="text-xs text-foreground">
                                                <span className="text-muted-foreground">Total Quoted: </span>
                                                <span className="font-bold text-foreground">{formatAmount(viewingOrder.total_amount)}</span>
                                            </p>
                                            {viewingOrder.initial_payment_amount != null && (
                                                <p className="text-xs text-foreground">
                                                    <span className="text-muted-foreground">Before Production: </span>
                                                    <span className="font-semibold text-foreground">{formatAmount(String(viewingOrder.initial_payment_amount))}</span>
                                                    {viewingOrder.initial_payment_verified_at ? (
                                                        <span className="ml-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">(Verified)</span>
                                                    ) : null}
                                                </p>
                                            )}
                                            {viewingOrder.balance_payment_amount != null && (
                                                <p className="text-xs text-foreground">
                                                    <span className="text-muted-foreground">Before Pickup: </span>
                                                    <span className="font-semibold text-foreground">{formatAmount(String(viewingOrder.balance_payment_amount))}</span>
                                                    {viewingOrder.balance_payment_verified_at ? (
                                                        <span className="ml-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">(Verified)</span>
                                                    ) : (
                                                        <span className="ml-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">(Pending)</span>
                                                    )}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                <span>Date Placed: </span>
                                                <span className="font-mono">{formatDate(viewingOrder.created_at)}</span>
                                            </p>
                                            {viewingOrder.courier_name && (
                                                <p className="mt-1 text-xs text-foreground flex items-center gap-1">
                                                    <Truck className="size-3 text-muted-foreground shrink-0" />
                                                    <span>{viewingOrder.courier_name}</span>
                                                    {viewingOrder.courier_tracking_number && (
                                                        <span className="font-mono text-muted-foreground">({viewingOrder.courier_tracking_number})</span>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Quoted Item Details & Production Notes */}
                                <div className="rounded-xl border border-border/70 bg-card p-4 space-y-2 shadow-xs">
                                    <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
                                        <FileText className="size-4 text-primary" />
                                        <h3 className="text-sm font-bold text-foreground">Quoted Item Details &amp; Commercial Terms</h3>
                                    </div>
                                    {viewingOrder.quotation?.item_details ? (
                                        <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-muted/40 p-3.5 font-mono text-xs leading-relaxed text-foreground border border-input/60">
                                            {viewingOrder.quotation.item_details}
                                        </pre>
                                    ) : (
                                        <p className="py-2 text-xs italic text-muted-foreground">
                                            No item details text was included in this quotation.
                                        </p>
                                    )}
                                </div>

                                {/* Inquiry Customization Specs (if available) */}
                                {viewingOrder.quotation?.inquiry?.customizations && viewingOrder.quotation.inquiry.customizations.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Layers className="size-4 text-primary" />
                                            <h3 className="text-sm font-bold text-foreground">Package &amp; Formulation Specifications</h3>
                                        </div>
                                        {viewingOrder.quotation.inquiry.customizations.map((c, idx) => {
                                            const instructions = parseCustomerInstructions(c.formulation_notes ?? '');
                                            return (
                                                <div key={c.customization_id || idx} className="rounded-xl border border-border/70 bg-card p-4 shadow-xs space-y-3">
                                                    <p className="text-xs font-bold text-primary uppercase tracking-wide">
                                                        Specification #{idx + 1}: {c.selected_package ?? c.packaging_type ?? 'Custom Package'}
                                                    </p>

                                                    <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                                                        <div className="rounded-lg bg-muted/30 p-2.5">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Package</p>
                                                            <p className="mt-0.5 font-semibold text-foreground">{c.selected_package ?? 'Standard'}</p>
                                                        </div>
                                                        <div className="rounded-lg bg-muted/30 p-2.5">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Packaging Type</p>
                                                            <p className="mt-0.5 font-semibold text-foreground">{c.packaging_type ?? '—'}</p>
                                                        </div>
                                                        <div className="rounded-lg bg-muted/30 p-2.5">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Finish</p>
                                                            <p className="mt-0.5 font-semibold text-foreground">{c.packaging_finish ?? '—'}</p>
                                                        </div>
                                                        <div className="rounded-lg bg-muted/30 p-2.5">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Serving Size</p>
                                                            <p className="mt-0.5 font-semibold text-foreground">{c.serving_size ?? '—'}</p>
                                                        </div>
                                                    </div>

                                                    {instructions ? (
                                                        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                                                            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                                Customer Instructions Breakdown
                                                            </p>
                                                            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 text-xs">
                                                                {instructions.map((item, pIdx) => (
                                                                    <div key={pIdx} className="flex flex-col">
                                                                        <span className="text-[11px] font-semibold text-muted-foreground">{item.label}</span>
                                                                        <span className="font-medium text-foreground">{item.value}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : c.formulation_notes ? (
                                                        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                                                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                                Formulation Notes
                                                            </p>
                                                            <p className="text-xs text-foreground whitespace-pre-wrap">{c.formulation_notes}</p>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Ordered Items List (if present) */}
                                {viewingOrder.items && viewingOrder.items.length > 0 && (
                                    <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3 shadow-xs">
                                        <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
                                            <Package className="size-4 text-primary" />
                                            <h3 className="text-sm font-bold text-foreground">Manufactured Items</h3>
                                        </div>
                                        <div className="space-y-2">
                                            {viewingOrder.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between rounded-lg bg-muted/25 px-3 py-2 text-xs">
                                                    <div>
                                                        <p className="font-bold text-foreground">{item.product?.name ?? 'Product'}</p>
                                                        {item.product?.sku && (
                                                            <p className="font-mono text-[11px] text-muted-foreground">SKU: {item.product.sku}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-foreground">
                                                            {item.quantity} {item.product?.unit_of_measure ?? 'units'}
                                                        </p>
                                                        <p className="font-mono text-[11px] text-muted-foreground">
                                                            @ {formatAmount(item.unit_price)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Drawer Footer */}
                    <div className="border-t border-border/70 bg-card p-4 flex items-center justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setViewingOrder(null)}
                            className="h-9 rounded-lg border-border/80 bg-card px-5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted"
                        >
                            Close
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Cancel confirmation dialog - requires typing the order number
                as an extra safety precaution before a cancellation goes through. */}
            <Dialog open={cancelTarget !== null} onOpenChange={(open) => !open && setCancelTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Order #{cancelTarget?.order_id}?</DialogTitle>
                        <DialogDescription>
                            This will mark the order for {cancelTarget?.client?.business_name ?? 'this client'} as cancelled.
                            This action cannot be undone from this screen. To confirm, type the order number{' '}
                            <span className="font-mono font-semibold text-foreground">{cancelTarget?.order_id}</span> below.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-1.5">
                        <Input
                            autoFocus
                            placeholder={`Type ${cancelTarget?.order_id ?? ''} to confirm`}
                            value={cancelConfirmText}
                            onChange={(e) => setCancelConfirmText(e.target.value)}
                        />
                        {cancelConfirmText.length > 0 && (
                            <p className="flex items-center gap-1 text-xs font-medium text-foreground">
                                {cancelInputMatches ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                                {cancelInputMatches
                                    ? `Order #${cancelTarget?.order_id} confirmed`
                                    : `Enter exact order number (${cancelTarget?.order_id})`}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelTarget(null)}>
                            Keep Order
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={!cancelInputMatches || updatingId === cancelTarget?.order_id}
                            onClick={confirmCancel}
                        >
                            {updatingId === cancelTarget?.order_id ? 'Cancelling…' : 'Cancel Order'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
