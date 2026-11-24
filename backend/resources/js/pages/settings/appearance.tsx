import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type Appearance as AppearanceMode, useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Check, Monitor, Moon, Palette, Sparkles, Sun } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/settings/profile' },
    { title: 'Visual Studio', href: '/settings/appearance' },
];

interface ThemeOption {
    value: AppearanceMode;
    label: string;
    tagline: string;
    description: string;
    icon: typeof Sun;
    swatches: [string, string, string];
}

const themeOptions: ThemeOption[] = [
    {
        value: 'light',
        label: 'Daylight Studio',
        tagline: 'Light Mode',
        description: 'Crisp porcelain surfaces with deep navy navigation for bright office environments.',
        icon: Sun,
        swatches: ['#071d49', '#edf2f9', '#d4a72c'],
    },
    {
        value: 'dark',
        label: 'Midnight Navy',
        tagline: 'Dark Mode',
        description: 'Low-glare deep slate canvas engineered for comfortable extended sessions.',
        icon: Moon,
        swatches: ['#071a35', '#101c2e', '#e5b93f'],
    },
    {
        value: 'system',
        label: 'Adaptive System',
        tagline: 'Auto Sync',
        description: 'Seamlessly follows your operating system daytime and nighttime display schedule.',
        icon: Monitor,
        swatches: ['#071d49', '#3e70db', '#d4a72c'],
    },
];

function LiveWorkspaceStage({ previewMode }: { previewMode: AppearanceMode }) {
    const isSystem = previewMode === 'system';
    const isDark = previewMode === 'dark';

    const renderMiniPortal = (dark: boolean) => (
        <div className={cn('flex h-44 w-full overflow-hidden', dark ? 'bg-[#08111f] text-white' : 'bg-[#edf2f9] text-[#172033]')}>
            {/* Mini Sidebar */}
            <div className="flex w-16 shrink-0 flex-col justify-between bg-[#071d49] p-2.5">
                <div className="space-y-2">
                    <div className="h-2.5 w-9 rounded-xs bg-gradient-to-r from-[#d4a72c] to-[#f2cf66]" />
                    <div className="space-y-1.5 pt-1">
                        <div className="h-2 w-full rounded-xs bg-[#123b83] ring-1 ring-[#d4a72c]/50" />
                        <div className="h-2 w-4/5 rounded-xs bg-white/20" />
                        <div className="h-2 w-3/4 rounded-xs bg-white/15" />
                        <div className="h-2 w-5/6 rounded-xs bg-white/15" />
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="size-4 rounded-full border border-[#d4a72c] bg-[#123b83]" />
                    <div className="h-1.5 flex-1 rounded-xs bg-white/30" />
                </div>
            </div>

            {/* Mini Main Content */}
            <div className="flex flex-1 flex-col gap-2.5 p-3">
                {/* Top Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <div className="h-3 w-1 rounded-full bg-[#d4a72c]" />
                        <div className={cn('h-2.5 w-20 rounded-xs', dark ? 'bg-slate-700' : 'bg-slate-300')} />
                    </div>
                    <div className="flex gap-1">
                        <div className={cn('size-3 rounded-full', dark ? 'bg-slate-800' : 'bg-white')} />
                        <div className={cn('size-3 rounded-full', dark ? 'bg-slate-800' : 'bg-white')} />
                    </div>
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { accent: dark ? 'bg-[#3e70db]' : 'bg-[#1236a3]' },
                        { accent: 'bg-emerald-500' },
                        { accent: 'bg-[#d4a72c]' },
                    ].map((kpi, index) => (
                        <div
                            key={index}
                            className={cn(
                                'rounded-lg border p-2',
                                dark ? 'border-[#263750] bg-[#101c2e]' : 'border-[#dde3ec] bg-white shadow-2xs',
                            )}
                        >
                            <div className={cn('h-1.5 w-7 rounded-xs', kpi.accent)} />
                            <div className={cn('mt-2 h-2.5 w-10 rounded-xs', dark ? 'bg-slate-600' : 'bg-slate-200')} />
                        </div>
                    ))}
                </div>

                {/* Table / Workspace Card */}
                <div
                    className={cn(
                        'flex-1 rounded-lg border p-2.5',
                        dark ? 'border-[#263750] bg-[#101c2e]' : 'border-[#dde3ec] bg-white shadow-2xs',
                    )}
                >
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className={cn('h-2 w-24 rounded-xs', dark ? 'bg-slate-600' : 'bg-slate-200')} />
                            <div className="h-2 w-10 rounded-full bg-[#d4a72c]/70" />
                        </div>
                        <div className={cn('h-1.5 w-full rounded-xs', dark ? 'bg-slate-800' : 'bg-slate-100')} />
                        <div className={cn('h-1.5 w-5/6 rounded-xs', dark ? 'bg-slate-800' : 'bg-slate-100')} />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {/* Mock Browser Chrome */}
            <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-rose-400/80" />
                    <span className="size-2.5 rounded-full bg-amber-400/80" />
                    <span className="size-2.5 rounded-full bg-emerald-400/80" />
                </div>
                <span className="rounded-md border border-border bg-background px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    bmanny.portal / preview — {previewMode}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground">
                    <Sparkles className="size-3" />
                    Live Stage
                </span>
            </div>

            {isSystem ? (
                <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                    {renderMiniPortal(false)}
                    {renderMiniPortal(true)}
                </div>
            ) : (
                renderMiniPortal(isDark)
            )}
        </div>
    );
}

