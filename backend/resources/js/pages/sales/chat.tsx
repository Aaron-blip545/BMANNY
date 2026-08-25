import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Send } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface Message {
    message_id: number;
    body: string;
    sent_by_me: boolean;
    sender_name: string;
    created_at: string;
    is_read: boolean;
}

interface InquiryInfo {
    inquiry_id: number;
    status: string;
    business: string;
    contact: string;
    customer_id: number | null;
}

interface Props {
    inquiry: InquiryInfo;
    messages: Message[];
    agentId: number;
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function ChatPage({ inquiry, messages }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Inquiries', href: '/inquiries' },
        { title: `Chat — ${inquiry.business}`, href: `/inquiries/${inquiry.inquiry_id}/chat` },
    ];

    const { data, setData, post, processing, reset } = useForm({ message_body: '' });

    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Scroll to the latest message whenever messages change.
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!data.message_body.trim()) return;
        post(route('chat.send', inquiry.inquiry_id), {
            onSuccess: () => {
                reset('message_body');
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Chat — ${inquiry.business}`} />

            <main className="bmanny-page flex h-[calc(100vh-64px)] flex-col">

                {/* ── Header ── */}
                <div className="bmanny-page-header mb-4 flex items-start gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('inquiries.index')}>
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Inquiries
                        </Link>
                    </Button>

                    <div className="flex-1">
                        <h1 className="text-xl font-semibold tracking-tight">{inquiry.business}</h1>
                        <p className="text-sm text-muted-foreground">
                            {inquiry.contact} &nbsp;·&nbsp; Inquiry #{inquiry.inquiry_id} &nbsp;·&nbsp;
                            <span className="capitalize">{inquiry.status}</span>
                        </p>
                    </div>
                </div>

                {/* ── Message Thread ── */}
                <Card className="bmanny-workspace flex flex-1 flex-col overflow-hidden">
                    <CardContent className="flex flex-1 flex-col overflow-hidden p-0">

                        {/* Scrollable message list */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
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
                                        <div
                                            className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                                                msg.sent_by_me
                                                    ? 'rounded-tr-sm bg-primary text-primary-foreground'
                                                    : 'rounded-tl-sm bg-muted text-foreground'
                                            }`}
                                        >
                                            {msg.body}
                                        </div>
                                    </div>
                                ))
                            )}
                            {/* Invisible anchor to scroll to */}
                            <div ref={bottomRef} />
                        </div>

                        {/* ── Compose Bar ── */}
                        <div className="border-t border-border bg-background px-4 py-3">
                            {inquiry.customer_id === null ? (
                                <p className="text-center text-xs text-destructive">
                                    No customer account linked to this inquiry — cannot send messages.
                                </p>
                            ) : (
                                <form onSubmit={handleSubmit} className="flex items-end gap-3">
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
                                        disabled={processing || !data.message_body.trim()}
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
        </AppLayout>
    );
}
