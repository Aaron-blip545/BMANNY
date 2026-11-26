import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Archive,
    Calendar,
    CalendarClock,
    CheckCircle2,
    ChevronDown,
    ClipboardList,
    Clock,
    FileCheck,
    FilePenLine,
    FileText,
    History,
    Layers,
    MapPin,
    MessageSquare,
    Plus,
    Search,
    Send,
    Sparkles,
    UserCheck,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Inquiries', href: '/inquiries' }];
const LEAD_STATUSES = ['new', 'for_quotation', 'quotation_sent', 'converted', 'cancelled'] as const;

type LeadStatus = (typeof LEAD_STATUSES)[number];

interface Customization {
    customization_id: number;
    customization_type?: string | null;
    packaging_type: string;
    packaging_finish?: string | null;
    serving_size?: string | null;
    formulation_notes?: string | null;
    requested_ingredient_note?: string | null;
    design_file_path?: string | null;
    client_notes?: string | null;
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

interface ReorderHistoryEntry {
    inquiry_id: number;
    inquiry_type: string;
    reorder_batch_quantity: number | null;
    status: string;
    created_at: string;
    cancelled_at: string | null;
    quotation?: {
        quotation_id: number;
        total_amount?: string | number;
        order?: { order_id: number; status: string } | null;
    } | null;
}

interface PackagingBalanceInfo {
    balance_id: number;
    source_order_id?: number | null;
    brand_name: string;
    package_slug: string;
    total_pouches: number;
    used_pouches: number;
    remaining_pouches: number;
    expires_at: string | null;
    status: string;
    inquiries?: ReorderHistoryEntry[];
}

interface Inquiry {
    inquiry_id: number;
    status: LeadStatus;
    inquiry_type?: 'new' | 'reorder_batch' | 'packaging_replenishment' | string;
    reorder_batch_quantity?: number | null;
    source_order_id?: number | null;
    packaging_balance?: PackagingBalanceInfo | null;
    created_at: string;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    client: { business_name: string; contact_person: string; business_address?: string | null; user: { email: string } | null } | null;
    customizations: Customization[];
    quotation: null | {
        quotation_id: number;
        total_amount?: string | number;
        initial_payment_amount?: string | number | null;
        balance_payment_amount?: string | number | null;
        item_details?: string | null;
        status?: string;
    };
    product_request_review: null | { status: 'pending' | 'available' | 'alternative' | 'unavailable'; response_notes: string | null };
    follow_ups: FollowUp[];
}

interface Props {
    inquiries: Inquiry[];
}

function formatDate(value: string) {
    return new Date(value).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatFollowUpDateTime(value: string) {
    return new Date(value).toLocaleString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
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
        converted: 'Converted',
        cancelled: 'Cancelled',
    } as Record<LeadStatus, string>)[status];
}

function getStatusConfig(status: string) {
    switch (status) {
        case 'cancelled':
            return {
                label: 'Cancelled',
                pill: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
            };
        case 'new':
            return {
                label: 'New',
                pill: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
            };
        case 'for_quotation':
            return {
                label: 'For Quotation',
                pill: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
            };
        case 'quotation_sent':
            return {
                label: 'Quotation Sent',
                pill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
            };
        case 'converted':
        default:
            return {
                label: 'Converted',
                pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
            };
    }
}

function openFollowUp(inquiry: Inquiry) {
    return inquiry.follow_ups.find((followUp) => !followUp.completed_at);
}

function parseClientNotes(raw?: string | null): Array<{ label: string; value: string }> | null {
    if (!raw || !raw.includes('|')) return null;
    const entries = raw
        .split('|')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
            const colonIdx = part.indexOf(':');
            if (colonIdx > 0 && colonIdx < 40) {
                return {
                    label: part.slice(0, colonIdx).trim(),
                    value: part.slice(colonIdx + 1).trim(),
                };
            }
            return { label: 'Note', value: part };
        })
        .filter((item) => item.value.length > 0);
    return entries.length > 0 ? entries : null;
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PERIODS = ['AM', 'PM'] as const;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const CURRENT_YEAR = new Date().getFullYear();

function getDaysInMonth(year: string, monthName: string) {
    const monthIndex = MONTH_NAMES.indexOf(monthName as any);
    const count = new Date(parseInt(year, 10), monthIndex + 1, 0).getDate();
    return Array.from({ length: count }, (_, i) => String(i + 1).padStart(2, '0'));
}

function getHour24(hour12: string, period: 'AM' | 'PM'): number {
    const h = parseInt(hour12, 10);
    if (period === 'PM') {
        return h === 12 ? 12 : h + 12;
    } else {
        return h === 12 ? 0 : h;
    }
}

function isPastDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return false;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const check = new Date(y, m - 1, d).getTime();
    return check < today;
}

function isPastDateTime(dateStr: string, time24Str: string) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hh, mm] = time24Str.split(':').map(Number);
    if (!y || !m || !d || isNaN(hh) || isNaN(mm)) return false;
    const target = new Date(y, m - 1, d, hh, mm, 0, 0);
    const now = new Date();
    return target.getTime() < now.getTime() - 30_000;
}

function isTodayDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return false;
    const now = new Date();
    return (
        y === now.getFullYear() &&
        m === now.getMonth() + 1 &&
        d === now.getDate()
    );
}

function getInitialFollowUpDateTime() {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0);
    return localDateTimeValue(d);
}

function splitTime24(time24: string) {
    const [hStr = '09', mStr = '00'] = time24.split(':');
    let h = parseInt(hStr, 10);
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return {
        hour: String(h).padStart(2, '0'),
        minute: mStr.padStart(2, '0'),
        period: period as 'AM' | 'PM',
    };
}

