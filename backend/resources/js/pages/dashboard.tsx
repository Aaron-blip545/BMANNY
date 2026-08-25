import { BmannyMetricCard } from '@/components/bmanny-metric-card';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, Boxes, CircleHelp, PackageCheck, PackageMinus, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];
const summaryItems = ['Inquiries', 'Orders', 'Users', 'Products'];

export default function Dashboard() {
    const { auth } = usePage().props as any;
    const role: string = auth?.user?.role ?? '';
    const isAdmin = role === 'admin';
    const isSalesAgent = role === 'sales_agent';
    const isOrderManager = role === 'order_manager';

    const quickAccessItems = [
        ...(isSalesAgent || isAdmin ? [{ title: 'Inquiries', href: '/inquiries', icon: CircleHelp }] : []),
        ...(isOrderManager || isAdmin ? [{ title: 'Orders', href: '/orders', icon: PackageCheck }] : []),
        { title: 'Inventory', href: '/products', icon: PackageMinus },
        ...(isAdmin ? [{ title: 'Manage Users', href: '/users', icon: Users }] : []),
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <main className="bmanny-page">
                <div className="mx-auto w-full max-w-[1600px] space-y-6">
                    <header className="bmanny-page-header">
                        <p className="bmanny-page-eyebrow">BMANNY Workspace</p>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Overview of BMANNY system activity.</p>
                    </header>

                    <section aria-label="System summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {summaryItems.map((item) => (
                            <BmannyMetricCard key={item} label={item} value="—" description="No data available yet." icon={Boxes} />
                        ))}
                    </section>

                    <section aria-label="Dashboard details" className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                        <Card className="bmanny-workspace xl:col-span-2">
                            <CardContent className="p-5 sm:p-6">
                                <h2 className="text-base font-semibold text-card-foreground">Recent Activity</h2>
                                <div className="mt-4 border-t border-border pt-5">
                                    <p className="text-sm text-muted-foreground">No recent activity.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bmanny-workspace">
                            <CardContent className="p-5 sm:p-6">
                                <h2 className="text-base font-semibold text-card-foreground">Quick Access</h2>
                                <nav aria-label="Quick access" className="mt-4 divide-y divide-border border-t border-border">
                                    {quickAccessItems.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <Link key={item.title} href={item.href} className="group flex items-center gap-3 px-1 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
                                                <Icon className="size-4 shrink-0 text-muted-foreground" />
                                                <span className="flex-1">{item.title}</span>
                                                <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </main>
        </AppLayout>
    );
}
