import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ClipboardList, MessageSquare, Plus } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Inquiries', href: '/inquiries' }];

interface Customization {
    customization_id: number;
    packaging_type: string;
    packaging_finish: string | null;
    serving_size: string | null;
    client_notes: string | null;
}

interface BusinessClient {
    client_id: number;
    business_name: string;
    contact_person: string;
    user: { email: string } | null;
}

interface Inquiry {
    inquiry_id: number;
    status: 'pending' | 'reviewed' | 'responded' | 'closed';
    created_at: string;
    client: BusinessClient | null;
    customizations: Customization[];
    quotation: null | { quotation_id: number };
}

interface Props {
    inquiries: Inquiry[];
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-muted text-muted-foreground',
    reviewed: 'bg-muted text-muted-foreground',
    responded: 'bg-muted text-muted-foreground',
    closed: 'bg-muted text-muted-foreground',
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function InquiriesPage({ inquiries }: Props) {
    const { flash } = usePage().props as any;

    const pending   = inquiries.filter((i) => i.status === 'pending').length;
    const responded = inquiries.filter((i) => i.status === 'responded').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inquiries" />

            <div className="bg-background p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Inquiries</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Customer rebranding &amp; packaging inquiries. Create a quotation to respond.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={route('quotations.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Quotation
                        </Link>
                    </Button>
                </div>

                {/* Flash message */}
                {flash?.success && (
                    <div className="mb-4 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground">
                        {flash.success}
                    </div>
                )}

                {/* Stats row */}
                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                        { label: 'Total',     value: inquiries.length },
                        { label: 'Pending',   value: pending },
                        { label: 'Responded', value: responded },
                        { label: 'Closed',    value: inquiries.filter((i) => i.status === 'closed').length },
                    ].map((s) => (
                        <Card key={s.label} className="rounded-xl border-border bg-card shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                                <p className="mt-1 text-2xl font-semibold tracking-tight text-card-foreground">{s.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Table */}
                <Card className="rounded-xl border-border bg-card shadow-sm">
                    <CardContent className="p-0">
                        {inquiries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                                <ClipboardList className="h-10 w-10 opacity-40" />
                                <p className="text-sm">No inquiries yet.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-border text-xs text-muted-foreground">
                                        <tr>
                                            <th className="p-4 font-medium">#</th>
                                            <th className="p-4 font-medium">Business</th>
                                            <th className="p-4 font-medium">Contact</th>
                                            <th className="p-4 font-medium">Packaging Types</th>
                                            <th className="p-4 font-medium">Status</th>
                                            <th className="p-4 font-medium">Date</th>
                                            <th className="p-4 font-medium">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inquiries.map((inquiry) => (
                                            <tr
                                                key={inquiry.inquiry_id}
                                                className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/50"
                                            >
                                                <td className="p-4 font-mono text-xs text-muted-foreground">
                                                    #{inquiry.inquiry_id}
                                                </td>
                                                <td className="p-4 font-medium">
                                                    {inquiry.client?.business_name ?? '—'}
                                                </td>
                                                <td className="p-4 text-muted-foreground">
                                                    <div>{inquiry.client?.contact_person ?? '—'}</div>
                                                    <div className="text-xs opacity-70">{inquiry.client?.user?.email ?? ''}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {inquiry.customizations.length === 0 ? (
                                                            <span className="text-muted-foreground">—</span>
                                                        ) : (
                                                            inquiry.customizations.map((c) => (
                                                                <span
                                                                    key={c.customization_id}
                                                                    className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                                                                >
                                                                    {c.packaging_type}
                                                                </span>
                                                            ))
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span
                                                        className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium capitalize ${STATUS_COLORS[inquiry.status] ?? ''}`}
                                                    >
                                                        {inquiry.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-muted-foreground text-xs">
                                                    {formatDate(inquiry.created_at)}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        {/* Chat — always available */}
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={route('chat.show', inquiry.inquiry_id)}>
                                                                <MessageSquare className="mr-1 h-3.5 w-3.5" />
                                                                Chat
                                                            </Link>
                                                        </Button>

                                                        {/* Quote — only on pending/reviewed */}
                                                        {inquiry.status === 'pending' || inquiry.status === 'reviewed' ? (
                                                            <Button variant="outline" size="sm" asChild>
                                                                <Link href={route('quotations.create', { inquiry_id: inquiry.inquiry_id })}>
                                                                    Quote
                                                                </Link>
                                                            </Button>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground capitalize">{inquiry.status}</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
