'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DateTimePickerProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    label?: string;
    className?: string;
    min?: string;
    max?: string;
    actionLabel?: string;
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// Generate 24 hourly time slots (12:00 AM, 1:00 AM, ..., 11:00 PM)
const HOURLY_TIMES = Array.from({ length: 24 }, (_, hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const hourStr24 = String(hour).padStart(2, '0');
    return {
        display: `${displayHour}:00 ${period}`,
        value24: `${hourStr24}:00`,
        hour,
    };
});

function parseDateTimeString(val?: string): { date: Date; time24: string } {
    if (!val) {
        const now = new Date();
        const hourStr = String(now.getHours()).padStart(2, '0');
        return { date: now, time24: `${hourStr}:00` };
    }

    try {
        const parsed = new Date(val.includes(' ') ? val.replace(' ', 'T') : val);
        if (!isNaN(parsed.getTime())) {
            const hourStr = String(parsed.getHours()).padStart(2, '0');
            return { date: parsed, time24: `${hourStr}:00` };
        }
    } catch {
        // Fallback
    }

    const fallback = new Date();
    return { date: fallback, time24: '09:00' };
}

function formatDateOutput(date: Date, time24: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day} ${time24}`;
}

function formatDisplayDate(date: Date): string {
    const monthStr = SHORT_MONTHS[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${monthStr} ${day}, ${year}`;
}

