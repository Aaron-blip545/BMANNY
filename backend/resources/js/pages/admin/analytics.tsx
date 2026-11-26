import { DashboardAnalytics, type ActivityPeriods } from '@/components/dashboard-analytics';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

interface Props {
    analytics: {
        periods: ActivityPeriods;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Analytics', href: '/admin/analytics' },
];

export default function AdminAnalytics({ analytics }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Analytics" />
            <div className="bmanny-page">
                <div className="bmanny-page-inner space-y-6">
                    <DashboardAnalytics
                        title="ANALYTICS"
                        description="Business activity and pipeline performance at a glance."
                        periods={analytics.periods}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
