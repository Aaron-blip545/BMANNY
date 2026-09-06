import { Card, CardContent } from '@/components/ui/card';
import { BmannyMetricCard } from '@/components/bmanny-metric-card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight, Boxes, CircleHelp, PackageCheck, Users, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface QuickAccessItem { title: string; href: string; icon: LucideIcon; }
interface SummaryItem { label: string; value: number; description: string; }
interface ActivityItem { id: number; title: string; detail: string; }

interface RoleDashboardProps {
    title: string;
    description: string;
    summaryItems: Array<SummaryItem | string>;
    activityTitle: string;
    activityItems?: ActivityItem[];
    quickAccessItems: QuickAccessItem[];
    dashboardHref: string;
    analytics?: ReactNode;
}

export function RoleDashboard({ title, description, summaryItems, activityTitle, activityItems = [], quickAccessItems, dashboardHref, analytics }: RoleDashboardProps) {
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: dashboardHref }];
    const metricFor = (label: string) => {
        const normalized = label.toLowerCase();
        if (normalized.includes('inquir') || normalized.includes('quotation')) return { icon: CircleHelp, accent: 'gold' as const };
        if (normalized.includes('order')) return { icon: PackageCheck, accent: 'green' as const };
        if (normalized.includes('user') || normalized.includes('client')) return { icon: Users, accent: 'blue' as const };
        return { icon: Boxes, accent: 'navy' as const };
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${title} Dashboard`} />
            <main className="bmanny-page">
                <div className="mx-auto w-full max-w-[1600px] space-y-6">
                    <header className="bmanny-page-header">
                        <p className="bmanny-page-eyebrow">{title} Workspace</p>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
                        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                    </header>
                    <section aria-label={`${title} summary`} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {summaryItems.map((item) => {
                            const summary = typeof item === 'string'
                                ? { label: item, value: 0, description: 'No data available yet.' }
                                : item;

                            const metric = metricFor(summary.label);
                            return <BmannyMetricCard key={summary.label} label={summary.label} value={typeof item === 'string' ? '—' : summary.value} description={summary.description} icon={metric.icon} accent={metric.accent} />;
                        })}
                    </section>
                    <section aria-label={`${title} details`} className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
                        <Card className="bmanny-workspace xl:col-span-2">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between gap-4">
                                    <h2 className="text-[17px] font-semibold text-card-foreground">{activityTitle}</h2>
                                    <span className="h-px flex-1 bg-border" aria-hidden="true" />
                                </div>
                                <div className="mt-4 border-t border-border">
                                    {activityItems.length === 0 ? (
                                        <p className="py-5 text-sm text-muted-foreground">No recent activity.</p>
                                    ) : activityItems.map((activity) => (
                                        <div key={activity.id} className="relative border-b border-border py-4 pl-5 last:border-b-0">
                                            <span className="absolute left-0 top-5 size-2 rounded-full bg-primary" aria-hidden="true" />
                                            <span className="absolute bottom-0 left-[3px] top-7 w-px bg-border last:hidden" aria-hidden="true" />
                                            <p className="text-sm font-semibold text-card-foreground">{activity.title}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{activity.detail}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-[10px] border border-border bg-card/70 shadow-none">
                            <CardContent className="p-5 sm:p-6">
                                <h2 className="text-[17px] font-semibold text-card-foreground">Quick Access</h2>
                                <nav aria-label="Quick access" className="mt-4 divide-y divide-border border-t border-border">
                                    {quickAccessItems.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <Link key={item.title} href={item.href} className="group flex items-center gap-3 px-1 py-3 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-inset">
                                                <Icon className="size-4 shrink-0 text-muted-foreground" />
                                                <span className="flex-1">{item.title}</span>
                                                <ArrowUpRight className="size-4 text-muted-foreground transition-colors duration-150 group-hover:text-foreground" />
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </CardContent>
                        </Card>
                    </section>
                    {analytics}
                </div>
            </main>
        </AppLayout>
    );
}
