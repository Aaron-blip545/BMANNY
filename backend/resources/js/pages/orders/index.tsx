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
    pending: 'bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-300',
    approved: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    in_production: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    packed: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
    for_delivery: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    delivered: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
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

            <div className="p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage production and delivery status for all orders.
                    </p>
                </div>

                {/* Flash */}
                {flash?.success && (
                    <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
                        {flash.success}
                    </div>
                )}

                {/* Stats */}
                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {ORDER_STATUSES.map((s) => (
                        <Card key={s} className="border-border/60">
                            <CardContent className="p-4">
                                <p className="text-xs capitalize text-muted-foreground">{s}</p>
                                <p className={`mt-1 text-2xl font-bold ${STATUS_STYLES[s].split(' ')[1]}`}>
                                    {counts[s]}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Table */}
                <Card className="border-border/60 shadow-sm">
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
                                                className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
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
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[order.status] ?? ''}`}
                                                    >
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <select
                                                        value={order.status}
                                                        disabled={updatingId === order.order_id}
                                                        onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                                                        className="rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
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
                                                            className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Tracking number"
                                                            defaultValue={order.courier_tracking_number ?? ''}
                                                            onBlur={(e) => handleTrackingUpdate(order.order_id, 'courier_tracking_number', e.target.value)}
                                                            className="rounded-md border border-input bg-background px-2 py-1 text-xs"
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
