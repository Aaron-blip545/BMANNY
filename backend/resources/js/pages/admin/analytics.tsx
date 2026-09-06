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
            <main className="bmanny-page">
                <div className="mx-auto w-full max-w-[1600px]">
                    <DashboardAnalytics
                        title="Analytics"
                        description="Business activity at a glance."
                        periods={analytics.periods}
                    />
                </div>
            </main>
        </AppLayout>
    );
}