export default function Appearance() {
    const { appearance, updateAppearance } = useAppearance();
    const [hoveredMode, setHoveredMode] = useState<AppearanceMode | null>(null);

    const previewMode = hoveredMode ?? appearance;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Appearance settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    {/* Live Interactive Portal Stage */}
                    <section className="bmanny-form-card overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-muted text-foreground">
                                    <Palette className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold tracking-tight text-foreground">Portal Visual Studio</h2>
                                    <p className="text-xs text-muted-foreground">
                                        Hover any preset to preview the workspace, or click to apply it instantly.
                                    </p>
                                </div>
                            </div>

                            <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold text-foreground capitalize">
                                Active: {appearance}
                            </span>
                        </div>

                        <div className="space-y-6 p-6">
                            <LiveWorkspaceStage previewMode={previewMode} />

                            {/* 3 Sculpted Theme Preset Cards */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                {themeOptions.map((option) => {
                                    const Icon = option.icon;
                                    const isSelected = appearance === option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => updateAppearance(option.value)}
                                            onMouseEnter={() => setHoveredMode(option.value)}
                                            onMouseLeave={() => setHoveredMode(null)}
                                            aria-pressed={isSelected}
                                            className={cn(
                                                'group relative flex cursor-pointer flex-col justify-between rounded-2xl border p-5 text-left transition-all duration-200',
                                                isSelected
                                                    ? 'border-[#d4a72c] bg-primary/[0.04] shadow-[0_6px_20px_rgba(7,29,73,0.08)] ring-2 ring-[#d4a72c]/25'
                                                    : 'border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
                                            )}
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <div
                                                        className={cn(
                                                            'flex size-10 items-center justify-center rounded-xl border transition-colors',
                                                            isSelected
                                                                ? 'border-[#d4a72c]/50 bg-[#071d49] text-white dark:bg-[#163b78]'
                                                                : 'border-border bg-muted/50 text-foreground',
                                                        )}
                                                    >
                                                        <Icon className="size-5" />
                                                    </div>

                                                    <span
                                                        className={cn(
                                                            'flex size-6 items-center justify-center rounded-full border transition-all',
                                                            isSelected
                                                                ? 'border-[#071d49] bg-[#071d49] text-white dark:border-white dark:bg-white dark:text-[#071d49]'
                                                                : 'border-border bg-background',
                                                        )}
                                                    >
                                                        {isSelected && <Check className="size-3.5 stroke-[2.8]" />}
                                                    </span>
                                                </div>

                                                <div className="mt-4">
                                                    <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                                        {option.tagline}
                                                    </p>
                                                    <h3 className="mt-0.5 text-base font-bold text-foreground">{option.label}</h3>
                                                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                                                        {option.description}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Signature Palette Swatches */}
                                            <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
                                                <span className="text-[11px] font-medium text-muted-foreground">Palette</span>
                                                <div className="flex items-center -space-x-1">
                                                    {option.swatches.map((hex) => (
                                                        <span
                                                            key={hex}
                                                            style={{ backgroundColor: hex }}
                                                            className="size-4 rounded-full border border-white/80 shadow-2xs dark:border-slate-900"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
