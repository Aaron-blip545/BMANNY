import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { PackageCheck, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Orders', href: '/orders' }];

interface BusinessClient {
    client_id: number;
    business_name: string;
    contact_person: string;
}

interface Order {
    order_id: number;
    status: OrderStatus;
    total_amount: string;
    created_at: string;
    courier_name: string | null;
    courier_tracking_number: string | null;
    client: BusinessClient | null;
    quotation: { quotation_id: number } | null;
}

interface Props {
    orders: Order[];
}

const ORDER_STATUSES = ['pending', 'approved', 'in_production', 'packed', 'for_delivery', 'delivered', 'completed', 'cancelled'] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

// The dropdown is only for progressing an order through its normal
// lifecycle. Cancelling is destructive and handled by its own button +
// confirmation dialog below, so it's deliberately left out of this list.
const SELECTABLE_STATUSES = ORDER_STATUSES.filter((s) => s !== 'cancelled');

const STATUS_FILTER_OPTIONS = ['all', ...ORDER_STATUSES] as const;
type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number];

const STATUS_STYLES: Record<OrderStatus, string> = {
    pending: 'bg-muted text-muted-foreground',
    approved: 'bg-muted text-muted-foreground',
    in_production: 'bg-muted text-muted-foreground',
    packed: 'bg-muted text-muted-foreground',
    for_delivery: 'bg-muted text-muted-foreground',
    delivered: 'bg-muted text-muted-foreground',
    completed: 'bg-muted text-muted-foreground',
    cancelled: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300',
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-PH', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

function formatAmount(amount: string) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(amount));
}

interface OrderRowProps {
    order: Order;
    updatingId: number | null;
    onUpdateStatus: (orderId: number, status: OrderStatus) => void;
    onRequestCancel: (order: Order) => void;
    onTrackingUpdate: (orderId: number, field: 'courier_name' | 'courier_tracking_number', value: string) => void;
}

function OrderRow({ order, updatingId, onUpdateStatus, onRequestCancel, onTrackingUpdate }: OrderRowProps) {
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);

    // Keep the dropdown in sync once the server confirms a status change
    // (Inertia re-renders this row with the new `order.status` prop).
    useEffect(() => {
        setSelectedStatus(order.status);
    }, [order.status]);

    const isUpdating = updatingId === order.order_id;
    const isFinal = order.status === 'cancelled' || order.status === 'completed';
    // If the order somehow already has a status outside the selectable
    // list (e.g. it's already cancelled), still show it so the dropdown
    // doesn't silently jump to a different value.
    const options = SELECTABLE_STATUSES.includes(order.status as (typeof SELECTABLE_STATUSES)[number])
        ? SELECTABLE_STATUSES
        : [order.status, ...SELECTABLE_STATUSES];

    return (
        <tr className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/50">
            <td className="p-4 font-mono text-xs text-muted-foreground">#{order.order_id}</td>
            <td className="p-4">
                <div className="font-medium">{order.client?.business_name ?? '—'}</div>
                <div className="text-xs text-muted-foreground">{order.client?.contact_person ?? ''}</div>
            </td>
            <td className="p-4 text-muted-foreground font-mono text-xs">
                {order.quotation ? `#${order.quotation.quotation_id}` : '—'}
            </td>
            <td className="p-4 font-medium">{formatAmount(order.total_amount)}</td>
            <td className="p-4 text-muted-foreground text-xs">{formatDate(order.created_at)}</td>
            <td className="p-4">
                <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[order.status] ?? ''}`}>
                    {order.status}
                </span>
            </td>
            <td className="p-4">
                <div className="flex items-center gap-2">
                    <select
                        value={selectedStatus}
                        disabled={isUpdating || isFinal}
                        onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                        className="rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    >
                        {options.map((s) => (
                            <option key={s} value={s} className="capitalize">
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                        ))}
                    </select>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={isUpdating || isFinal || selectedStatus === order.status}
                        onClick={() => onUpdateStatus(order.order_id, selectedStatus)}
                    >
                        Update
                    </Button>
                </div>
                {!isFinal && (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="mt-1 h-7 px-2 text-xs text-destructive hover:text-destructive"
                        disabled={isUpdating}
                        onClick={() => onRequestCancel(order)}
                    >
                        Cancel Order
                    </Button>
                )}
            </td>
            <td className="p-4">
                <div className="flex flex-col gap-1">
                    <input
                        type="text"
                        placeholder="Courier (e.g. J&T)"
                        defaultValue={order.courier_name ?? ''}
                        onBlur={(e) => onTrackingUpdate(order.order_id, 'courier_name', e.target.value)}
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground"
                    />
                    <input
                        type="text"
                        placeholder="Tracking number"
                        defaultValue={order.courier_tracking_number ?? ''}
                        onBlur={(e) => onTrackingUpdate(order.order_id, 'courier_tracking_number', e.target.value)}
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground"
                    />
                </div>
            </td>
        </tr>
    );
}

export default function OrdersIndex({ orders }: Props) {
    const { flash } = usePage().props as any;
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
    const [cancelConfirmText, setCancelConfirmText] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    function handleUpdateStatus(orderId: number, newStatus: OrderStatus) {
        if (!confirm(`Update order #${orderId} status to "${newStatus}"?`)) return;
        setUpdatingId(orderId);
        router.patch(
            route('orders.update-status', orderId),
            { status: newStatus },
            { onFinish: () => setUpdatingId(null) },
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

            <div className="bg-background p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage production and delivery status for all orders.
                    </p>
                </div>

                {/* Flash */}
                {flash?.success && (
                    <div className="mb-4 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground">
                        {flash.success}
                    </div>
                )}

                {/* Stats */}
                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {ORDER_STATUSES.map((s) => (
                        <Card key={s} className="rounded-xl border-border bg-card shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-xs font-medium capitalize text-muted-foreground">{s.replace('_', ' ')}</p>
                                <p className="mt-1 text-2xl font-semibold tracking-tight text-card-foreground">
                                    {counts[s]}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Search & filter controls */}
                <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-sm font-medium text-foreground">
                        {filteredOrders.length} of {orders.length} orders
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search client, order #, tracking…"
                                className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-72"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            {STATUS_FILTER_OPTIONS.map((s) => (
                                <option key={s} value={s} className="capitalize">
                                    {s === 'all' ? 'All Statuses' : s.replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <Card className="rounded-xl border-border bg-card shadow-sm">
                    <CardContent className="p-0">
                        {filteredOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                                <PackageCheck className="h-10 w-10 opacity-40" />
                                <p className="text-sm">
                                    {orders.length === 0 ? 'No orders yet.' : 'No orders match your search or filter.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-border text-xs text-muted-foreground">
                                        <tr>
                                            <th className="p-4 font-medium">Order #</th>
                                            <th className="p-4 font-medium">Client</th>
                                            <th className="p-4 font-medium">Quote #</th>
                                            <th className="p-4 font-medium">Total</th>
                                            <th className="p-4 font-medium">Date</th>
                                            <th className="p-4 font-medium">Status</th>
                                            <th className="p-4 font-medium">Update Status</th>
                                            <th className="p-4 font-medium">Delivery Tracking</th>
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
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

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

                    <Input
                        autoFocus
                        placeholder={`Type ${cancelTarget?.order_id ?? ''} to confirm`}
                        value={cancelConfirmText}
                        onChange={(e) => setCancelConfirmText(e.target.value)}
                    />

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
