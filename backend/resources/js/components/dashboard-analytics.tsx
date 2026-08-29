import { Card, CardContent } from '@/components/ui/card';
import { CircleDollarSign } from 'lucide-react';
import { useState } from 'react';

export interface MonthlyActivity { label: string; inquiries: number; orders: number; }
export interface StatusBreakdownItem { label: string; value: number; color: string; }
export interface AnalyticsPeriod {
    context: string;
    activity: MonthlyActivity[];
    statusBreakdown: StatusBreakdownItem[];
    funnel: Array<{ label: string; value: number }>;
    totalRevenue: number;
}
export type ActivityPeriods = Record<'daily' | 'weekly' | 'monthly' | 'yearly', AnalyticsPeriod>;

interface DashboardAnalyticsProps {
    title?: string;
    description: string;
    periods: ActivityPeriods;
}

const currency = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
const periods = [['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['yearly', 'Yearly']] as const;

export function DashboardAnalytics({ title = 'Analytics', description, periods: analyticsPeriods }: DashboardAnalyticsProps) {
    const [period, setPeriod] = useState<keyof ActivityPeriods>('monthly');
    const selected = analyticsPeriods[period];
    const values = selected.activity;
    const maximum = Math.max(1, ...values.flatMap((item) => [item.inquiries, item.orders]));
    const totalStatuses = Math.max(1, selected.statusBreakdown.reduce((total, item) => total + item.value, 0));

    return <section aria-label={title} className="space-y-4">
        <header className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{description}</p></div><div className="inline-flex rounded-lg border border-border bg-card p-1" aria-label="Analytics period">{periods.map(([key, label]) => <button key={key} type="button" onClick={() => setPeriod(key)} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${period === key ? 'bg-[#0A1A3C] text-white dark:bg-[#d4a72c] dark:text-[#0A1A3C]' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{label}</button>)}</div></header>
        <div className="grid gap-4 xl:grid-cols-5">
            <Card className="rounded-xl border-border bg-card shadow-sm xl:col-span-3"><CardContent className="p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold text-card-foreground">Demand</h2><span className="text-right text-xs font-medium text-muted-foreground">{selected.context}</span></div><div className="mt-5 grid h-44 items-end gap-2 border-b border-border pb-1" style={{ gridTemplateColumns: `repeat(${Math.max(values.length, 1)}, minmax(0, 1fr))` }}>{values.map((item) => <div key={item.label} className="flex h-full min-w-0 flex-col justify-end gap-1.5 text-center"><div className="flex h-36 items-end justify-center gap-1"><span className="w-2.5 rounded-t bg-[#0A1A3C] dark:bg-slate-200" style={{ height: `${Math.max(item.inquiries ? 7 : 2, (item.inquiries / maximum) * 100)}%` }} /><span className="w-2.5 rounded-t bg-[#d4a72c]" style={{ height: `${Math.max(item.orders ? 7 : 2, (item.orders / maximum) * 100)}%` }} /></div><span className="truncate text-[10px] font-medium text-muted-foreground">{item.label}</span></div>)}</div><div className="mt-3 flex gap-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-sm bg-[#0A1A3C] dark:bg-slate-200" />Inquiries</span><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-sm bg-[#d4a72c]" />Orders</span></div></CardContent></Card>
            <Card className="rounded-xl border-border bg-card shadow-sm xl:col-span-2"><CardContent className="p-5"><h2 className="font-semibold text-card-foreground">Order status</h2><p className="mt-1 text-xs text-muted-foreground">{selected.context}</p><div className="mt-5 space-y-3">{selected.statusBreakdown.map((item) => <div key={item.label}><div className="flex items-center justify-between text-sm"><span className="text-card-foreground">{item.label}</span><span className="font-semibold tabular-nums text-card-foreground">{item.value}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${(item.value / totalStatuses) * 100}%`, backgroundColor: item.color }} /></div></div>)}</div></CardContent></Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-2"><Card className="rounded-xl border-border bg-card shadow-sm"><CardContent className="p-5"><h2 className="font-semibold text-card-foreground">Pipeline</h2><p className="mt-1 text-xs text-muted-foreground">{selected.context}</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{selected.funnel.map((item) => <div key={item.label} className="rounded-lg border border-border bg-muted/20 px-3 py-3"><p className="text-2xl font-semibold tabular-nums text-card-foreground">{item.value}</p><p className="mt-1 text-xs font-medium text-muted-foreground">{item.label}</p></div>)}</div></CardContent></Card><Card className="self-start rounded-xl border-border bg-card shadow-sm"><CardContent className="flex items-center gap-4 p-5"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#ead69d] bg-[#fffaf0] text-[#a36f00] dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300"><CircleDollarSign className="size-5" /></span><div><p className="text-sm text-muted-foreground">Order value</p><p className="mt-1 text-3xl font-semibold tracking-tight text-card-foreground">{currency(selected.totalRevenue)}</p><p className="mt-1 text-xs text-muted-foreground">{selected.context}</p></div></CardContent></Card></div>
    </section>;
}
