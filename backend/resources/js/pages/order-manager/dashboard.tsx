import { RoleDashboard } from '@/components/role-dashboard';
import { PackageCheck, PackageMinus } from 'lucide-react';

interface Props {
    stats?: { pending: number; approved: number; inProduction: number; forDelivery: number };
    recentOrders?: Array<{ order_id: number; status: string; created_at: string; client: { business_name: string } | null }>;
}

export default function OrderManagerDashboard({
    stats = { pending: 0, approved: 0, inProduction: 0, forDelivery: 0 },
    recentOrders = [],
}: Props) {
    return (
        <RoleDashboard
            title="Order Manager"
            description="Overview of order fulfillment and delivery work."
            summaryItems={[
                { label: 'Pending',       value: stats.pending,      description: 'Awaiting production start' },
                { label: 'Approved',      value: stats.approved,     description: 'Ready for production' },
                { label: 'In Production', value: stats.inProduction, description: 'Being made / packed' },
                { label: 'For Delivery',  value: stats.forDelivery,  description: 'Out for / delivered' },
            ]}
            activityTitle="Recent Order Activity"
            activityItems={recentOrders.map((order) => ({
                id: order.order_id,
                title: `Order #${order.order_id} — ${order.client?.business_name ?? 'Customer'}`,
                detail: `${order.status} • ${new Date(order.created_at).toLocaleString('en-PH')}`,
            }))}
            dashboardHref="/order-manager/dashboard"
            quickAccessItems={[
                { title: 'Orders', href: '/orders', icon: PackageCheck },
                { title: 'Inventory', href: '/products', icon: PackageMinus },
            ]}
        />
    );
}
