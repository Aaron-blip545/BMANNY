import { RoleDashboard } from '@/components/role-dashboard';
import { PackageCheck, PackageMinus } from 'lucide-react';

export default function OrderManagerDashboard() {
    return (
        <RoleDashboard
            title="Order Manager"
            description="Overview of order fulfillment and delivery work."
            summaryItems={['Pending Orders', 'Approved Orders', 'In Production', 'For Delivery']}
            activityTitle="Recent Order Activity"
            dashboardHref="/order-manager/dashboard"
            quickAccessItems={[
                { title: 'Orders', href: '/orders', icon: PackageCheck },
                { title: 'Inventory', href: '/products', icon: PackageMinus },
            ]}
        />
    );
}
