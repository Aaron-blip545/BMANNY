import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Archive, ArrowLeft, EyeOff, Image as ImageIcon, Lock, LockOpen, RotateCcw, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Message {
    message_id: number;
    body: string | null;
    image_url: string | null;
    sent_by_me: boolean;
    sender_name: string;
    created_at: string;
    is_read: boolean;
    is_flagged: boolean;
}

interface InquiryInfo {
    inquiry_id: number;
    status: string;
    business: string;
    contact: string;
    customer_id: number | null;
    inquiry_count: number;
}

interface Props {
    inquiry: InquiryInfo;
    messages: Message[];
    agentId: number;
    isArchived: boolean;
    isArchiveHistory: boolean;
    canModerate: boolean;
    canReply: boolean;
    isConversationClosed: boolean;
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function ChatPage({ inquiry, messages, isArchived, isArchiveHistory, canModerate, canReply, isConversationClosed }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: isArchiveHistory ? 'Archived chats' : 'Inquiries', href: isArchiveHistory ? '/archived-chats' : '/inquiries' },
        { title: `Chat — ${inquiry.business}`, href: `/inquiries/${inquiry.inquiry_id}/chat` },
    ];

    const { data, setData, post, processing, reset } = useForm<{
        message_body: string;
        image: File | null;
    }>({
        message_body: '',
        image: null,
    });

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedLightboxImage, setSelectedLightboxImage] = useState<string | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Scroll to the latest message whenever messages change.
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Poll for new messages every 4 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['messages', 'canReply', 'isConversationClosed'] });
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setData('image', file);
            setImagePreview(URL.createObjectURL(file));
        }
    }

    function removeImage() {
        setData('image', null);
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
            setImagePreview(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!data.message_body.trim() && !data.image) return;

        post(route('chat.send', inquiry.inquiry_id), {
            forceFormData: true,
            onSuccess: () => {
                reset('message_body', 'image');
                removeImage();
                textareaRef.current?.focus();
            },
        });
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        // Ctrl+Enter or Cmd+Enter to send
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSubmit(e as any);
        }
    }

    function handleArchiveToggle() {
        if (isArchived) {
            router.delete(route('chat.restore', inquiry.inquiry_id));
            return;
        }

        router.post(route('chat.archive', inquiry.inquiry_id));
    }

    function handleHideMessage(messageId: number) {
        const reason = window.prompt('Why is this message inappropriate? The sender will receive this reason.');
        if (!reason?.trim()) return;

        router.post(route('chat.messages.hide', {
            inquiry_id: inquiry.inquiry_id,
            message_id: messageId,
        }), { reason: reason.trim() });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Chat — ${inquiry.business}`} />

            <main className="bmanny-page flex h-[calc(100vh-64px)] flex-col">

                {/* ── Header ── */}
                <div className="bmanny-page-header mb-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={isArchiveHistory ? route('archived-chats.index') : route('inquiries.index')}>
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                {isArchiveHistory ? 'Archived chats' : 'Inquiries'}
                            </Link>
                        </Button>

                        <div>
                            <h1 className="text-xl font-semibold tracking-tight">{inquiry.business}</h1>
                            <p className="text-sm text-muted-foreground">
                                {inquiry.contact} &nbsp;·&nbsp; Inquiry #{inquiry.inquiry_id} &nbsp;·&nbsp;
                                <span className="capitalize">{inquiry.status}</span>
                            </p>
                            {canModerate && <p className="mt-1 text-xs font-medium text-muted-foreground">Customer-wide conversation · {inquiry.inquiry_count} {inquiry.inquiry_count === 1 ? 'inquiry' : 'inquiries'}</p>}
                            {isArchived && <p className="mt-1 text-xs font-medium text-muted-foreground">Archived history · read-only conversation view</p>}
                            {!isArchived && !canReply && <p className="mt-1 text-xs font-medium text-muted-foreground">Admin oversight · read-only conversation view</p>}
                        </div>
                    </div>

                    <Button variant="outline" size="sm" onClick={handleArchiveToggle}>
                        {isArchived ? <RotateCcw className="mr-1.5 h-4 w-4" /> : <Archive className="mr-1.5 h-4 w-4" />}
                        {isArchived ? 'Restore Conversation' : 'Archive Conversation'}
                    </Button>
                    {canModerate && (
                        <Button
                            variant={isConversationClosed ? 'outline' : 'destructive'}
                            size="sm"
                            onClick={() => isConversationClosed
                                ? router.delete(route('chat.reopen', inquiry.inquiry_id))
                                : router.post(route('chat.close', inquiry.inquiry_id))}
                        >
                            {isConversationClosed ? <LockOpen className="mr-1.5 h-4 w-4" /> : <Lock className="mr-1.5 h-4 w-4" />}
                            {isConversationClosed ? 'Reopen conversation' : 'Close conversation'}
                        </Button>
                    )}
                    {canModerate && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('moderation.messages.index')}>Flagged messages</Link>
                        </Button>
                    )}
                </div>

                {/* ── Message Thread ── */}
                <Card className="bmanny-workspace flex flex-1 flex-col overflow-hidden">
                    <CardContent className="flex flex-1 flex-col overflow-hidden p-0">

                        {/* Scrollable message list */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                            {messages.length === 0 ? (
                                <div className="flex h-full items-center justify-center">
                                    <p className="text-sm text-muted-foreground">
                                        No messages yet. Start the conversation below.
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.message_id}
                                        className={`flex flex-col ${msg.sent_by_me ? 'items-end' : 'items-start'}`}
                                    >
                                        {/* Sender label */}
                                        <span className="mb-1 text-xs text-muted-foreground">
                                            {msg.sent_by_me ? 'You' : msg.sender_name}
                                            &nbsp;·&nbsp;{formatTime(msg.created_at)}
                                        </span>

                                        {/* Bubble */}
                                        {msg.is_flagged ? (
                                            <div className="max-w-[75%] rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
                                                This message was flagged by an administrator as inappropriate. Its content is hidden from staff.
                                            </div>
                                        ) : (
                                            <div
                                                className={`max-w-[75%] md:max-w-[60%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
                                                    msg.sent_by_me
                                                        ? 'rounded-tr-sm bg-primary text-primary-foreground'
                                                        : 'rounded-tl-sm bg-muted text-foreground'
                                                }`}
                                            >
                                                {msg.image_url && (
                                                    <div className="mb-2 overflow-hidden rounded-xl bg-black/5">
                                                        <img
                                                            src={msg.image_url}
                                                            alt="Chat attachment"
                                                            className="max-h-72 w-auto max-w-full rounded-xl object-cover cursor-pointer transition-transform hover:scale-[1.01]"
                                                            onClick={() => setSelectedLightboxImage(msg.image_url)}
                                                        />
                                                    </div>
                                                )}
                                                {msg.body && <div className="whitespace-pre-wrap">{msg.body}</div>}
                                            </div>
                                        )}
                                        {canModerate && !msg.is_flagged && (
                                            <button
                                                type="button"
                                                onClick={() => handleHideMessage(msg.message_id)}
                                                className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                                            >
                                                <EyeOff className="h-3 w-3" />
                                                Flag inappropriate
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                            {/* Invisible anchor to scroll to */}
                            <div ref={bottomRef} />
                        </div>

                        {/* ── Image Preview Pill (if selected) ── */}
                        {imagePreview && (
                            <div className="border-t border-border bg-muted/40 px-4 py-2 flex items-center gap-3">
                                <div className="relative inline-block">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="h-16 w-16 rounded-lg object-cover border border-border"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow hover:bg-destructive/90"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                                <span className="text-xs text-muted-foreground">Image ready to send</span>
                            </div>
                        )}

                        {/* ── Compose Bar ── */}
                        <div className="border-t border-border bg-background px-4 py-3">
                            {!canReply ? (
                                <p className="text-center text-xs text-muted-foreground">{isConversationClosed ? 'This conversation was closed by an administrator. It is read-only until reopened.' : 'Sales agents reply to customers. Admin can supervise and hide inappropriate messages from staff views.'}</p>
                            ) : inquiry.customer_id === null ? (
                                <p className="text-center text-xs text-destructive">
                                    No customer account linked to this inquiry — cannot send messages.
                                </p>
                            ) : (
                                <form onSubmit={handleSubmit} className="flex items-end gap-3">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
                                        title="Attach image"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <ImageIcon className="h-4 w-4" />
                                    </Button>

                                    <textarea
                                        ref={textareaRef}
                                        id="message_body"
                                        rows={2}
                                        placeholder="Type a message… (Ctrl+Enter to send)"
                                        value={data.message_body}
                                        onChange={(e) => setData('message_body', e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />

                                    <Button
                                        type="submit"
                                        disabled={processing || (!data.message_body.trim() && !data.image)}
                                        className="shrink-0"
                                    >
                                        <Send className="mr-1.5 h-4 w-4" />
                                        Send
                                    </Button>
                                </form>
                            )}
                        </div>

                    </CardContent>
                </Card>
            </main>

            {/* ── Lightbox Image Modal ── */}
            <Dialog open={!!selectedLightboxImage} onOpenChange={(open) => !open && setSelectedLightboxImage(null)}>
                <DialogContent className="max-w-3xl p-2 bg-background border-border">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Image View</DialogTitle>
                    </DialogHeader>
                    {selectedLightboxImage && (
                        <div className="flex items-center justify-center p-2">
                            <img
                                src={selectedLightboxImage}
                                alt="Enlarged view"
                                className="max-h-[80vh] w-auto max-w-full rounded-md object-contain"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </AppLayout>
    );
}
