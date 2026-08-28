import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Eye, ShieldAlert, Undo2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Flagged messages', href: '/moderation/messages' }];

interface Moderation {
    message_moderation_id: number;
    reason: string;
    hidden_at: string;
    hidden_by: { full_name: string } | null;
    message: {
        message_id: number;
        message_body: string | null;
        image_url: string | null;
        sender: { full_name: string } | null;
        receiver: { full_name: string } | null;
        inquiry: { inquiry_id: number; client: { business_name: string } | null } | null;
    } | null;
}

export default function HiddenMessages({ moderations }: { moderations: Moderation[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Flagged messages" />
            <div className="bmanny-page space-y-6">
                <header className="bmanny-page-header flex items-center justify-between gap-4">
                    <div>
                        <p className="bmanny-page-eyebrow">Admin moderation</p>
                        <h1 className="text-2xl font-semibold tracking-tight">Flagged messages</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Original content is retained here for audit. Customers keep their own chat history.</p>
                    </div>
                    <Button variant="outline" asChild><Link href={route('inquiries.index')}><ArrowLeft className="mr-2 h-4 w-4" />Inquiries</Link></Button>
                </header>

                {moderations.length === 0 ? (
                    <Card className="bmanny-workspace"><CardContent className="flex flex-col items-center gap-2 py-16 text-center"><ShieldAlert className="h-8 w-8 text-muted-foreground" /><p className="font-medium">No flagged messages</p><p className="text-sm text-muted-foreground">Messages flagged by an administrator will be available here for review.</p></CardContent></Card>
                ) : (
                    <div className="space-y-4">
                        {moderations.map((moderation) => (
                            <Card key={moderation.message_moderation_id} className="bmanny-workspace">
                                <CardContent className="space-y-4 p-5">
                                    <div className="flex flex-col justify-between gap-3 sm:flex-row">
                                        <div>
                                            <p className="font-semibold">{moderation.message?.sender?.full_name ?? 'Unknown sender'} → {moderation.message?.receiver?.full_name ?? 'Unknown recipient'}</p>
                                            <p className="text-sm text-muted-foreground">{moderation.message?.inquiry?.client?.business_name ?? 'Direct conversation'} · Inquiry #{moderation.message?.inquiry?.inquiry_id ?? '—'}</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Flagged by {moderation.hidden_by?.full_name ?? 'Admin'} · {new Date(moderation.hidden_at).toLocaleString('en-PH')}</p>
                                    </div>

                                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200">Reason</p>
                                        <p className="mt-1 text-sm">{moderation.reason}</p>
                                    </div>

                                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Original message</p>
                                        {moderation.message?.image_url && <img src={moderation.message.image_url} alt="Flagged attachment" className="mb-3 max-h-64 rounded-md object-contain" />}
                                        <p className="whitespace-pre-wrap text-sm">{moderation.message?.message_body || 'Image attachment only'}</p>
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        {moderation.message?.inquiry && <Button variant="outline" asChild><Link href={route('chat.show', moderation.message.inquiry.inquiry_id)}><Eye className="mr-2 h-4 w-4" />Open conversation</Link></Button>}
                                        {moderation.message && <Button variant="outline" onClick={() => router.delete(route('moderation.messages.restore', moderation.message!.message_id))}><Undo2 className="mr-2 h-4 w-4" />Restore to staff</Button>}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
