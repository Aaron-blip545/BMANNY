import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

interface DashboardStats {
    totalConfigurations: number | null;
    availableConfigurations: number | null;
    unavailableConfigurations: number | null;
    moqAttention: number | null;
    recentlyUpdated: number | null;
}

interface ProductUpdate {
    id: number;
    configurationName: string;
    action: string;
    updatedBy: string | null;
    updatedAt: string;
}

interface MoqAlert {
    id: number;
    configurationName: string;
    currentMoq: number | null;
    status: string;
}

interface ConfigurationStatus {
    available: number;
    unavailable: number;
    moqAttention: number;
}

interface Props {
    stats: DashboardStats;
    recentUpdates: ProductUpdate[];
    moqAlerts: MoqAlert[];
    configurationStatus: ConfigurationStatus | null;
}

interface StatCardProps {
    label: string;
    value: number | null;
    description: string;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Product Controller', href: '/product-controller/dashboard' }];

function StatCard({ label, value, description }: StatCardProps) {
    return (
        <Card className="border-border bg-card shadow-none">
            <CardHeader className="space-y-1 p-5 pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wide">{label}</CardDescription>
                <CardTitle className="text-3xl font-semibold tracking-tight">{value ?? '—'}</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2 text-sm text-muted-foreground">{description}</CardContent>
        </Card>
    );
}

function EmptyState({ children }: { children: React.ReactNode }) {
    return <p className="border-t border-border px-5 py-7 text-sm text-muted-foreground">{children}</p>;
}

export default function ProductControllerDashboard({ stats, recentUpdates, moqAlerts, configurationStatus }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Product Controller Dashboard" />

            <main className="min-h-full bg-slate-50/70 p-4 sm:p-6 lg:p-8 dark:bg-background">
                <div className="mx-auto max-w-7xl space-y-6">
                    <section className="border-b border-border pb-6">
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-foreground">Dashboard</h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                            Manage and maintain product configurations, variants, packaging, customization options, and MOQ.
                        </p>
                    </section>

                    <section aria-label="Configuration summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        <StatCard label="Total Product Configurations" value={stats.totalConfigurations} description="All product configurations" />
                        <StatCard label="Available Configurations" value={stats.availableConfigurations} description="Currently marked available" />
                        <StatCard label="Unavailable Configurations" value={stats.unavailableConfigurations} description="Currently marked unavailable" />
                        <StatCard label="MOQ Attention" value={stats.moqAttention} description="Configurations needing MOQ review" />
                        <StatCard label="Recently Updated" value={stats.recentlyUpdated} description="Recently modified configurations" />
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,1fr)]">
                        <Card id="recent-product-updates" className="border-border bg-card shadow-none">
                            <CardHeader className="border-b border-border p-5">
                                <CardTitle className="text-base">Recent Product Updates</CardTitle>
                                <CardDescription>Changes to product configuration records.</CardDescription>
                            </CardHeader>
                            {recentUpdates.length === 0 ? (
                                <EmptyState>No product updates available.</EmptyState>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[42rem] text-left text-sm">
                                        <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                                            <tr>
                                                <th className="px-5 py-3 font-medium">Product Configuration</th>
                                                <th className="px-5 py-3 font-medium">Action</th>
                                                <th className="px-5 py-3 font-medium">Updated By</th>
                                                <th className="px-5 py-3 font-medium">Date &amp; Time</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentUpdates.map((update) => (
                                                <tr key={update.id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                                                    <td className="px-5 py-4 font-medium">{update.configurationName}</td>
                                                    <td className="px-5 py-4 text-muted-foreground">{update.action}</td>
                                                    <td className="px-5 py-4 text-muted-foreground">{update.updatedBy ?? '—'}</td>
                                                    <td className="px-5 py-4 text-muted-foreground">{update.updatedAt}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>

                        <div className="space-y-6">
                            <Card id="configuration-status" className="border-border bg-card shadow-none">
                                <CardHeader className="border-b border-border p-5">
                                    <CardTitle className="text-base">Configuration Status</CardTitle>
                                    <CardDescription>Availability and MOQ review status.</CardDescription>
                                </CardHeader>
                                {configurationStatus ? (
                                    <dl className="divide-y divide-border px-5">
                                        <div className="flex items-center justify-between py-3 text-sm"><dt className="text-muted-foreground">Available</dt><dd className="font-medium">{configurationStatus.available}</dd></div>
                                        <div className="flex items-center justify-between py-3 text-sm"><dt className="text-muted-foreground">Unavailable</dt><dd className="font-medium">{configurationStatus.unavailable}</dd></div>
                                        <div className="flex items-center justify-between py-3 text-sm"><dt className="text-muted-foreground">MOQ requiring attention</dt><dd className="font-medium">{configurationStatus.moqAttention}</dd></div>
                                    </dl>
                                ) : (
                                    <EmptyState>No configuration data available.</EmptyState>
                                )}
                            </Card>

                            <Card id="moq-attention" className="border-border bg-card shadow-none">
                                <CardHeader className="border-b border-border p-5">
                                    <CardTitle className="text-base">MOQ Attention</CardTitle>
                                    <CardDescription>Configurations requiring MOQ review.</CardDescription>
                                </CardHeader>
                                {moqAlerts.length === 0 ? (
                                    <EmptyState>No MOQ alerts.</EmptyState>
                                ) : (
                                    <ul className="divide-y divide-border">
                                        {moqAlerts.map((alert) => (
                                            <li key={alert.id} className="flex items-start justify-between gap-4 px-5 py-4 text-sm">
                                                <div><p className="font-medium">{alert.configurationName}</p><p className="mt-1 text-muted-foreground">Current MOQ: {alert.currentMoq ?? '—'}</p></div>
                                                <span className="text-muted-foreground">{alert.status}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </Card>
                        </div>
                    </section>
                </div>
            </main>
        </AppLayout>
    );
}
