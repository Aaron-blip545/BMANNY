import { RoleDashboard } from '@/components/role-dashboard';
import { CircleHelp, PackageCheck, PackageMinus, Users } from 'lucide-react';

export default function AdminDashboard() {
    return (
        <RoleDashboard
            title="Admin"
            description="Overview of BMANNY operational activity."
            summaryItems={['Users', 'Inquiries', 'Orders', 'Products']}
            activityTitle="Recent Activity"
            dashboardHref="/admin/dashboard"
            quickAccessItems={[
                { title: 'Manage Users', href: '/users', icon: Users },
                { title: 'Inquiries', href: '/inquiries', icon: CircleHelp },
                { title: 'Orders', href: '/orders', icon: PackageCheck },
                { title: 'Inventory', href: '/products', icon: PackageMinus },
            ]}
        />
    );
}
