import { BmannyMetricCard } from '@/components/bmanny-metric-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Archive, CalendarClock, CircleCheck, CircleX, ClipboardList, MessageSquare, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Inquiries', href: '/inquiries' }];
const LEAD_STATUSES = ['new', 'for_quotation', 'quotation_sent', 'follow_up', 'converted', 'closed'] as const;

type LeadStatus = (typeof LEAD_STATUSES)[number];

interface Customization {
    customization_id: number;
    packaging_type: string;
    selected_package: string | null;
}

interface FollowUp {
    id: number;
    follow_up_date: string;
    note: string;
    completed_at: string | null;
    completion_note: string | null;
    creator: { full_name: string } | null;
}

interface Inquiry {
    inquiry_id: number;
    status: LeadStatus;
    created_at: string;
    cancelled_at: string | null;
    client: { business_name: string; contact_person: string; user: { email: string } | null } | null;
    customizations: Customization[];
    quotation: null | { quotation_id: number };
    product_request_review: null | { status: 'pending' | 'available' | 'alternative' | 'unavailable'; response_notes: string | null };
    follow_ups: FollowUp[];
}

interface Props { inquiries: Inquiry[]; }

function formatDate(value: string) {
    return new Date(value).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatFollowUpDateTime(value: string) {
    return new Date(value).toLocaleString('en-PH', {
        year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
}

function localDateTimeValue(date = new Date()) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
}

function statusLabel(status: LeadStatus) {
    return ({
        new: 'New',
        for_quotation: 'For Quotation',
        quotation_sent: 'Quotation Sent',
        follow_up: 'Follow-up',
        converted: 'Converted',
        closed: 'Closed',
    } as Record<LeadStatus, string>)[status];
}

function openFollowUp(inquiry: Inquiry) {
    return inquiry.follow_ups.find((followUp) => !followUp.completed_at);
}

export default function InquiriesPage({ inquiries }: Props) {
    const page = usePage();
    const { flash } = page.props as any;
    const notificationInquiryId = Number(new URLSearchParams(page.url.split('?')[1] ?? '').get('inquiry_id')) || null;
    const notificationInquiryRow = useRef<HTMLTableRowElement>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all');
    const [followUpFor, setFollowUpFor] = useState<Inquiry | null>(null);
    const [followUpDate, setFollowUpDate] = useState(localDateTimeValue());
    const [followUpNote, setFollowUpNote] = useState('');
    const [completingFollowUp, setCompletingFollowUp] = useState<FollowUp | null>(null);
    const [completionNote, setCompletionNote] = useState('');
    const [historyFor, setHistoryFor] = useState<Inquiry | null>(null);

    useEffect(() => {
        if (!notificationInquiryId) return;

        const frame = window.requestAnimationFrame(() => {
            notificationInquiryRow.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        return () => window.cancelAnimationFrame(frame);
    }, [notificationInquiryId, inquiries]);

    const filteredInquiries = useMemo(() => {
        const term = search.trim().toLowerCase();
        return inquiries.filter((inquiry) => {
            if (statusFilter !== 'all' && inquiry.status !== statusFilter) return false;
            if (!term) return true;
            return String(inquiry.inquiry_id).includes(term)
                || (inquiry.client?.business_name.toLowerCase().includes(term) ?? false)
                || (inquiry.client?.contact_person.toLowerCase().includes(term) ?? false)
                || (inquiry.client?.user?.email.toLowerCase().includes(term) ?? false);
        });
    }, [inquiries, search, statusFilter]);

    const scheduleFollowUp = () => {
        if (!followUpFor || !followUpDate || !followUpNote.trim()) return;
        router.post(route('inquiries.follow-ups.store', followUpFor.inquiry_id), {
            follow_up_date: followUpDate,
            note: followUpNote.trim(),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setFollowUpFor(null);
                setFollowUpNote('');
            },
        });
    };

    const completeFollowUp = () => {
        if (!completingFollowUp) return;

        router.patch(route('follow-ups.complete', completingFollowUp.id), {
            completion_note: completionNote.trim() || null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setCompletingFollowUp(null);
                setCompletionNote('');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Lead Management" />

            <div className="bmanny-page">
                <header className="bmanny-page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="bmanny-page-eyebrow">Sales Workspace</p>
                        <h1 className="text-2xl font-semibold tracking-tight">Lead Management</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Track every inquiry from first contact through quotation, follow-up, and conversion.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild><Link href={route('archived-chats.index')}><Archive className="mr-2 h-4 w-4" />Archived chats</Link></Button>
                        <Button asChild><Link href={route('quotations.create')}><Plus className="mr-2 h-4 w-4" />New Quotation</Link></Button>
                    </div>
                </header>

                {(flash?.success || flash?.error) && <div className="mb-4 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground">{flash.success ?? flash.error}</div>}

                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                        { label: 'New', value: inquiries.filter((item) => item.status === 'new').length, icon: ClipboardList, accent: 'blue' as const, description: 'New customer leads' },
                        { label: 'Follow-up', value: inquiries.filter((item) => item.status === 'follow_up').length, icon: CalendarClock, accent: 'gold' as const, description: 'Needs customer contact' },
                        { label: 'Quotation Sent', value: inquiries.filter((item) => item.status === 'quotation_sent').length, icon: CircleCheck, accent: 'green' as const, description: 'Awaiting customer action' },
                        { label: 'Converted', value: inquiries.filter((item) => item.status === 'converted').length, icon: CircleCheck, accent: 'green' as const, description: 'Converted to orders' },
                    ].map((item) => <BmannyMetricCard key={item.label} {...item} />)}
                </div>

                <div className="bmanny-workspace mb-4 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-sm font-medium text-foreground">{filteredInquiries.length} of {inquiries.length} leads</p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search business, contact, email…" className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-72" /></div>
                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | LeadStatus)} className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                            <option value="all">All statuses</option>
                            {LEAD_STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                        </select>
                    </div>
                </div>

                <Card className="bmanny-workspace overflow-hidden"><CardContent className="p-0">
                    {filteredInquiries.length === 0 ? <div className="bmanny-empty-state py-16 text-muted-foreground"><ClipboardList /><h2 className="text-base font-semibold text-foreground">No leads found</h2><p className="mt-1 text-sm">No inquiries match the selected filter.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="p-4 font-medium">Lead</th><th className="p-4 font-medium">Request</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Next follow-up</th><th className="p-4 font-medium">History</th><th className="p-4 font-medium">Actions</th></tr></thead><tbody>
                        {filteredInquiries.map((inquiry) => {
                            const followUp = openFollowUp(inquiry);
                            const quoteAllowed = !inquiry.quotation && ['new', 'for_quotation', 'follow_up'].includes(inquiry.status);
                            const inactive = inquiry.status === 'converted' || inquiry.status === 'closed' || Boolean(inquiry.cancelled_at);
                            return <tr key={inquiry.inquiry_id} ref={inquiry.inquiry_id === notificationInquiryId ? notificationInquiryRow : undefined} className="border-b border-border/50 align-top transition-colors last:border-0 hover:bg-muted/50">
                                <td className="p-4"><p className="font-medium">{inquiry.client?.business_name ?? '—'}</p><p className="mt-1 text-xs text-muted-foreground">#{inquiry.inquiry_id} · {inquiry.client?.contact_person ?? 'No contact'}</p><p className="mt-1 text-xs text-muted-foreground">{inquiry.client?.user?.email ?? ''}</p></td>
                                <td className="p-4"><div className="flex flex-wrap gap-1">{inquiry.customizations.length ? inquiry.customizations.map((item) => <span key={item.customization_id} className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">{item.selected_package ?? item.packaging_type}</span>) : <span className="text-muted-foreground">No package details</span>}</div><p className="mt-2 text-xs text-muted-foreground">Received {formatDate(inquiry.created_at)}</p></td>
                                <td className="p-4"><span className="rounded-full bg-muted px-2.5 py-1.5 text-xs font-medium">{statusLabel(inquiry.cancelled_at ? 'closed' : inquiry.status)}</span></td>
                                <td className="p-4">{followUp ? <><p className="font-medium text-foreground">{formatFollowUpDateTime(followUp.follow_up_date)}</p><p className="mt-1 max-w-48 text-xs text-muted-foreground">{followUp.note}</p><Button className="mt-2" size="sm" variant="outline" onClick={() => { setCompletingFollowUp(followUp); setCompletionNote(''); }}>Mark done</Button></> : <span className="text-xs text-muted-foreground">Not scheduled</span>}</td>
                                <td className="p-4"><p className="text-xs font-medium text-foreground">{inquiry.follow_ups.length} follow-up{inquiry.follow_ups.length === 1 ? '' : 's'}</p>{inquiry.follow_ups.slice(0, 2).map((item) => <p key={item.id} className="mt-1 max-w-44 text-xs text-muted-foreground">{formatFollowUpDateTime(item.follow_up_date)} · {item.completed_at ? 'Done' : 'Open'}</p>)}{inquiry.follow_ups.length > 0 && <Button className="mt-2" variant="ghost" size="sm" onClick={() => setHistoryFor(inquiry)}>View history</Button>}</td>
                                <td className="p-4"><div className="flex flex-wrap gap-2"><Button variant="ghost" size="sm" asChild><Link href={route('chat.show', inquiry.inquiry_id)}><MessageSquare className="mr-1 h-3.5 w-3.5" />Chat</Link></Button><Button variant="ghost" size="sm" disabled={inactive || inquiry.product_request_review?.status === 'pending'} onClick={() => router.post(route('inquiries.product-request.submit', inquiry.inquiry_id))}>{inquiry.product_request_review ? 'Resend review' : 'Product review'}</Button>{quoteAllowed && <Button variant="outline" size="sm" asChild><Link href={route('quotations.create', { inquiry_id: inquiry.inquiry_id })}>Quote</Link></Button>}<Button variant="outline" size="sm" disabled={inactive} onClick={() => { setFollowUpFor(inquiry); setFollowUpDate(localDateTimeValue()); setFollowUpNote(''); }}><CalendarClock className="mr-1 h-3.5 w-3.5" />Follow up</Button></div></td>
                            </tr>;
                        })}
                    </tbody></table></div>}
                </CardContent></Card>
            </div>

            <Dialog open={Boolean(followUpFor)} onOpenChange={(open) => !open && setFollowUpFor(null)}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Schedule follow-up</DialogTitle><DialogDescription>{followUpFor?.client?.business_name ?? 'This lead'} will move to Follow-up until you update its stage.</DialogDescription></DialogHeader><div className="space-y-4"><label className="block text-sm font-medium">Follow-up date and time<input type="datetime-local" min={localDateTimeValue()} value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></label><label className="block text-sm font-medium">What is the next action?<textarea value={followUpNote} onChange={(event) => setFollowUpNote(event.target.value)} maxLength={2000} rows={4} placeholder="Example: Call to confirm the preferred package and quantity." className="mt-1.5 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm" /></label></div><DialogFooter><Button variant="outline" onClick={() => setFollowUpFor(null)}>Cancel</Button><Button onClick={scheduleFollowUp} disabled={!followUpDate || !followUpNote.trim()}>Save follow-up</Button></DialogFooter></DialogContent></Dialog>
            <Dialog open={Boolean(completingFollowUp)} onOpenChange={(open) => !open && setCompletingFollowUp(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Complete follow-up</DialogTitle>
                        <DialogDescription>Record the outcome so the lead history explains what Sales discussed or needs to do next.</DialogDescription>
                    </DialogHeader>
                    <label className="block text-sm font-medium">Outcome note
                        <textarea value={completionNote} onChange={(event) => setCompletionNote(event.target.value)} maxLength={2000} rows={4} placeholder="Example: Customer requested a revised quotation next week." className="mt-1.5 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm" />
                    </label>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCompletingFollowUp(null)}>Cancel</Button>
                        <Button onClick={completeFollowUp}>Mark follow-up complete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={Boolean(historyFor)} onOpenChange={(open) => !open && setHistoryFor(null)}>
                <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Follow-up history</DialogTitle>
                        <DialogDescription>{historyFor?.client?.business_name ?? 'This lead'}: every scheduled action and its outcome.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        {historyFor?.follow_ups.map((followUp) => (
                            <article key={followUp.id} className="rounded-lg border border-border p-3 text-sm">
                                <div className="flex items-start justify-between gap-3"><p className="font-medium">{formatFollowUpDateTime(followUp.follow_up_date)}</p><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{followUp.completed_at ? 'Done' : 'Open'}</span></div>
                                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Planned action</p>
                                <p className="mt-1 whitespace-pre-wrap">{followUp.note}</p>
                                {followUp.completed_at && <><p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Outcome</p><p className="mt-1 whitespace-pre-wrap">{followUp.completion_note || 'No outcome note recorded.'}</p></>}
                            </article>
                        ))}
                    </div>
                    <DialogFooter><Button onClick={() => setHistoryFor(null)}>Close</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
