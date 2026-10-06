import { BmannyMetricCard } from '@/components/bmanny-metric-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import {
    BadgeCheck,
    Building2,
    CheckCircle2,
    Clock3,
    ExternalLink,
    FileText,
    Search,
    ShieldAlert,
    ShieldCheck,
    ShieldX,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Verifications', href: '/sales/verifications' }];

interface BusinessClientRecord {
    client_id: number;
    business_name: string;
    contact_person: string;
    business_permit_path: string | null;
    business_permit_url: string | null;
    verification_status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
    is_verified: boolean;
    verification_submitted_at: string | null;
    verification_reviewed_at: string | null;
    verification_notes: string | null;
    user: {
        user_id: number;
        name: string;
        email: string;
    } | null;
}

interface Props {
    clients: BusinessClientRecord[];
}

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected'] as const;

function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function StatusBadge({ status }: { status: BusinessClientRecord['verification_status'] }) {
    const map: Record<
        BusinessClientRecord['verification_status'],
        { label: string; className: string; icon: React.ReactNode }
    > = {
        not_submitted: {
            label: 'Not Submitted',
            className: 'bg-muted text-muted-foreground',
            icon: <FileText className="h-3 w-3" />,
        },
        pending: {
            label: 'Pending',
            className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
            icon: <Clock3 className="h-3 w-3" />,
        },
        approved: {
            label: 'Approved',
            className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
            icon: <ShieldCheck className="h-3 w-3" />,
        },
        rejected: {
            label: 'Rejected',
            className: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
            icon: <ShieldX className="h-3 w-3" />,
        },
    };

    const { label, className, icon } = map[status] ?? map['not_submitted'];

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
            {icon}
            {label}
        </span>
    );
}

