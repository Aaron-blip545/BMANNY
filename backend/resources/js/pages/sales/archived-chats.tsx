import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArchiveRestore,
    ArrowLeft,
    Calendar,
    MessageSquare,
    Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inquiries', href: '/inquiries' },
    { title: 'Archived chats', href: '/archived-chats' },
];

interface ArchiveItem {
    conversation_archive_id: number;
    archived_at: string;
    inquiry_count: number;
    inquiry: {
        inquiry_id: number;
        client: { business_name: string; contact_person: string } | null;
        customizations?: Array<{ packaging_type: string }>;
    };
}

function formatDate(value: string) {
    try {
        return new Date(value).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return value;
    }
}

export default function ArchivedChats({ archives }: { archives: ArchiveItem[] }) {
    const [search, setSearch] = useState('');

    const filteredArchives = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return archives;
        return archives.filter((archive) => {
            const biz = archive.inquiry.client?.business_name?.toLowerCase() ?? '';
            const contact = archive.inquiry.client?.contact_person?.toLowerCase() ?? '';
            const inqId = String(archive.inquiry.inquiry_id);
            const pkgs = archive.inquiry.customizations?.map((c) => c.packaging_type.toLowerCase()).join(' ') ?? '';
            return biz.includes(term) || contact.includes(term) || inqId.includes(term) || pkgs.includes(term);
        });
    }, [archives, search]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Archived chats" />

            <div className="bmanny-page">
                {/* Header Banner */}
                <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="border-l-4 border-amber-400 pl-3.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sales Workspace</p>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">ARCHIVED CHATS</h1>
                        <p className="text-xs text-muted-foreground sm:text-sm">Only you can see conversations you archived. Customer history is unchanged.</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Button
                            variant="outline"
                            className="h-10 rounded-lg border-border/80 bg-card px-4 text-xs font-semibold text-foreground shadow-sm hover:bg-muted"
                            asChild
                        >
                            <Link href={route('inquiries.index')}>
                                <ArrowLeft className="mr-2 h-4 w-4 text-muted-foreground" />
                                Back to Inquiries
                            </Link>
                        </Button>
                    </div>
                </header>

                {/* Filter & Search Bar */}
                <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border/70 bg-card px-5 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-foreground">
                        {filteredArchives.length}/{archives.length} Archived Chats
                    </p>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search Business, Contact, Inquiry ID"
                            className="h-9 w-full rounded-lg border border-input/80 bg-muted/20 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-80"
                        />
                    </div>
                </div>

                {/* Archived Chats Table / Card Rows */}
                {filteredArchives.length === 0 ? (
                    <div className="rounded-xl border border-border/70 bg-card py-16 text-center text-muted-foreground shadow-sm">
                        <ArchiveRestore className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                        <h2 className="text-base font-semibold text-foreground">No archived conversations</h2>
                        <p className="mt-1 text-xs">
                            {archives.length === 0
                                ? 'Archived chats will appear here when you need to restore one.'
                                : 'No archived chats match the search criteria.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] border-separate border-spacing-y-2.5 text-left text-sm">
                            <thead>
                                <tr>
                                    <th className="px-5 py-3 text-sm font-bold text-foreground">Lead</th>
                                    <th className="px-5 py-3 text-sm font-bold text-foreground">Request</th>
                                    <th className="px-5 py-3 text-sm font-bold text-foreground">Status</th>
                                    <th className="px-5 py-3 text-sm font-bold text-foreground">Archived Date</th>
                                    <th className="px-5 py-3 text-sm font-bold text-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredArchives.map((archive) => {
                                    const businessName = archive.inquiry.client?.business_name ?? `Inquiry #${archive.inquiry.inquiry_id}`;
                                    const contactPerson = archive.inquiry.client?.contact_person ?? 'Customer';
                                    const requestLabel =
                                        archive.inquiry.customizations?.map((c) => c.packaging_type).filter(Boolean).join(', ') || 'Inquiry';

                                    return (
                                        <tr
                                            key={archive.conversation_archive_id}
                                            className="group rounded-xl border border-border/70 bg-card shadow-xs transition-shadow hover:shadow-md"
                                        >
                                            {/* Lead */}
                                            <td className="rounded-l-xl border-y border-l border-border/70 p-5 align-middle">
                                                <p className="text-base font-bold text-foreground">{businessName}</p>
                                                <p className="text-sm font-medium text-muted-foreground">{contactPerson}</p>
                                                <p className="mt-1 text-xs font-semibold text-muted-foreground/70">#{archive.inquiry.inquiry_id}</p>
                                            </td>

                                            {/* Request */}
                                            <td className="border-y border-border/70 p-5 align-middle">
                                                <p className="text-base font-semibold text-foreground capitalize">{requestLabel}</p>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {archive.inquiry_count} {archive.inquiry_count === 1 ? 'chat message' : 'chat messages'}
                                                </p>
                                            </td>

                                            {/* Status */}
                                            <td className="border-y border-border/70 p-5 align-middle">
                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-700 dark:bg-slate-800/40 dark:text-slate-300 sm:text-base">
                                                    Archived
                                                </span>
                                            </td>

                                            {/* Archived Date */}
                                            <td className="border-y border-border/70 p-5 align-middle">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-base font-semibold text-foreground">
                                                        {formatDate(archive.archived_at)}
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 text-xs text-muted-foreground">Preserved in archive</p>
                                            </td>

                                            {/* Actions */}
                                            <td className="rounded-r-xl border-y border-r border-border/70 p-5 align-middle">
                                                <div className="flex items-center gap-2.5 min-w-[240px]">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-9 justify-start rounded-md bg-muted/60 px-3.5 text-xs font-semibold hover:bg-muted"
                                                        asChild
                                                    >
                                                        <Link href={route('chat.show', { inquiry_id: archive.inquiry.inquiry_id, archived: true })}>
                                                            <MessageSquare className="mr-1.5 h-4 w-4 text-muted-foreground shrink-0" />
                                                            <span className="whitespace-nowrap">View history</span>
                                                        </Link>
                                                    </Button>

                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-9 justify-start rounded-md bg-muted/60 px-3.5 text-xs font-semibold text-blue-600 hover:bg-muted dark:text-blue-400"
                                                        onClick={() => router.delete(route('chat.restore', archive.inquiry.inquiry_id))}
                                                    >
                                                        <ArchiveRestore className="mr-1.5 h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                                        <span className="whitespace-nowrap">Restore</span>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
