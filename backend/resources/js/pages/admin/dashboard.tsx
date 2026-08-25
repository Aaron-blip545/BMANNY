import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight, Boxes, CircleHelp, ClipboardList, PackageCheck, Users, type LucideIcon } from 'lucide-react';

interface Props {
    stats?: { users: number; inquiries: number; orders: number; products: number };
    recentInquiries?: Array<{ inquiry_id: number; status: string; created_at: string; client: { business_name: string } | null }>;
}

interface Metric {
    label: string;
    value: number;
    description: string;
    icon: LucideIcon;
    accent: string;
    surface: string;
    iconColor: string;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/admin/dashboard' }];

function statusClass(status: string) {
    switch (status.toLowerCase()) {
        case 'pending': return 'bmanny-status-pending';
        case 'responded':
        case 'reviewed': return 'bmanny-status-responded';
        case 'confirmed':
        case 'accepted': return 'bmanny-status-approved';
        case 'in_production': return 'bmanny-status-production';
        case 'for_delivery': return 'bmanny-status-delivery';
        case 'completed': return 'bmanny-status-completed';
        default: return 'bmanny-status-closed';
    }
}

export default function AdminDashboard({
    stats = { users: 0, inquiries: 0, orders: 0, products: 0 },
    recentInquiries = [],
}: Props) {
    const metrics: Metric[] = [
        { label: 'Users', value: stats.users, description: 'Registered accounts', icon: Users, accent: 'bg-[#1547c0]', surface: 'bg-[#f7faff] dark:bg-card', iconColor: 'text-[#1547c0] dark:text-blue-300' },
        { label: 'Inquiries', value: stats.inquiries, description: 'Customer submissions', icon: CircleHelp, accent: 'bg-[#d6a72c]', surface: 'bg-[#fffaf0] dark:bg-card', iconColor: 'text-[#b67c08] dark:text-amber-300' },
        { label: 'Orders', value: stats.orders, description: 'Confirmed orders', icon: PackageCheck, accent: 'bg-emerald-600 dark:bg-emerald-500', surface: 'bg-[#f4fbf7] dark:bg-card', iconColor: 'text-emerald-700 dark:text-emerald-300' },
        { label: 'Products', value: stats.products, description: 'Catalog products', icon: Boxes, accent: 'bg-violet-600 dark:bg-violet-500', surface: 'bg-[#f8f6ff] dark:bg-card', iconColor: 'text-violet-700 dark:text-violet-300' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />

            <main className="min-h-full bg-[#edf2f9] px-4 py-6 dark:bg-background sm:px-6 lg:px-8 lg:py-8">
                <div className="mx-auto w-full max-w-[1600px] space-y-6">
                    <header className="border-l-2 border-[#d6a72c] py-1 pl-4">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1547c0] dark:text-blue-300">BMANNY Partners Inc.</p>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Overview of BMANNY operational activity.</p>
                    </header>

                    <section aria-label="Operational summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {metrics.map(({ label, value, description, icon: Icon, accent, surface, iconColor }) => (
                            <Card key={label} className={`group relative overflow-hidden rounded-xl border-[#d6e0ee] shadow-[0_2px_8px_rgba(7,29,73,0.06)] transition-[border-color,box-shadow] duration-150 hover:border-primary/40 hover:shadow-[0_6px_18px_rgba(7,29,73,0.10)] dark:border-border ${surface}`}>
                                <span className={`absolute inset-x-0 top-0 h-[3px] ${accent}`} aria-hidden="true" />
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
                                            <p className="mt-3 text-3xl font-semibold leading-none tracking-tight text-card-foreground">{value}</p>
                                        </div>
                                        <span className="flex size-9 items-center justify-center rounded-lg border border-current/10 bg-white/65 dark:bg-background/50">
                                            <Icon className={`size-[18px] shrink-0 stroke-[1.8] ${iconColor}`} aria-hidden="true" />
                                        </span>
                                    </div>
                                    <p className="mt-4 border-t border-border/70 pt-3 text-sm text-muted-foreground">{description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </section>

                    <section>
                        {recentInquiries.length === 0 ? (
                            <Card className="overflow-hidden rounded-xl border-[#d6e0ee] bg-card shadow-[0_2px_8px_rgba(7,29,73,0.06)] dark:border-border">
                                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#d6e0ee] bg-[#f7faff] text-[#1547c0] dark:border-border dark:bg-muted/40 dark:text-blue-300">
                                        <ClipboardList className="size-5 stroke-[1.7]" aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-base font-semibold text-card-foreground">Recent Activity</h2>
                                        <p className="mt-1 text-sm text-muted-foreground">No activity yet. New customer inquiries and review updates will appear here.</p>
                                    </div>
                                    <Link href="/inquiries" className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-[#c9d5e6] bg-card px-4 text-sm font-medium text-[#1236a3] transition-colors duration-150 hover:border-[#1547c0] hover:bg-[#f7faff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-border dark:text-blue-300 dark:hover:bg-muted">
                                        View inquiries
                                        <ArrowUpRight className="size-4" aria-hidden="true" />
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="overflow-hidden rounded-xl border-[#203a65] bg-card shadow-[0_8px_22px_rgba(7,29,73,0.08)] dark:border-border">
                                <CardContent className="p-0">
                                    <div className="flex items-start justify-between gap-4 border-b border-[#203a65] bg-[#071d49] px-5 py-4 text-white dark:bg-[#0d213f]">
                                        <div>
                                            <h2 className="text-base font-semibold text-white">Recent Activity</h2>
                                            <p className="mt-1 text-sm text-blue-100/75">Latest customer inquiry activity.</p>
                                        </div>
                                        <span className="mt-2 h-0.5 w-8 rounded-full bg-[#d6a72c]" aria-hidden="true" />
                                    </div>
                                    <div className="divide-y divide-border">
                                        {recentInquiries.map((inquiry) => (
                                            <div key={inquiry.inquiry_id} className="flex items-start gap-3 px-5 py-4">
                                                <span className="mt-2 size-2 shrink-0 rounded-full bg-[#1547c0]" aria-hidden="true" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-card-foreground">Inquiry #{inquiry.inquiry_id} from {inquiry.client?.business_name ?? 'a customer'}</p>
                                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                        <span className={`bmanny-status ${statusClass(inquiry.status)}`}>{inquiry.status}</span>
                                                        <span>{new Date(inquiry.created_at).toLocaleString('en-PH')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </section>
                </div>
            </main>
        </AppLayout>
    );
}
