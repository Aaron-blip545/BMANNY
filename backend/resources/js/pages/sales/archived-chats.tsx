import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArchiveRestore, ArrowLeft, MessageSquare } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Archived chats', href: '/archived-chats' }];

interface Archive {
    conversation_archive_id: number;
    archived_at: string;
    inquiry_count: number;
    inquiry: {
        inquiry_id: number;
        client: { business_name: string; contact_person: string } | null;
        customizations?: Array<{ packaging_type: string }>;
    };
}

export default function ArchivedChats({ archives }: { archives: Archive[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Archived chats" />
            <div className="bmanny-page space-y-6">
                <header className="bmanny-page-header flex items-center justify-between gap-4">
                    <div>
                        <p className="bmanny-page-eyebrow">Sales workspace</p>
                        <h1 className="text-2xl font-semibold tracking-tight">Archived chats</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Only you can see conversations you archived. Customer history is unchanged.</p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={route('inquiries.index')}><ArrowLeft className="mr-2 h-4 w-4" />Inquiries</Link>
                    </Button>
                </header>

                <Card className="bmanny-workspace">
                    <CardContent className="p-0">
                        {archives.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-16 text-center">
                                <ArchiveRestore className="h-8 w-8 text-muted-foreground" />
                                <p className="font-medium">No archived conversations</p>
                                <p className="text-sm text-muted-foreground">Archived chats will appear here when you need to restore one.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {archives.map((archive) => (
                                    <div key={archive.conversation_archive_id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="font-medium">{archive.inquiry.client?.business_name ?? `Inquiry #${archive.inquiry.inquiry_id}`}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {archive.inquiry_count} inquiry {archive.inquiry_count === 1 ? 'chat' : 'chats'} archived · {archive.inquiry.client?.contact_person ?? 'Customer'} · Archived {new Date(archive.archived_at).toLocaleDateString('en-PH')}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" asChild><Link href={route('chat.show', { inquiry_id: archive.inquiry.inquiry_id, archived: true })}><MessageSquare className="mr-2 h-4 w-4" />View history</Link></Button>
                                            <Button onClick={() => router.delete(route('chat.restore', archive.inquiry.inquiry_id))}><ArchiveRestore className="mr-2 h-4 w-4" />Restore</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
