import { RoleDashboard } from '@/components/role-dashboard';
import { CircleHelp, PackageMinus } from 'lucide-react';

export default function SalesDashboard() {
    return (
        <RoleDashboard
            title="Sales Agent"
            description="Overview of customer inquiries and quotation work."
            summaryItems={['Inquiries', 'Pending Review', 'Quotations', 'Business Clients']}
            activityTitle="Recent Inquiry Activity"
            dashboardHref="/sales/dashboard"
            quickAccessItems={[
                { title: 'Inquiries', href: '/inquiries', icon: CircleHelp },
                { title: 'Inventory', href: '/products', icon: PackageMinus },
            ]}
        />
    );
}
