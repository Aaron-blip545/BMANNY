import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    ClipboardList,
    Clock,
    Layers,
} from 'lucide-react';

interface Props {
    stats: { pending: number; available: number; alternative: number; unavailable: number };
    recentRequests: Array<{
        id: number;
        inquiryId: number;
        businessName: string;
        requestedConfiguration: string;
        status: 'pending' | 'available' | 'alternative' | 'unavailable';
        submittedAt: string | null;
    }>;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Product Controller', href: '/product-controller/dashboard' }];

function getStatusBadge(status: string) {
    switch (status) {
        case 'available':
            return {
                label: 'Available',
                pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
            };
        case 'alternative':
            return {
                label: 'Alternative Offered',
                pill: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
            };
        case 'unavailable':
            return {
                label: 'Unavailable',
                pill: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
            };
        case 'pending':
        default:
            return {
                label: 'Awaiting Review',
                pill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
            };
    }
}

export default function ProductControllerDashboard({ stats, recentRequests }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Product Request Review" />
            <main className="bmanny-page">
                <div className="bmanny-page-inner space-y-5">
                    {/* Header Banner matching inquiries.tsx */}
                    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="border-l-4 border-amber-400 pl-3.5">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Product Controller</p>
                            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">PRODUCT REQUEST REVIEW</h1>
                            <p className="text-xs text-muted-foreground sm:text-sm">Review package and customization requests forwarded by Sales before a quotation is prepared</p>
                        </div>
                        <Button
                            asChild
                            className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                        >
                            <Link href={route('product-controller.requests.index')}>
                                <ClipboardList className="mr-1.5 h-4 w-4" />
                                Review requests
                            </Link>
                        </Button>
                    </header>

                    {/* Metric Summary Cards */}
                    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                        {[
                            {
                                label: 'Awaiting Review',
                                value: stats.pending,
                                description: 'Requests needing your decision',
                                icon: Clock,
                            },
                            {
                                label: 'Available',
                                value: stats.available,
                                description: 'Approved as requested',
                                icon: CheckCircle2,
                            },
                            {
                                label: 'Alternative Needed',
                                value: stats.alternative,
                                description: 'Needs a recommended option',
                                icon: Layers,
                            },
                            {
                                label: 'Unavailable',
                                value: stats.unavailable,
                                description: 'Cannot be accommodated',
                                icon: AlertCircle,
                            },
                        ].map((item) => (
                            <div key={item.label} className="rounded-xl border border-border/70 bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                                    <item.icon className="h-5 w-5 text-muted-foreground/70" />
                                </div>
                                <p className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{item.value}</p>
                                <p className="mt-4 text-xs text-muted-foreground">{item.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Queue Header Bar */}
                    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border/70 bg-card px-5 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-foreground">Request review queue</h2>
                            <p className="text-xs text-muted-foreground">Customer package and customization requests waiting for Product Control</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-8 rounded-lg border-border/80 bg-card px-3 text-xs font-semibold text-foreground shadow-xs hover:bg-muted"
                        >
                            <Link href={route('product-controller.requests.index')}>
                                View all
                            </Link>
                        </Button>
                    </div>

                    {/* Floating Card Rows Table */}
                    {recentRequests.length === 0 ? (
                        <div className="rounded-xl border border-border/70 bg-card py-16 text-center text-muted-foreground shadow-sm">
                            <ClipboardList className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                            <h2 className="text-base font-semibold text-foreground">No requests to review</h2>
                            <p className="mt-1 text-xs">Sales has not forwarded any package requests yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] border-separate border-spacing-y-2.5 text-left text-sm">
                                <thead>
                                    <tr>
                                        <th className="px-5 py-3 text-sm font-bold text-foreground">Inquiry</th>
                                        <th className="px-5 py-3 text-sm font-bold text-foreground">Customer</th>
                                        <th className="px-5 py-3 text-sm font-bold text-foreground">Requested Package</th>
                                        <th className="px-5 py-3 text-sm font-bold text-foreground">Decision</th>
                                        <th className="px-5 py-3 text-right text-sm font-bold text-foreground">Received</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentRequests.map((request) => {
                                        const badge = getStatusBadge(request.status);
                                        return (
                                            <tr
                                                key={request.id}
                                                className="group bg-card shadow-sm transition-shadow hover:shadow-md"
                                            >
                                                {/* Inquiry */}
                                                <td className="rounded-l-xl border-y border-l border-border/70 p-5 align-middle">
                                                    <p className="text-base font-bold text-foreground">
                                                        #{request.inquiryId}
                                                    </p>
                                                </td>

                                                {/* Customer */}
                                                <td className="border-y border-border/70 p-5 align-middle">
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {request.businessName}
                                                    </p>
                                                </td>

                                                {/* Requested Package */}
                                                <td className="border-y border-border/70 p-5 align-middle">
                                                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800 capitalize">
                                                        {request.requestedConfiguration || 'Standard'}
                                                    </span>
                                                </td>

                                                {/* Decision Status Pill */}
                                                <td className="border-y border-border/70 p-5 align-middle">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.pill}`}
                                                    >
                                                        {badge.label}
                                                    </span>
                                                </td>

                                                {/* Received */}
                                                <td className="rounded-r-xl border-y border-r border-border/70 p-5 text-right align-middle">
                                                    <p className="text-xs font-mono text-muted-foreground">
                                                        {request.submittedAt ?? '-'}
                                                    </p>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </AppLayout>
    );
}
