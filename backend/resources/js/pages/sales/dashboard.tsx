import { RoleDashboard } from '@/components/role-dashboard';
import { CircleHelp, PackageMinus } from 'lucide-react';

interface Props {
    stats?: { inquiries: number; pendingReview: number; quotations: number; businessClients: number };
    recentInquiries?: Array<{ inquiry_id: number; status: string; created_at: string; client: { business_name: string } | null }>;
}

export default function SalesDashboard({
    stats = { inquiries: 0, pendingReview: 0, quotations: 0, businessClients: 0 },
    recentInquiries = [],
}: Props) {
    return (
        <RoleDashboard
            title="Sales Agent"
            description="Overview of customer inquiries and quotation work."
            summaryItems={[
                { label: 'Inquiries', value: stats.inquiries, description: 'All customer inquiries' },
                { label: 'Pending Review', value: stats.pendingReview, description: 'Awaiting your review' },
                { label: 'Quotations', value: stats.quotations, description: 'Quotes created' },
                { label: 'Business Clients', value: stats.businessClients, description: 'Registered businesses' },
            ]}
            activityTitle="Recent Inquiry Activity"
            activityItems={recentInquiries.map((inquiry) => ({
                id: inquiry.inquiry_id,
                title: `Inquiry #${inquiry.inquiry_id} from ${inquiry.client?.business_name ?? 'a customer'}`,
                detail: `${inquiry.status} • ${new Date(inquiry.created_at).toLocaleString('en-PH')}`,
            }))}
            dashboardHref="/sales/dashboard"
            quickAccessItems={[
                { title: 'Inquiries', href: '/inquiries', icon: CircleHelp },
                { title: 'Inventory', href: '/products', icon: PackageMinus },
            ]}
        />
    );
}