function RejectModal({
    clientId,
    businessName,
    onClose,
}: {
    clientId: number;
    businessName: string;
    onClose: () => void;
}) {
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function handleSubmit() {
        if (!notes.trim()) return;
        setSubmitting(true);
        router.patch(
            route('sales.verifications.reject', clientId),
            { notes },
            {
                onFinish: () => {
                    setSubmitting(false);
                    onClose();
                },
            },
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
                <div className="mb-4 flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/40">
                        <ShieldX className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    </span>
                    <div>
                        <h2 className="text-base font-semibold">Reject Permit</h2>
                        <p className="text-sm text-muted-foreground">{businessName}</p>
                    </div>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">
                    Provide a reason so the client knows what to fix before re-submitting.
                </p>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Image is blurry or permit has expired…"
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={!notes.trim() || submitting}
                    >
                        {submitting ? 'Rejecting…' : 'Reject'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function VerificationsPage({ clients }: Props) {
    const { flash } = usePage().props as any;
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('pending');
    const [rejectTarget, setRejectTarget] = useState<{ clientId: number; businessName: string } | null>(null);
    const [approving, setApproving] = useState<number | null>(null);

    const pending = clients.filter((c) => c.verification_status === 'pending').length;
    const approved = clients.filter((c) => c.verification_status === 'approved').length;
    const rejected = clients.filter((c) => c.verification_status === 'rejected').length;

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return clients.filter((c) => {
            if (statusFilter !== 'all' && c.verification_status !== statusFilter) return false;
            if (!term) return true;
            return (
                c.business_name.toLowerCase().includes(term) ||
                c.contact_person.toLowerCase().includes(term) ||
                (c.user?.email.toLowerCase().includes(term) ?? false)
            );
        });
    }, [clients, search, statusFilter]);

    function handleApprove(clientId: number) {
        setApproving(clientId);
        router.patch(
            route('sales.verifications.approve', clientId),
            {},
            { onFinish: () => setApproving(null) },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Verifications" />

            {rejectTarget && (
                <RejectModal
                    clientId={rejectTarget.clientId}
                    businessName={rejectTarget.businessName}
                    onClose={() => setRejectTarget(null)}
                />
            )}

            <div className="bmanny-page">
                {/* Header */}
                <header className="bmanny-page-header">
                    <p className="bmanny-page-eyebrow">Sales Workspace</p>
                    <h1 className="text-2xl font-semibold tracking-tight">Business Permit Verifications</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Review submitted business permits and approve or reject client verification requests.
                    </p>
                </header>

                {/* Flash messages */}
                {flash?.success && (
                    <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                        ✅ {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                        ❌ {flash.error}
                    </div>
                )}

                {/* Metric cards */}
                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <BmannyMetricCard
                        label="Total Clients"
                        value={clients.length}
                        description="Registered business clients"
                        icon={Building2}
                        accent="blue"
                    />
                    <BmannyMetricCard
                        label="Pending"
                        value={pending}
                        description="Awaiting your review"
                        icon={Clock3}
                        accent="gold"
                    />
                    <BmannyMetricCard
                        label="Approved"
                        value={approved}
                        description="Fully verified accounts"
                        icon={BadgeCheck}
                        accent="green"
                    />
                    <BmannyMetricCard
                        label="Rejected"
                        value={rejected}
                        description="Needs resubmission"
                        icon={ShieldAlert}
                        accent="navy"
                    />
                </div>

                {/* Toolbar */}
                <div className="bmanny-workspace mb-4 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-sm font-medium text-foreground">
                        {filtered.length} of {clients.length} clients
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                id="verifications-search"
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search business, contact, email…"
                                className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-72"
                            />
                        </div>
                        <select
                            id="verifications-status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_FILTERS)[number])}
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            {STATUS_FILTERS.map((s) => (
                                <option key={s} value={s} className="capitalize">
                                    {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <Card className="bmanny-workspace overflow-hidden">
                    <CardContent className="p-0">
                        {filtered.length === 0 ? (
                            <div className="bmanny-empty-state py-16 text-muted-foreground">
                                <ShieldCheck />
                                <h2 className="text-base font-semibold text-foreground">No verifications found</h2>
                                <p className="mt-1 text-sm">
                                    {clients.length === 0
                                        ? 'No business clients registered yet.'
                                        : 'No clients match the current filter.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                                        <tr>
                                            <th className="p-4 font-medium">Business</th>
                                            <th className="p-4 font-medium">Contact</th>
                                            <th className="p-4 font-medium">Status</th>
                                            <th className="p-4 font-medium">Submitted</th>
                                            <th className="p-4 font-medium">Reviewed</th>
                                            <th className="p-4 font-medium">Permit</th>
                                            <th className="p-4 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((client) => (
                                            <tr
                                                key={client.client_id}
                                                className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/50"
                                            >
                                                {/* Business */}
                                                <td className="p-4 font-medium">
                                                    <div>{client.business_name}</div>
                                                    {client.verification_notes && (
                                                        <div className="mt-1 max-w-xs truncate text-xs text-muted-foreground italic">
                                                            Note: {client.verification_notes}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Contact */}
                                                <td className="p-4 text-muted-foreground">
                                                    <div>{client.contact_person}</div>
                                                    <div className="text-xs opacity-70">{client.user?.email ?? '—'}</div>
                                                </td>

                                                {/* Status */}
                                                <td className="p-4">
                                                    <StatusBadge status={client.verification_status} />
                                                </td>

                                                {/* Submitted */}
                                                <td className="p-4 text-xs text-muted-foreground">
                                                    {formatDate(client.verification_submitted_at)}
                                                </td>

                                                {/* Reviewed */}
                                                <td className="p-4 text-xs text-muted-foreground">
                                                    {formatDate(client.verification_reviewed_at)}
                                                </td>

                                                {/* Permit link */}
                                                <td className="p-4">
                                                    {client.business_permit_url ? (
                                                        <a
                                                            href={client.business_permit_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                            View Permit
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="p-4">
                                                    {client.verification_status === 'pending' ? (
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                id={`approve-${client.client_id}`}
                                                                size="sm"
                                                                className="h-8 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                                                                disabled={approving === client.client_id}
                                                                onClick={() => handleApprove(client.client_id)}
                                                            >
                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                                {approving === client.client_id ? 'Approving…' : 'Approve'}
                                                            </Button>
                                                            <Button
                                                                id={`reject-${client.client_id}`}
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 gap-1.5 border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
                                                                onClick={() =>
                                                                    setRejectTarget({
                                                                        clientId: client.client_id,
                                                                        businessName: client.business_name,
                                                                    })
                                                                }
                                                            >
                                                                <XCircle className="h-3.5 w-3.5" />
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    ) : client.verification_status === 'approved' ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                                            <ShieldCheck className="h-3.5 w-3.5" />
                                                            Verified
                                                        </span>
                                                    ) : client.verification_status === 'rejected' ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                                                            <ShieldX className="h-3.5 w-3.5" />
                                                            Rejected
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
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
