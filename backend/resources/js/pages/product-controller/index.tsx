import { BmannyMetricCard } from '@/components/bmanny-metric-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowRightLeft, CircleCheck, CircleX, ClipboardList, Inbox } from 'lucide-react';

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
const statusLabel = { pending: 'Awaiting review', available: 'Available', alternative: 'Alternative offered', unavailable: 'Unavailable' };

export default function ProductControllerDashboard({ stats, recentRequests }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Product Request Review" />
            <main className="bmanny-page">
                <div className="bmanny-page-inner space-y-5">
                    <section className="bmanny-page-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="bmanny-page-eyebrow">Product Controller</p>
                            <h1 className="text-2xl font-semibold tracking-tight">Product request review</h1>
                            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Review package and customization requests forwarded by Sales before a quotation is prepared.</p>
                        </div>
                        <Button asChild><Link href={route('product-controller.requests.index')}><ClipboardList className="mr-2 h-4 w-4" />Review requests</Link></Button>
                    </section>

                    <section aria-label="Request review summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <BmannyMetricCard label="Awaiting Review" value={stats.pending} description="Requests needing your decision" icon={Inbox} accent="gold" />
                        <BmannyMetricCard label="Available" value={stats.available} description="Approved as requested" icon={CircleCheck} accent="green" />
                        <BmannyMetricCard label="Alternative Needed" value={stats.alternative} description="Needs a recommended option" icon={ArrowRightLeft} accent="blue" />
                        <BmannyMetricCard label="Unavailable" value={stats.unavailable} description="Cannot be accommodated" icon={CircleX} accent="red" />
                    </section>

                    <Card className="bmanny-workspace overflow-hidden">
                        <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border p-5">
                            <div><CardTitle className="text-base">Request review queue</CardTitle><CardDescription>Customer package and customization requests waiting for Product Control.</CardDescription></div>
                            <Button variant="outline" size="sm" asChild><Link href={route('product-controller.requests.index')}>View all</Link></Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentRequests.length === 0 ? (
                                <div className="bmanny-empty-state py-14 text-muted-foreground"><ClipboardList /><h2 className="text-base font-semibold text-foreground">No requests to review</h2><p className="mt-1 text-sm">Sales has not forwarded any package requests yet.</p></div>
                            ) : (
                                <div className="overflow-x-auto"><table className="w-full min-w-[48rem] text-left text-sm"><thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="p-4 font-medium">Inquiry</th><th className="p-4 font-medium">Customer</th><th className="p-4 font-medium">Requested package</th><th className="p-4 font-medium">Decision</th><th className="p-4 font-medium">Received</th></tr></thead><tbody>{recentRequests.map((request) => <tr key={request.id} className="border-b border-border/50 last:border-0 hover:bg-muted/50"><td className="p-4 font-medium">#{request.inquiryId}</td><td className="p-4">{request.businessName}</td><td className="p-4 text-muted-foreground">{request.requestedConfiguration}</td><td className="p-4"><span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">{statusLabel[request.status]}</span></td><td className="p-4 text-muted-foreground">{request.submittedAt ?? '-'}</td></tr>)}</tbody></table></div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </AppLayout>
    );
}