function joinTime24(hour: string, minute: string, period: 'AM' | 'PM') {
    let h = parseInt(hour, 10);
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${minute}`;
}

function splitDateParts(dateStr: string) {
    const [y = '2026', m = '11', d = '25'] = dateStr.split('-');
    const monthIndex = Math.max(0, Math.min(11, parseInt(m, 10) - 1));
    return {
        year: y,
        monthName: MONTH_NAMES[monthIndex],
        day: d.padStart(2, '0'),
    };
}

function joinDateParts(year: string, monthName: string, day: string) {
    const monthNum = String(MONTH_NAMES.indexOf(monthName as any) + 1).padStart(2, '0');
    return `${year}-${monthNum}-${day}`;
}

function WheelColumn<T extends string>({
    items,
    value,
    onChange,
    widthClass = 'w-16',
    isItemDisabled,
}: {
    items: readonly T[] | T[];
    value: T;
    onChange: (value: T) => void;
    widthClass?: string;
    isItemDisabled?: (item: T) => boolean;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const ITEM_HEIGHT = 38;
    const initialIndex = Math.max(0, items.indexOf(value));
    const [activeIdx, setActiveIdx] = useState(initialIndex);

    const isDraggingRef = useRef(false);
    const startYRef = useRef(0);
    const startScrollTopRef = useRef(0);
    const lastYRef = useRef(0);
    const lastTimeRef = useRef(0);
    const velocityRef = useRef(0);
    const hasMovedRef = useRef(false);
    const scrollEndTimer = useRef<number | null>(null);

    useEffect(() => {
        let index = items.indexOf(value);
        if (index !== -1) {
            if (isItemDisabled && isItemDisabled(items[index])) {
                let bestIdx = -1;
                let minDist = Infinity;
                for (let i = 0; i < items.length; i++) {
                    if (!isItemDisabled(items[i])) {
                        const dist = Math.abs(i - index);
                        if (dist < minDist) {
                            minDist = dist;
                            bestIdx = i;
                        }
                    }
                }
                if (bestIdx !== -1) {
                    index = bestIdx;
                    onChange(items[index]);
                }
            }
            setActiveIdx(index);
            if (!isDraggingRef.current && containerRef.current) {
                containerRef.current.scrollTop = index * ITEM_HEIGHT;
            }
        }
    }, [value, items, isItemDisabled]);

    const updateActiveIndexFromScroll = () => {
        if (!containerRef.current) return activeIdx;
        const scrollTop = containerRef.current.scrollTop;
        const index = Math.min(Math.max(0, Math.round(scrollTop / ITEM_HEIGHT)), items.length - 1);
        setActiveIdx(index);
        return index;
    };

    const snapToNearest = (targetIndex?: number) => {
        if (!containerRef.current) return;
        let index = targetIndex !== undefined ? targetIndex : updateActiveIndexFromScroll();
        index = Math.min(Math.max(0, index), items.length - 1);

        if (isItemDisabled && isItemDisabled(items[index])) {
            let bestIdx = -1;
            let minDist = Infinity;
            for (let i = 0; i < items.length; i++) {
                if (!isItemDisabled(items[i])) {
                    const dist = Math.abs(i - index);
                    if (dist < minDist) {
                        minDist = dist;
                        bestIdx = i;
                    }
                }
            }
            if (bestIdx !== -1) {
                index = bestIdx;
            }
        }

        const targetScroll = index * ITEM_HEIGHT;
        containerRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
        setActiveIdx(index);
        if (items[index] !== value && (!isItemDisabled || !isItemDisabled(items[index]))) {
            onChange(items[index]);
        }
    };

    const handleScroll = () => {
        updateActiveIndexFromScroll();
        if (isDraggingRef.current) return;
        if (scrollEndTimer.current) window.clearTimeout(scrollEndTimer.current);
        scrollEndTimer.current = window.setTimeout(() => {
            snapToNearest();
        }, 90);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        isDraggingRef.current = true;
        hasMovedRef.current = false;
        startYRef.current = e.clientY;
        startScrollTopRef.current = containerRef.current.scrollTop;
        lastYRef.current = e.clientY;
        lastTimeRef.current = performance.now();
        velocityRef.current = 0;

        const onMouseMove = (moveEvent: MouseEvent) => {
            if (!isDraggingRef.current || !containerRef.current) return;
            const deltaY = moveEvent.clientY - startYRef.current;
            if (Math.abs(deltaY) > 3) {
                hasMovedRef.current = true;
            }
            containerRef.current.scrollTop = startScrollTopRef.current - deltaY;

            const now = performance.now();
            const dt = now - lastTimeRef.current;
            if (dt > 10) {
                velocityRef.current = (moveEvent.clientY - lastYRef.current) / dt;
                lastYRef.current = moveEvent.clientY;
                lastTimeRef.current = now;
            }

            updateActiveIndexFromScroll();
        };

        const onMouseUp = () => {
            if (!isDraggingRef.current) return;
            isDraggingRef.current = false;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);

            if (containerRef.current && hasMovedRef.current) {
                const currentScrollTop = containerRef.current.scrollTop;
                const momentum = velocityRef.current * 140;
                const projected = currentScrollTop - momentum;
                const targetIdx = Math.min(Math.max(0, Math.round(projected / ITEM_HEIGHT)), items.length - 1);
                snapToNearest(targetIdx);
            } else {
                snapToNearest();
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (!containerRef.current) return;
        isDraggingRef.current = true;
        hasMovedRef.current = false;
        startYRef.current = e.touches[0].clientY;
        startScrollTopRef.current = containerRef.current.scrollTop;
        lastYRef.current = e.touches[0].clientY;
        lastTimeRef.current = performance.now();
        velocityRef.current = 0;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDraggingRef.current || !containerRef.current) return;
        const clientY = e.touches[0].clientY;
        const deltaY = clientY - startYRef.current;
        if (Math.abs(deltaY) > 3) {
            hasMovedRef.current = true;
        }
        containerRef.current.scrollTop = startScrollTopRef.current - deltaY;

        const now = performance.now();
        const dt = now - lastTimeRef.current;
        if (dt > 10) {
            velocityRef.current = (clientY - lastYRef.current) / dt;
            lastYRef.current = clientY;
            lastTimeRef.current = now;
        }

        updateActiveIndexFromScroll();
    };

    const handleTouchEnd = () => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        if (containerRef.current && hasMovedRef.current) {
            const currentScrollTop = containerRef.current.scrollTop;
            const momentum = velocityRef.current * 140;
            const projected = currentScrollTop - momentum;
            const targetIdx = Math.min(Math.max(0, Math.round(projected / ITEM_HEIGHT)), items.length - 1);
            snapToNearest(targetIdx);
        } else {
            snapToNearest();
        }
    };

    return (
        <div
            className={`relative h-[190px] ${widthClass} select-none cursor-grab active:cursor-grabbing touch-none`}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto no-scrollbar py-[76px]"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {items.map((item, idx) => {
                    const disabled = isItemDisabled ? isItemDisabled(item) : false;
                    const isMiddle = idx === activeIdx;
                    const distance = Math.abs(idx - activeIdx);

                    return (
                        <div
                            key={String(item)}
                            onClick={() => {
                                if (hasMovedRef.current) return;
                                if (disabled) return;
                                snapToNearest(idx);
                            }}
                            className={cn(
                                'flex h-[38px] items-center justify-center text-sm transition-all duration-100 ease-out',
                                disabled
                                    ? 'text-muted-foreground/20 line-through cursor-not-allowed select-none'
                                    : cn(
                                        'cursor-pointer',
                                        isMiddle
                                            ? 'font-extrabold text-foreground text-lg scale-110 drop-shadow-xs'
                                            : distance === 1
                                                ? 'text-muted-foreground/60 font-medium text-sm scale-95'
                                                : 'text-muted-foreground/25 font-normal text-xs scale-90'
                                    )
                            )}
                        >
                            {item}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function InquiriesPage({ inquiries }: Props) {
    const page = usePage();
    const { flash } = page.props as any;
    const notificationInquiryId = Number(new URLSearchParams(page.url.split('?')[1] ?? '').get('inquiry_id')) || null;
    const notificationInquiryRow = useRef<HTMLTableRowElement>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all');
    const [followUpFor, setFollowUpFor] = useState<Inquiry | null>(null);
    const [followUpDatePart, setFollowUpDatePart] = useState(() => getInitialFollowUpDateTime().slice(0, 10));
    const [followUpTimePart, setFollowUpTimePart] = useState(() => getInitialFollowUpDateTime().slice(11, 16));
    const [followUpNote, setFollowUpNote] = useState('');
    const [completingFollowUp, setCompletingFollowUp] = useState<FollowUp | null>(null);
    const [completionNote, setCompletionNote] = useState('');
    const [historyFor, setHistoryFor] = useState<Inquiry | null>(null);
    const [viewingInquiry, setViewingInquiry] = useState<Inquiry | null>(null);

    const [datePopoverOpen, setDatePopoverOpen] = useState(false);
    const [timePopoverOpen, setTimePopoverOpen] = useState(false);

    const initialParts = useMemo(() => {
        const initialDt = getInitialFollowUpDateTime();
        const dParts = splitDateParts(initialDt.slice(0, 10));
        const tParts = splitTime24(initialDt.slice(11, 16));
        return { dParts, tParts };
    }, []);

    const [tempMonth, setTempMonth] = useState(initialParts.dParts.monthName);
    const [tempDay, setTempDay] = useState(initialParts.dParts.day);
    const tempYear = String(CURRENT_YEAR);

    const [tempHour, setTempHour] = useState(initialParts.tParts.hour);
    const [tempMinute, setTempMinute] = useState(initialParts.tParts.minute);
    const [tempPeriod, setTempPeriod] = useState<'AM' | 'PM'>(initialParts.tParts.period);

    const isDateToday = useMemo(() => isTodayDate(followUpDatePart), [followUpDatePart]);

    const isMonthDisabled = (monthName: string) => {
        const now = new Date();
        const mIdx = MONTH_NAMES.indexOf(monthName as any);
        return mIdx < now.getMonth();
    };

    const isDayDisabled = (dayStr: string) => {
        const now = new Date();
        const mIdx = MONTH_NAMES.indexOf(tempMonth as any);
        const d = parseInt(dayStr, 10);
        if (mIdx > now.getMonth()) return false;
        if (mIdx < now.getMonth()) return true;
        return d < now.getDate();
    };

    const isPeriodDisabled = (period: 'AM' | 'PM') => {
        if (!isDateToday) return false;
        const now = new Date();
        if (period === 'AM' && now.getHours() >= 12) {
            return true;
        }
        return false;
    };

    const isHourDisabled = (hourStr: string) => {
        if (!isDateToday) return false;
        const now = new Date();
        const h24 = getHour24(hourStr, tempPeriod);
        return h24 < now.getHours();
    };

    const isMinuteDisabled = (minuteStr: string) => {
        if (!isDateToday) return false;
        const now = new Date();
        const h24 = getHour24(tempHour, tempPeriod);
        if (h24 < now.getHours()) return true;
        if (h24 > now.getHours()) return false;
        return parseInt(minuteStr, 10) < now.getMinutes();
    };

    useEffect(() => {
        if (!datePopoverOpen) return;
        const now = new Date();
        const mIdx = MONTH_NAMES.indexOf(tempMonth as any);
        if (mIdx < now.getMonth()) {
            setTempMonth(MONTH_NAMES[now.getMonth()]);
            return;
        }
        if (mIdx === now.getMonth() && parseInt(tempDay, 10) < now.getDate()) {
            setTempDay(String(now.getDate()).padStart(2, '0'));
        }
    }, [datePopoverOpen, tempMonth]);

    useEffect(() => {
        if (!timePopoverOpen) return;
        const now = new Date();
        if (isDateToday) {
            if (tempPeriod === 'AM' && now.getHours() >= 12) {
                setTempPeriod('PM');
                return;
            }
            const h24 = getHour24(tempHour, tempPeriod);
            if (h24 < now.getHours()) {
                const validHour = HOURS.find((h) => !isHourDisabled(h));
                if (validHour) setTempHour(validHour);
                return;
            }
            if (h24 === now.getHours() && parseInt(tempMinute, 10) < now.getMinutes()) {
                const nextMin = String(Math.min(59, now.getMinutes())).padStart(2, '0');
                setTempMinute(nextMin);
            }
        }
    }, [timePopoverOpen, isDateToday, tempPeriod, tempHour]);

    const handleOpenDatePopover = (open: boolean) => {
        if (open) {
            let safeDateStr = followUpDatePart;
            if (isPastDate(safeDateStr)) {
                safeDateStr = getInitialFollowUpDateTime().slice(0, 10);
                setFollowUpDatePart(safeDateStr);
            }
            const parts = splitDateParts(safeDateStr);
            setTempMonth(parts.monthName);
            setTempDay(parts.day);
        }
        setDatePopoverOpen(open);
    };

    const handleOpenTimePopover = (open: boolean) => {
        if (open) {
            let safeTimeStr = followUpTimePart;
            if (isPastDateTime(followUpDatePart, safeTimeStr)) {
                safeTimeStr = getInitialFollowUpDateTime().slice(11, 16);
                setFollowUpTimePart(safeTimeStr);
            }
            const parts = splitTime24(safeTimeStr);
            setTempHour(parts.hour);
            setTempMinute(parts.minute);
            setTempPeriod(parts.period);
        }
        setTimePopoverOpen(open);
    };

    const formattedDisplayDate = useMemo(() => {
        try {
            const [y, m, d] = followUpDatePart.split('-');
            if (!y || !m || !d) return followUpDatePart;
            return `${m}/${d}/${y}`;
        } catch {
            return followUpDatePart;
        }
    }, [followUpDatePart]);

    const formattedDisplayTime = useMemo(() => {
        const { hour, minute, period } = splitTime24(followUpTimePart);
        return `${hour}:${minute} ${period}`;
    }, [followUpTimePart]);

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
            const isCancelled = Boolean(inquiry.cancelled_at) || inquiry.status === 'cancelled';
            if (statusFilter === 'cancelled') {
                if (!isCancelled) return false;
            } else if (statusFilter !== 'all') {
                if (inquiry.status !== statusFilter || isCancelled) return false;
            }
            if (!term) return true;
            return (
                String(inquiry.inquiry_id).includes(term) ||
                (inquiry.client?.business_name.toLowerCase().includes(term) ?? false) ||
                (inquiry.client?.contact_person.toLowerCase().includes(term) ?? false) ||
                (inquiry.client?.user?.email.toLowerCase().includes(term) ?? false)
            );
        });
    }, [inquiries, search, statusFilter]);

    const scheduleFollowUp = () => {
        if (!followUpFor || !followUpDatePart || !followUpTimePart || !followUpNote.trim()) return;
        if (isPastDate(followUpDatePart) || isPastDateTime(followUpDatePart, followUpTimePart)) return;
        router.post(
            route('inquiries.follow-ups.store', followUpFor.inquiry_id),
            {
                follow_up_date: `${followUpDatePart}T${followUpTimePart}`,
                note: followUpNote.trim(),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setFollowUpFor(null);
                    setFollowUpNote('');
                },
            },
        );
    };

    const completeFollowUp = () => {
        if (!completingFollowUp) return;

        router.patch(
            route('follow-ups.complete', completingFollowUp.id),
            {
                completion_note: completionNote.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCompletingFollowUp(null);
                    setCompletionNote('');
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Lead Management" />

            <div className="bmanny-page">
                {/* Header Banner */}
                <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="border-l-4 border-amber-400 pl-3.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sales Workspace</p>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">LEAD MANAGEMENT</h1>
                        <p className="text-xs text-muted-foreground sm:text-sm">Track every inquiry from first contact through quotation, follow-up, and conversion</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Button
                            variant="outline"
                            className="h-10 rounded-lg border-border/80 bg-card px-4 text-xs font-semibold text-foreground shadow-sm hover:bg-muted"
                            asChild
                        >
                            <Link href={route('archived-chats.index')}>
                                <Archive className="mr-2 h-4 w-4 text-muted-foreground" />
                                Archived Chats
                            </Link>
                        </Button>
                        <Button
                            className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                            asChild
                        >
                            <Link href={route('quotations.create')}>
                                <Plus className="mr-1.5 h-4 w-4" />
                                New Quotation
                            </Link>
                        </Button>
                    </div>
                </header>

                {(flash?.success || flash?.error) && (
                    <div className="mb-4 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground">
                        {flash.success ?? flash.error}
                    </div>
                )}

                {/* Metric Summary Cards */}
                <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[
                        {
                            label: 'New',
                            value: inquiries.filter((item) => item.status === 'new').length,
                            description: 'New customer leads',
                            icon: Sparkles,
                        },
                        {
                            label: 'Follow Up',
                            value: inquiries.filter((item) => item.status === 'follow_up').length,
                            description: 'Customers that needed to contact',
                            icon: CalendarClock,
                        },
                        {
                            label: 'Quotation Sent',
                            value: inquiries.filter((item) => item.status === 'quotation_sent').length,
                            description: 'Awaiting Customer Action',
                            icon: Send,
                        },
                        {
                            label: 'Converted',
                            value: inquiries.filter((item) => item.status === 'converted').length,
                            description: 'Converted to Orders',
                            icon: CheckCircle2,
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

                {/* Filter & Search Bar */}
                <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border/70 bg-card px-5 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-foreground">
                        {filteredInquiries.length}/{inquiries.length} Leads
                    </p>
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search Business, Contact, Email"
                                className="h-9 w-full rounded-lg border border-input/80 bg-muted/20 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-80"
                            />
                        </div>
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value as 'all' | LeadStatus)}
                                className="h-9 w-full appearance-none rounded-lg border border-input/80 bg-muted/20 px-3 pr-8 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-auto"
                            >
                                <option value="all">All Statuses</option>
                                {LEAD_STATUSES.map((status) => (
                                    <option key={status} value={status}>
                                        {statusLabel(status)}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>
                </div>

                {/* Lead Items Table / Card Rows */}
                {filteredInquiries.length === 0 ? (
                    <div className="rounded-xl border border-border/70 bg-card py-16 text-center text-muted-foreground shadow-sm">
                        <ClipboardList className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                        <h2 className="text-base font-semibold text-foreground">No leads found</h2>
                        <p className="mt-1 text-xs">No inquiries match the selected filter.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] border-separate border-spacing-y-2.5 text-left text-sm">
                            <thead>
                                <tr>
                                    <th className="px-5 py-3 text-sm font-bold text-foreground">Lead</th>
                                    <th className="px-5 py-3 text-sm font-bold text-foreground">Request</th>
                                    <th className="px-5 py-3 text-sm font-bold text-foreground">Status</th>
                                    <th className="px-5 py-3 text-sm font-bold text-foreground">Follow-Ups</th>
                                    <th className="px-5 py-3 text-sm font-bold text-foreground">History</th>
                                    <th className="px-5 py-3 text-sm font-bold text-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInquiries.map((inquiry) => {
                                    const followUp = openFollowUp(inquiry);
                                    const isReviewedByProductController = Boolean(
                                        inquiry.product_request_review &&
                                        (inquiry.product_request_review.status === 'available' || inquiry.product_request_review.status === 'alternative')
                                    );
                                    const quoteAllowed = !inquiry.quotation && ['new', 'for_quotation', 'follow_up'].includes(inquiry.status) && isReviewedByProductController;
                                    const isCancelled = Boolean(inquiry.cancelled_at) || inquiry.status === 'cancelled';
                                    const inactive = inquiry.status === 'converted' || isCancelled;

                                    return (
                                        <tr
                                            key={inquiry.inquiry_id}
                                            ref={inquiry.inquiry_id === notificationInquiryId ? notificationInquiryRow : undefined}
                                            onClick={() => setViewingInquiry(inquiry)}
                                            className="group cursor-pointer bg-card shadow-sm transition-shadow hover:shadow-md"
                                        >
                                            {/* Lead */}
                                            <td className="rounded-l-xl border-y border-l border-border/70 p-5 align-middle">
                                                <p className="text-base font-bold text-foreground">
                                                    {inquiry.client?.business_name ?? '—'}
                                                </p>
                                                <p className="mt-0.5 text-sm text-muted-foreground">
                                                    {inquiry.client?.user?.email || inquiry.client?.contact_person || 'No contact'}
                                                </p>
                                                <p className="mt-1 text-sm font-semibold text-foreground/80">
                                                    #{inquiry.inquiry_id}
                                                </p>
                                            </td>

                                            {/* Request */}
                                            <td className="border-y border-border/70 p-5 align-middle">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-base font-bold text-foreground">
                                                        {inquiry.customizations.length
                                                            ? inquiry.customizations.map((item) => item.selected_package ?? item.packaging_type).join(', ')
                                                            : 'Starter'}
                                                    </p>
                                                    {inquiry.inquiry_type === 'reorder_batch' && (
                                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 dark:bg-blue-500/20 dark:text-blue-300">
                                                            Reorder Batch{inquiry.reorder_batch_quantity ? ` · ${inquiry.reorder_batch_quantity.toLocaleString()} pouches` : ''}
                                                        </span>
                                                    )}
                                                    {inquiry.inquiry_type === 'packaging_replenishment' && (
                                                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                                                            Packaging Refill (₱0 Cylinder){inquiry.reorder_batch_quantity ? ` · ${inquiry.reorder_batch_quantity.toLocaleString()} batch` : ''}
                                                        </span>
                                                    )}
                                                </div>
                                                {inquiry.packaging_balance && (
                                                    <p className="mt-1 text-xs font-medium text-primary">
                                                        Stored MOQ: {inquiry.packaging_balance.remaining_pouches.toLocaleString()} / {inquiry.packaging_balance.total_pouches.toLocaleString()} pouches remaining
                                                    </p>
                                                )}
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    received {formatDate(inquiry.created_at)}
                                                </p>
                                            </td>

                                            {/* Status */}
                                            <td className="border-y border-border/70 p-5 align-middle">
                                                {(() => {
                                                    const effectiveStatus = isCancelled ? 'cancelled' : inquiry.status;
                                                    const config = getStatusConfig(effectiveStatus);
                                                    return (
                                                        <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold sm:text-base ${config.pill}`}>
                                                            {config.label}
                                                        </span>
                                                    );
                                                })()}
                                            </td>

                                            {/* Follow-Ups */}
                                            <td
                                                className="border-y border-border/70 p-5 align-middle"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {followUp ? (
                                                    <div>
                                                        <p className="text-base font-semibold text-foreground">{formatFollowUpDateTime(followUp.follow_up_date)}</p>
                                                        <p className="mt-0.5 max-w-44 text-sm text-muted-foreground line-clamp-2">{followUp.note}</p>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="mt-2 h-8 rounded-md bg-muted/60 px-3 text-xs font-semibold hover:bg-muted"
                                                            onClick={() => {
                                                                setCompletingFollowUp(followUp);
                                                                setCompletionNote('');
                                                            }}
                                                        >
                                                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                            <span className="whitespace-nowrap">Mark done</span>
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-base font-medium text-foreground">Not Scheduled</span>
                                                )}
                                            </td>

                                            {/* History */}
                                            <td
                                                className="border-y border-border/70 p-5 align-middle"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {(() => {
                                                    const reorderCount = inquiry.packaging_balance?.inquiries?.length ?? 0;
                                                    return (
                                                        <div>
                                                            <p className="text-base font-medium text-foreground">
                                                                {inquiry.follow_ups.length} Follow-up{inquiry.follow_ups.length === 1 ? '' : 's'}
                                                            </p>
                                                            {inquiry.packaging_balance && (
                                                                <p className="mt-0.5 text-xs font-semibold text-primary">
                                                                    {reorderCount} Reorder{reorderCount === 1 ? '' : 's'}
                                                                </p>
                                                            )}
                                                            {(inquiry.follow_ups.length > 0 || Boolean(inquiry.cancelled_at) || Boolean(inquiry.packaging_balance)) && (
                                                                <Button
                                                                    variant="link"
                                                                    size="sm"
                                                                    className="mt-1 h-auto p-0 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                                                    onClick={() => setHistoryFor(inquiry)}
                                                                >
                                                                    {inquiry.cancelled_at
                                                                        ? 'Cancellation history'
                                                                        : inquiry.packaging_balance
                                                                            ? 'Reorder history'
                                                                            : 'View history'}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </td>

                                            {/* Actions */}
                                            <td
                                                className="rounded-r-xl border-y border-r border-border/70 p-5 align-middle"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="grid grid-cols-2 gap-2.5 min-w-[260px]">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-9 justify-start rounded-md bg-muted/60 px-3 text-xs font-semibold hover:bg-muted"
                                                        disabled={inactive || inquiry.product_request_review?.status === 'pending'}
                                                        onClick={() => router.post(route('inquiries.product-request.submit', inquiry.inquiry_id))}
                                                    >
                                                        <FileCheck className="mr-1.5 h-4 w-4 text-muted-foreground shrink-0" />
                                                        <span className="whitespace-nowrap">{inquiry.product_request_review ? 'Resend Review' : 'Send Review'}</span>
                                                    </Button>

                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-9 justify-start rounded-md bg-muted/60 px-3 text-xs font-semibold hover:bg-muted"
                                                        disabled={inactive}
                                                        onClick={() => {
                                                            setFollowUpFor(inquiry);
                                                            const initialDt = getInitialFollowUpDateTime();
                                                            setFollowUpDatePart(initialDt.slice(0, 10));
                                                            setFollowUpTimePart(initialDt.slice(11, 16));
                                                            setFollowUpNote('');
                                                        }}
                                                    >
                                                        <UserCheck className="mr-1.5 h-4 w-4 text-muted-foreground shrink-0" />
                                                        <span className="whitespace-nowrap">Follow-up</span>
                                                    </Button>

                                                    {quoteAllowed ? (
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="h-9 justify-start rounded-md bg-muted/60 px-3 text-xs font-semibold hover:bg-muted"
                                                            asChild
                                                        >
                                                            <Link href={route('quotations.create', { inquiry_id: inquiry.inquiry_id })}>
                                                                <FilePenLine className="mr-1.5 h-4 w-4 text-muted-foreground shrink-0" />
                                                                <span className="whitespace-nowrap">Quote</span>
                                                            </Link>
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="h-9 justify-start rounded-md bg-muted/30 px-3 text-xs font-semibold text-muted-foreground/60 cursor-not-allowed"
                                                            disabled
                                                            title={
                                                                inquiry.quotation
                                                                    ? 'Quotation already created'
                                                                    : !isReviewedByProductController
                                                                        ? 'Requires Product Controller review before quoting'
                                                                        : 'Quotation not available'
                                                            }
                                                        >
                                                            <FilePenLine className="mr-1.5 h-4 w-4 text-muted-foreground/40 shrink-0" />
                                                            <span className="whitespace-nowrap">Quote</span>
                                                        </Button>
                                                    )}

                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-9 justify-start rounded-md bg-muted/60 px-3 text-xs font-semibold hover:bg-muted"
                                                        asChild
                                                    >
                                                        <Link href={route('chat.show', inquiry.inquiry_id)}>
                                                            <MessageSquare className="mr-1.5 h-4 w-4 text-muted-foreground shrink-0" />
                                                            <span className="whitespace-nowrap">Chat</span>
                                                        </Link>
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

            {/* Schedule Follow-up Dialog */}
            <Dialog open={Boolean(followUpFor)} onOpenChange={(open) => !open && setFollowUpFor(null)}>
                <DialogContent className="max-w-xl min-h-[580px] flex flex-col justify-between overflow-visible rounded-2xl border-border/70 p-0 shadow-2xl">
                    <div className="p-7 pb-4 flex-1">
                        <DialogHeader className="space-y-1.5 text-left">
                            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                                Schedule follow-up
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">
                                {followUpFor?.client?.business_name ?? 'This lead'} will move to Follow-up until you update its stage.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-foreground">
                                    Follow-up date and time
                                </label>
                                <div className="mt-2 grid grid-cols-2 gap-3.5">
                                    {/* Wheel Date Picker Trigger & Popover */}
                                    <Popover open={datePopoverOpen} onOpenChange={handleOpenDatePopover}>
                                        <PopoverTrigger asChild>
                                            <button
                                                type="button"
                                                className="flex h-11 w-full items-center justify-start rounded-lg border border-input/80 bg-background px-3 text-sm text-foreground shadow-xs hover:bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary"
                                            >
                                                <Calendar className="mr-2.5 h-4 w-4 text-muted-foreground shrink-0" />
                                                <span className="font-medium">{formattedDisplayDate}</span>
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="z-[70] w-[240px] rounded-2xl border-border/70 bg-card p-4 shadow-2xl"
                                            align="start"
                                            sideOffset={6}
                                        >
                                            <p className="mb-2 text-center text-sm font-bold text-foreground">Select date</p>
                                            <div className="relative flex items-center justify-center py-1">
                                                <div className="pointer-events-none absolute left-2 right-2 top-1/2 h-10 -translate-y-1/2 rounded-lg border border-border/80 bg-muted/40 shadow-xs" />
                                                <WheelColumn
                                                    items={MONTH_NAMES}
                                                    value={tempMonth}
                                                    onChange={setTempMonth}
                                                    isItemDisabled={isMonthDisabled}
                                                    widthClass="w-24"
                                                />
                                                <WheelColumn
                                                    items={getDaysInMonth(tempYear, tempMonth)}
                                                    value={tempDay}
                                                    onChange={setTempDay}
                                                    isItemDisabled={isDayDisabled}
                                                    widthClass="w-20"
                                                />
                                            </div>
                                            {isPastDate(joinDateParts(tempYear, tempMonth, tempDay)) && (
                                                <p className="mt-2 text-center text-xs font-semibold text-rose-500">
                                                    Cannot select past date
                                                </p>
                                            )}
                                            <div className="mt-3 flex items-center justify-end gap-3 pt-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
                                                    onClick={() => setDatePopoverOpen(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={isPastDate(joinDateParts(tempYear, tempMonth, tempDay))}
                                                    className="h-8 rounded-lg border-border/80 bg-background px-4 text-xs font-semibold text-foreground shadow-xs hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                                                    onClick={() => {
                                                        const days = getDaysInMonth(tempYear, tempMonth);
                                                        const safeDay = days.includes(tempDay) ? tempDay : days[days.length - 1];
                                                        const newDate = joinDateParts(tempYear, tempMonth, safeDay);
                                                        if (isPastDate(newDate)) return;
                                                        setFollowUpDatePart(newDate);
                                                        if (isPastDateTime(newDate, followUpTimePart)) {
                                                            const nextTime = new Date();
                                                            nextTime.setMinutes(Math.ceil(nextTime.getMinutes() / 5) * 5, 0, 0);
                                                            setFollowUpTimePart(localDateTimeValue(nextTime).slice(11, 16));
                                                        }
                                                        setDatePopoverOpen(false);
                                                    }}
                                                >
                                                    Save
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    {/* Wheel Time Picker Trigger & Popover */}
                                    <Popover open={timePopoverOpen} onOpenChange={handleOpenTimePopover}>
                                        <PopoverTrigger asChild>
                                            <button
                                                type="button"
                                                className="flex h-11 w-full items-center justify-start rounded-lg border border-input/80 bg-background px-3 text-sm text-foreground shadow-xs hover:bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary"
                                            >
                                                <Clock className="mr-2.5 h-4 w-4 text-muted-foreground shrink-0" />
                                                <span className="font-medium">{formattedDisplayTime}</span>
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="z-[70] w-[270px] rounded-2xl border-border/70 bg-card p-4 shadow-2xl"
                                            align="end"
                                            sideOffset={6}
                                        >
                                            <p className="mb-2 text-center text-sm font-bold text-foreground">Select time</p>
                                            <div className="relative flex items-center justify-center py-1">
                                                <div className="pointer-events-none absolute left-2 right-2 top-1/2 h-10 -translate-y-1/2 rounded-lg border border-border/80 bg-muted/40 shadow-xs" />
                                                <WheelColumn
                                                    items={HOURS}
                                                    value={tempHour}
                                                    onChange={setTempHour}
                                                    isItemDisabled={isHourDisabled}
                                                    widthClass="w-16"
                                                />
                                                <span className="z-10 px-1 text-base font-bold text-foreground">:</span>
                                                <WheelColumn
                                                    items={MINUTES}
                                                    value={tempMinute}
                                                    onChange={setTempMinute}
                                                    isItemDisabled={isMinuteDisabled}
                                                    widthClass="w-16"
                                                />
                                                <WheelColumn
                                                    items={PERIODS}
                                                    value={tempPeriod}
                                                    onChange={setTempPeriod}
                                                    isItemDisabled={isPeriodDisabled}
                                                    widthClass="w-16"
                                                />
                                            </div>
                                            {isDateToday && isPastDateTime(followUpDatePart, joinTime24(tempHour, tempMinute, tempPeriod)) && (
                                                <p className="mt-2 text-center text-xs font-semibold text-rose-500">
                                                    Cannot select past time
                                                </p>
                                            )}
                                            <div className="mt-3 flex items-center justify-end gap-3 pt-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
                                                    onClick={() => setTimePopoverOpen(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={isDateToday && isPastDateTime(followUpDatePart, joinTime24(tempHour, tempMinute, tempPeriod))}
                                                    className="h-8 rounded-lg border-border/80 bg-background px-4 text-xs font-semibold text-foreground shadow-xs hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                                                    onClick={() => {
                                                        const newTime = joinTime24(tempHour, tempMinute, tempPeriod);
                                                        if (isDateToday && isPastDateTime(followUpDatePart, newTime)) return;
                                                        setFollowUpTimePart(newTime);
                                                        setTimePopoverOpen(false);
                                                    }}
                                                >
                                                    Save
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-foreground">
                                    Purpose :
                                </label>
                                <textarea
                                    value={followUpNote}
                                    onChange={(event) => setFollowUpNote(event.target.value)}
                                    maxLength={2000}
                                    rows={5}
                                    placeholder="Example: Call to confirm the preferred package and quantity."
                                    className="mt-2 w-full resize-none rounded-xl border border-input/80 bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-border/60 bg-muted/20 px-7 py-4.5 rounded-b-2xl">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 rounded-lg border-border/80 bg-background px-5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
                            onClick={() => setFollowUpFor(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="h-10 rounded-lg bg-[#3b5de7] hover:bg-[#2f4bc9] px-5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
                            onClick={scheduleFollowUp}
                            disabled={
                                !followUpDatePart ||
                                !followUpTimePart ||
                                !followUpNote.trim() ||
                                isPastDate(followUpDatePart) ||
                                isPastDateTime(followUpDatePart, followUpTimePart)
                            }
                        >
                            Save follow-up
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Complete Follow-up Dialog */}
            <Dialog open={Boolean(completingFollowUp)} onOpenChange={(open) => !open && setCompletingFollowUp(null)}>
                <DialogContent className="max-w-lg flex flex-col justify-between overflow-visible rounded-2xl border-border/70 p-0 shadow-2xl">
                    <div className="p-7 pb-4 flex-1">
                        <DialogHeader className="space-y-1.5 text-left">
                            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                                Complete follow-up
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">
                                Record the outcome so the lead history explains what Sales discussed or needs to do next.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-foreground">
                                    Outcome note :
                                </label>
                                <textarea
                                    value={completionNote}
                                    onChange={(event) => setCompletionNote(event.target.value)}
                                    maxLength={2000}
                                    rows={5}
                                    placeholder="Example: Customer requested a revised quotation next week."
                                    className="mt-2 w-full resize-none rounded-xl border border-input/80 bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-border/60 bg-muted/20 px-7 py-4.5 rounded-b-2xl">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 rounded-lg border-border/80 bg-background px-5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
                            onClick={() => setCompletingFollowUp(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="h-10 rounded-lg bg-[#3b5de7] hover:bg-[#2f4bc9] px-5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
                            onClick={completeFollowUp}
                            disabled={!completionNote.trim()}
                        >
                            Mark follow-up complete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Follow-up History Dialog */}
            <Dialog open={Boolean(historyFor)} onOpenChange={(open) => !open && setHistoryFor(null)}>
                <DialogContent className="max-w-lg max-h-[85vh] flex flex-col justify-between overflow-hidden rounded-2xl border-border/70 p-0 shadow-2xl">
                    <div className="p-7 pb-4 flex-1 overflow-y-auto">
                        <DialogHeader className="space-y-1.5 text-left">
                            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                                Lead history
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">
                                {historyFor?.client?.business_name ?? 'This lead'}: cancellation record and follow-up outcomes.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-6 space-y-3">
                            {historyFor?.packaging_balance && (() => {
                                const bal = historyFor.packaging_balance;
                                const reorders = bal.inquiries ?? [];
                                const pct = bal.total_pouches > 0 ? Math.min(100, Math.round((bal.remaining_pouches / bal.total_pouches) * 100)) : 0;
                                return (
                                    <article className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-sm shadow-xs space-y-3 dark:border-blue-900/60 dark:bg-blue-950/25">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <span className="font-bold text-blue-800 dark:text-blue-200 capitalize">
                                                    {bal.package_slug} Package — Stored MOQ &amp; Reorder History
                                                </span>
                                                <p className="text-xs text-muted-foreground">
                                                    {bal.brand_name}{bal.source_order_id ? ` · Initial Order #${bal.source_order_id}` : ''}
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                                                {reorders.length} Reorder{reorders.length === 1 ? '' : 's'}
                                            </span>
                                        </div>

                                        {/* MOQ Remaining Progress Bar */}
                                        <div className="space-y-1.5 rounded-lg border border-blue-200/70 bg-card/90 p-3 dark:border-blue-900/50">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-foreground">
                                                    {bal.remaining_pouches.toLocaleString()} / {bal.total_pouches.toLocaleString()} pouches remaining
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {bal.used_pouches.toLocaleString()} used
                                                </span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-blue-600 transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            {bal.expires_at && (
                                                <p className="text-[11px] text-muted-foreground">
                                                    Storage valid until {formatDate(bal.expires_at)}
                                                </p>
                                            )}
                                        </div>

                                        {/* Individual Reorder Entries */}
                                        {reorders.length > 0 && (
                                            <div className="space-y-2 border-t border-blue-200/70 pt-2.5 dark:border-blue-900/50">
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800/80 dark:text-blue-300/80">
                                                    Reorder Batches ({reorders.length})
                                                </p>
                                                {reorders.map((entry, idx) => (
                                                    <div
                                                        key={entry.inquiry_id}
                                                        className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-card/90 px-3 py-2 text-xs"
                                                    >
                                                        <div>
                                                            <p className="font-semibold text-foreground">
                                                                #{reorders.length - idx} · {entry.inquiry_type === 'packaging_replenishment' ? 'Packaging Refill' : 'Repeat Batch'} ({(entry.reorder_batch_quantity ?? 0).toLocaleString()} pouches)
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground">
                                                                Inquiry #{entry.inquiry_id}
                                                                {entry.quotation?.order ? ` · Order #${entry.quotation.order.order_id}` : ''}
                                                                {' · '}
                                                                {formatDate(entry.created_at)}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            {entry.quotation?.total_amount != null && (
                                                                <p className="font-mono font-bold text-foreground">
                                                                    ₱{Number(entry.quotation.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                                </p>
                                                            )}
                                                            <p className="text-[11px] font-semibold capitalize text-muted-foreground">
                                                                {entry.cancelled_at ? 'Cancelled' : entry.status.replace(/_/g, ' ')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </article>
                                );
                            })()}

                            {historyFor?.cancelled_at && (
                                <article className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-sm shadow-xs dark:border-rose-900/60 dark:bg-rose-950/30">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="font-bold text-rose-700 dark:text-rose-300">
                                            Cancellation Details
                                        </span>
                                        <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-900/50 dark:text-rose-200">
                                            Cancelled
                                        </span>
                                    </div>
                                    <div className="mt-3 space-y-2.5 border-t border-rose-200/70 pt-2.5 dark:border-rose-900/50">
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700/80 dark:text-rose-300/80">
                                                Who cancelled
                                            </p>
                                            <p className="mt-0.5 text-sm font-semibold text-foreground">
                                                {historyFor.client?.contact_person || historyFor.client?.business_name || 'Client'}
                                                {historyFor.client?.business_name && historyFor.client?.contact_person
                                                    ? ` (${historyFor.client.business_name})`
                                                    : ''}
                                            </p>
                                            {historyFor.client?.user?.email && (
                                                <p className="text-xs text-muted-foreground">{historyFor.client.user.email}</p>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700/80 dark:text-rose-300/80">
                                                When
                                            </p>
                                            <p className="mt-0.5 text-sm font-medium text-foreground">
                                                {formatFollowUpDateTime(historyFor.cancelled_at)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700/80 dark:text-rose-300/80">
                                                Why (Reason)
                                            </p>
                                            <p className="mt-0.5 text-sm font-medium text-foreground whitespace-pre-wrap">
                                                {historyFor.cancellation_reason || 'No reason recorded.'}
                                            </p>
                                        </div>
                                    </div>
                                </article>
                            )}

                            {historyFor?.follow_ups.length === 0 ? (
                                !historyFor?.cancelled_at && !historyFor?.packaging_balance && (
                                    <div className="rounded-xl border border-dashed border-border/80 p-6 text-center text-sm text-muted-foreground">
                                        No follow-up records found.
                                    </div>
                                )
                            ) : (
                                historyFor?.follow_ups.map((followUp) => (
                                    <article
                                        key={followUp.id}
                                        className="rounded-xl border border-input/80 bg-background/60 p-4 text-sm shadow-xs"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-semibold text-foreground">
                                                    {formatFollowUpDateTime(followUp.follow_up_date)}
                                                </span>
                                            </div>
                                            <span
                                                className={cn(
                                                    'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                                    followUp.completed_at
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                                )}
                                            >
                                                {followUp.completed_at ? 'Done' : 'Open'}
                                            </span>
                                        </div>

                                        <div className="mt-3 space-y-2 border-t border-border/60 pt-2.5">
                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                    Planned action
                                                </p>
                                                <p className="mt-0.5 text-sm font-medium text-foreground whitespace-pre-wrap">
                                                    {followUp.note}
                                                </p>
                                            </div>

                                            {followUp.completed_at && (
                                                <div className="pt-1">
                                                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                        Outcome
                                                    </p>
                                                    <p className="mt-0.5 text-sm font-medium text-foreground whitespace-pre-wrap">
                                                        {followUp.completion_note || 'No outcome note recorded.'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end border-t border-border/60 bg-muted/20 px-7 py-4.5 rounded-b-2xl">
                        <Button
                            type="button"
                            className="h-10 rounded-lg bg-[#3b5de7] hover:bg-[#2f4bc9] px-6 text-sm font-semibold text-white shadow-sm"
                            onClick={() => setHistoryFor(null)}
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Inquiry Details Slide-Over Sheet (matching Order Manager) */}
            <Sheet open={Boolean(viewingInquiry)} onOpenChange={(open) => !open && setViewingInquiry(null)}>
                <SheetContent className="w-full overflow-y-auto sm:max-w-2xl space-y-5 p-6">
                    {viewingInquiry && (
                        <>
                            <SheetHeader className="space-y-1.5 text-left">
                                <div className="flex items-center justify-between pr-8">
                                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                                        Inquiry #{viewingInquiry.inquiry_id}
                                    </span>
                                    {(() => {
                                        const isCanc = Boolean(viewingInquiry.cancelled_at) || viewingInquiry.status === 'cancelled';
                                        const cfg = getStatusConfig(isCanc ? 'cancelled' : viewingInquiry.status);
                                        return (
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cfg.pill}`}>
                                                {cfg.label}
                                            </span>
                                        );
                                    })()}
                                </div>
                                <SheetTitle className="text-xl font-black uppercase tracking-tight text-foreground">
                                    INQUIRY &amp; PACKAGE SPECIFICATIONS
                                </SheetTitle>
                                <SheetDescription className="text-xs text-muted-foreground">
                                    Client details, quotation terms, and package specifications for this lead.
                                </SheetDescription>
                            </SheetHeader>

                            {/* Client & Inquiry Reference Card */}
                            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Client Information</p>
                                        <p className="mt-1 text-sm font-bold text-foreground">{viewingInquiry.client?.business_name ?? '—'}</p>
                                        <p className="text-xs text-muted-foreground">{viewingInquiry.client?.contact_person ?? ''}</p>
                                        {viewingInquiry.client?.user?.email && (
                                            <p className="text-xs font-mono text-muted-foreground">{viewingInquiry.client.user.email}</p>
                                        )}
                                        {viewingInquiry.client?.business_address && (
                                            <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                                                <MapPin className="size-3 shrink-0" /> {viewingInquiry.client.business_address}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Lead &amp; Quotation Reference</p>
                                        <p className="mt-1 text-xs text-foreground">
                                            <span className="text-muted-foreground">Quotation: </span>
                                            <span className="font-mono font-bold text-primary">
                                                {viewingInquiry.quotation ? `#${viewingInquiry.quotation.quotation_id}` : 'Not yet quoted'}
                                            </span>
                                        </p>
                                        {viewingInquiry.quotation?.total_amount != null && (
                                            <p className="text-xs text-foreground">
                                                <span className="text-muted-foreground">Total Quoted: </span>
                                                <span className="font-bold text-foreground">
                                                    ₱{Number(viewingInquiry.quotation.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                </span>
                                            </p>
                                        )}
                                        {viewingInquiry.quotation?.initial_payment_amount != null && (
                                            <p className="text-xs text-foreground">
                                                <span className="text-muted-foreground">Before Production: </span>
                                                <span className="font-semibold text-foreground">
                                                    ₱{Number(viewingInquiry.quotation.initial_payment_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                </span>
                                            </p>
                                        )}
                                        {viewingInquiry.quotation?.balance_payment_amount != null && (
                                            <p className="text-xs text-foreground">
                                                <span className="text-muted-foreground">Before Pickup: </span>
                                                <span className="font-semibold text-foreground">
                                                    ₱{Number(viewingInquiry.quotation.balance_payment_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                </span>
                                            </p>
                                        )}
                                        {viewingInquiry.packaging_balance && (
                                            <p className="text-xs text-primary font-medium">
                                                Stored MOQ: {viewingInquiry.packaging_balance.remaining_pouches.toLocaleString()} / {viewingInquiry.packaging_balance.total_pouches.toLocaleString()} pouches left
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            <span>Submitted: </span>
                                            <span className="font-mono">{formatDate(viewingInquiry.created_at)}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Cancellation Details (if cancelled) */}
                            {viewingInquiry.cancelled_at && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-xs space-y-1.5 dark:border-rose-900/60 dark:bg-rose-950/30">
                                    <p className="font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                                        Cancelled on {formatFollowUpDateTime(viewingInquiry.cancelled_at)}
                                    </p>
                                    <p className="text-foreground whitespace-pre-wrap">
                                        {viewingInquiry.cancellation_reason || 'No reason recorded.'}
                                    </p>
                                </div>
                            )}

                            {/* Quoted Item Details (if quoted) */}
                            {viewingInquiry.quotation?.item_details && (
                                <div className="rounded-xl border border-border/70 bg-card p-4 space-y-2 shadow-xs">
                                    <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
                                        <FileText className="size-4 text-primary" />
                                        <h3 className="text-sm font-bold text-foreground">Quoted Item Details &amp; Commercial Terms</h3>
                                    </div>
                                    <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-muted/40 p-3.5 font-mono text-xs leading-relaxed text-foreground border border-input/60">
                                        {viewingInquiry.quotation.item_details}
                                    </pre>
                                </div>
                            )}

                            {/* Package & Formulation Specifications */}
                            {viewingInquiry.customizations && viewingInquiry.customizations.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Layers className="size-4 text-primary" />
                                        <h3 className="text-sm font-bold text-foreground">Package &amp; Formulation Specifications</h3>
                                    </div>
                                    {viewingInquiry.customizations.map((c, idx) => {
                                        const parsedNotes = parseClientNotes(c.client_notes);
                                        return (
                                            <div key={c.customization_id || idx} className="rounded-xl border border-border/70 bg-card p-4 shadow-xs space-y-3">
                                                <p className="text-xs font-bold text-primary uppercase tracking-wide">
                                                    Specification #{idx + 1}: {c.selected_package ?? c.packaging_type ?? 'Custom Package'}
                                                </p>
                                                <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                                                    <div className="rounded-lg bg-muted/30 p-2.5">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Package</p>
                                                        <p className="mt-0.5 font-semibold capitalize text-foreground">{c.selected_package ?? 'Standard'}</p>
                                                    </div>
                                                    <div className="rounded-lg bg-muted/30 p-2.5">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Packaging Type</p>
                                                        <p className="mt-0.5 font-semibold text-foreground">{c.packaging_type ?? '—'}</p>
                                                    </div>
                                                    <div className="rounded-lg bg-muted/30 p-2.5">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Finish</p>
                                                        <p className="mt-0.5 font-semibold text-foreground">{c.packaging_finish ?? '—'}</p>
                                                    </div>
                                                    <div className="rounded-lg bg-muted/30 p-2.5">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Serving Size</p>
                                                        <p className="mt-0.5 font-semibold text-foreground">{c.serving_size ?? '—'}</p>
                                                    </div>
                                                </div>
                                                {c.requested_ingredient_note && (
                                                    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                                                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Requested Ingredient / Effect</p>
                                                        <p className="text-xs text-foreground whitespace-pre-wrap">{c.requested_ingredient_note}</p>
                                                    </div>
                                                )}
                                                {c.client_notes && (
                                                    <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2.5">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Customer Details</p>
                                                        {parsedNotes ? (
                                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                                {parsedNotes.map((item, pIdx) => {
                                                                    const isWide = item.value.length > 48 || item.label.toLowerCase().includes('terms') || item.label.toLowerCase().includes('instruction');
                                                                    return (
                                                                        <div
                                                                            key={pIdx}
                                                                            className={`rounded-md border border-border/50 bg-card/80 px-3 py-2 ${isWide ? 'sm:col-span-2' : ''}`}
                                                                        >
                                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                                                {item.label}
                                                                            </p>
                                                                            <p className="mt-0.5 text-xs font-medium leading-relaxed text-foreground">
                                                                                {item.value}
                                                                            </p>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">{c.client_notes}</p>
                                                        )}
                                                    </div>
                                                )}
                                                {c.design_file_path && (
                                                    <div>
                                                        <a
                                                            href={`/storage/${c.design_file_path}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-muted dark:text-blue-400"
                                                        >
                                                            View Customer Artwork
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <SheetFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setViewingInquiry(null)}>
                                    Close
                                </Button>
                            </SheetFooter>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
