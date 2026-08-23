import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { PackageCheck } from 'lucide-react';
import { useState } from 'react';

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

export default function OrdersIndex({ orders }: Props) {
    const { flash } = usePage().props as any;
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    function handleStatusChange(orderId: number, newStatus: string) {
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

    const counts = ORDER_STATUSES.reduce(
        (acc, s) => ({ ...acc, [s]: orders.filter((o) => o.status === s).length }),
        {} as Record<OrderStatus, number>,
    );

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

                {/* Table */}
                <Card className="rounded-xl border-border bg-card shadow-sm">
                    <CardContent className="p-0">
                        {orders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                                <PackageCheck className="h-10 w-10 opacity-40" />
                                <p className="text-sm">No orders yet.</p>
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
                                        {orders.map((order) => (
                                            <tr
                                                key={order.order_id}
                                                className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/50"
                                            >
                                                <td className="p-4 font-mono text-xs text-muted-foreground">
                                                    #{order.order_id}
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-medium">
                                                        {order.client?.business_name ?? '—'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {order.client?.contact_person ?? ''}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-muted-foreground font-mono text-xs">
                                                    {order.quotation ? `#${order.quotation.quotation_id}` : '—'}
                                                </td>
                                                <td className="p-4 font-medium">
                                                    {formatAmount(order.total_amount)}
                                                </td>
                                                <td className="p-4 text-muted-foreground text-xs">
                                                    {formatDate(order.created_at)}
                                                </td>
                                                <td className="p-4">
                                                    <span
                                                        className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[order.status] ?? ''}`}
                                                    >
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <select
                                                        value={order.status}
                                                        disabled={updatingId === order.order_id}
                                                        onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                                                        className="rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                                                    >
                                                        {ORDER_STATUSES.map((s) => (
                                                            <option key={s} value={s} className="capitalize">
                                                                {s.charAt(0).toUpperCase() + s.slice(1)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1">
                                                        <input
                                                            type="text"
                                                            placeholder="Courier (e.g. J&T)"
                                                            defaultValue={order.courier_name ?? ''}
                                                            onBlur={(e) => handleTrackingUpdate(order.order_id, 'courier_name', e.target.value)}
                                                            className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Tracking number"
                                                            defaultValue={order.courier_tracking_number ?? ''}
                                                            onBlur={(e) => handleTrackingUpdate(order.order_id, 'courier_tracking_number', e.target.value)}
                                                            className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground"
                                                        />
                                                    </div>
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