function formatDisplayTime(time24: string): string {
    const found = HOURLY_TIMES.find((t) => t.value24 === time24);
    if (found) return found.display;
    const [h] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:00 ${period}`;
}

export function DateTimePicker({
    value,
    onChange,
    placeholder = 'Select date and time',
    label,
    className,
    min,
    max,
    actionLabel = 'Apply',
}: DateTimePickerProps) {
    const [open, setOpen] = React.useState(false);

    const initial = React.useMemo(() => parseDateTimeString(value), [value]);
    const [viewDate, setViewDate] = React.useState<Date>(initial.date);
    const [selectedDate, setSelectedDate] = React.useState<Date>(initial.date);
    const [selectedTime, setSelectedTime] = React.useState<string>(initial.time24);

    // Sync when value prop changes externally
    React.useEffect(() => {
        const parsed = parseDateTimeString(value);
        setSelectedDate(parsed.date);
        setViewDate(parsed.date);
        setSelectedTime(parsed.time24);
    }, [value]);

    const viewYear = viewDate.getFullYear();
    const viewMonth = viewDate.getMonth();

    const prevMonth = () => {
        setViewDate(new Date(viewYear, viewMonth - 1, 1));
    };

    const nextMonth = () => {
        setViewDate(new Date(viewYear, viewMonth + 1, 1));
    };

    // Build days grid (Monday start)
    const calendarDays = React.useMemo(() => {
        const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
        const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

        // Monday = 0, Sunday = 6
        let startDayOfWeek = firstDayOfMonth.getDay() - 1;
        if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday

        const days = [];

        // Previous month days
        const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const d = new Date(viewYear, viewMonth - 1, prevMonthLastDay - i);
            days.push({ date: d, isCurrentMonth: false });
        }

        // Current month days
        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            const d = new Date(viewYear, viewMonth, i);
            days.push({ date: d, isCurrentMonth: true });
        }

        // Next month trailing days to complete full weeks
        const remaining = (7 - (days.length % 7)) % 7;
        for (let i = 1; i <= remaining; i++) {
            const d = new Date(viewYear, viewMonth + 1, i);
            days.push({ date: d, isCurrentMonth: false });
        }

        return days;
    }, [viewYear, viewMonth]);

    const isSameDay = (d1: Date, d2: Date) => {
        return (
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate()
        );
    };

    const isToday = (d: Date) => {
        const today = new Date();
        return isSameDay(d, today);
    };

    const handleSelectDay = (day: { date: Date; isCurrentMonth: boolean }) => {
        setSelectedDate(day.date);
        if (!day.isCurrentMonth) {
            setViewDate(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
        }
    };

    const handleApply = () => {
        const formatted = formatDateOutput(selectedDate, selectedTime);
        onChange?.(formatted);
        setOpen(false);
    };

    const handleCancel = () => {
        const parsed = parseDateTimeString(value);
        setSelectedDate(parsed.date);
        setViewDate(parsed.date);
        setSelectedTime(parsed.time24);
        setOpen(false);
    };

    const currentFormatted = parseDateTimeString(value);
    const displayFormatted = value
        ? `${formatDisplayDate(currentFormatted.date)} • ${formatDisplayTime(currentFormatted.time24)}`
        : placeholder;

    return (
        <div className={cn('relative inline-flex flex-col gap-1.5', className)}>
            {label && <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            'inline-flex h-10 items-center justify-between gap-3 rounded-xl border border-input bg-background px-3.5 py-2 text-sm font-medium text-foreground transition-all duration-150',
                            'hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            'shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
                            !value && 'text-muted-foreground'
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="size-4 text-primary opacity-80" />
                            <span>{displayFormatted}</span>
                        </div>
                        <Clock className="size-3.5 text-muted-foreground opacity-60" />
                    </button>
                </PopoverTrigger>

                <PopoverContent
                    align="start"
                    sideOffset={6}
                    className="w-auto p-0 border-0 bg-transparent shadow-none"
                >
                    <div className="w-[380px] sm:w-[410px] rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xl transition-all">
                        {/* 2-Column Layout: Left = Calendar, Right = Time Picker */}
                        <div className="grid grid-cols-[1fr_auto] gap-4">
                            {/* Left: Calendar Section */}
                            <div className="space-y-3">
                                {/* Calendar Header: Navigation & Month Title */}
                                <div className="flex items-center justify-between px-1">
                                    <button
                                        type="button"
                                        onClick={prevMonth}
                                        className="flex size-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                        aria-label="Previous month"
                                    >
                                        <ChevronLeft className="size-4" />
                                    </button>

                                    <h3 className="text-sm font-bold text-foreground">
                                        {MONTH_NAMES[viewMonth]} {viewYear}
                                    </h3>

                                    <button
                                        type="button"
                                        onClick={nextMonth}
                                        className="flex size-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                        aria-label="Next month"
                                    >
                                        <ChevronRight className="size-4" />
                                    </button>
                                </div>

                                {/* Weekday Headers (Mo, Tu, We, Th, Fr, Sa, Su) */}
                                <div className="grid grid-cols-7 text-center">
                                    {WEEKDAYS.map((wd) => (
                                        <div
                                            key={wd}
                                            className="py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80"
                                        >
                                            {wd}
                                        </div>
                                    ))}
                                </div>

                                {/* Days Grid */}
                                <div className="grid grid-cols-7 gap-1 text-center">
                                    {calendarDays.map((item, idx) => {
                                        const isSelected = isSameDay(item.date, selectedDate);
                                        const isCurrentDay = isToday(item.date);

                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleSelectDay(item)}
                                                className={cn(
                                                    'relative flex aspect-square size-8 sm:size-9 items-center justify-center rounded-xl text-xs font-medium transition-all duration-150',
                                                    // Selected state
                                                    isSelected
                                                        ? 'bg-[#6366f1] text-white font-semibold shadow-sm hover:bg-[#5356e3]'
                                                        : item.isCurrentMonth
                                                          ? 'text-foreground hover:bg-muted'
                                                          : 'text-muted-foreground/40 hover:bg-muted/50 hover:text-muted-foreground',
                                                    // Subtle dot indicator for today
                                                    isCurrentDay && !isSelected && 'font-bold text-primary'
                                                )}
                                            >
                                                <span>{item.date.getDate()}</span>
                                                {isCurrentDay && !isSelected && (
                                                    <span className="absolute bottom-1 size-1 rounded-full bg-primary" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right: Vertical Separator & Time Column */}
                            <div className="border-l border-border pl-3.5 flex flex-col">
                                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center">
                                    Time
                                </div>
                                <div className="flex flex-col gap-1 max-h-[240px] overflow-y-auto pr-1">
                                    {HOURLY_TIMES.map((timeItem) => {
                                        const isTimeSelected = selectedTime === timeItem.value24;

                                        return (
                                            <button
                                                key={timeItem.value24}
                                                type="button"
                                                onClick={() => setSelectedTime(timeItem.value24)}
                                                className={cn(
                                                    'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all text-center whitespace-nowrap',
                                                    isTimeSelected
                                                        ? 'bg-muted/90 text-primary font-semibold shadow-2xs dark:bg-muted/50'
                                                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                                                )}
                                            >
                                                {timeItem.display}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Footer Actions */}
                        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3.5">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                Cancel
                            </button>

                            <div className="rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground text-center shadow-2xs">
                                {formatDisplayDate(selectedDate)}
                                <span className="mx-1.5 opacity-40">•</span>
                                {formatDisplayTime(selectedTime)}
                            </div>

                            <button
                                type="button"
                                onClick={handleApply}
                                className="rounded-xl bg-[#6366f1] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#5356e3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {actionLabel}
                            </button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
