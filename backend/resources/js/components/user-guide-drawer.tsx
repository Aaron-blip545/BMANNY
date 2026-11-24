import { GuideVisualPreview } from '@/components/guide-visual-preview';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { type RoleGuide, USER_GUIDES } from '@/lib/user-guides-data';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowRight,
    BarChart3,
    Bell,
    BookOpen,
    Box,
    ChevronRight,
    CircleHelp,
    ClipboardCheck,
    ExternalLink,
    FileText,
    HelpCircle,
    House,
    Lightbulb,
    Package,
    PackageCheck,
    PackageMinus,
    Search,
    ShieldAlert,
    ShieldCheck,
    SlidersHorizontal,
    Users as UsersIcon,
} from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';

function renderGuideIcon(iconName: string, className = 'h-4 w-4') {
    switch (iconName) {
        case 'BarChart3':
            return <BarChart3 className={className} />;
        case 'Bell':
            return <Bell className={className} />;
        case 'UsersIcon':
            return <UsersIcon className={className} />;
        case 'FileText':
            return <FileText className={className} />;
        case 'ShieldAlert':
            return <ShieldAlert className={className} />;
        case 'House':
            return <House className={className} />;
        case 'CircleHelp':
            return <CircleHelp className={className} />;
        case 'ShieldCheck':
            return <ShieldCheck className={className} />;
        case 'Package':
            return <Package className={className} />;
        case 'ClipboardCheck':
            return <ClipboardCheck className={className} />;
        case 'Box':
            return <Box className={className} />;
        case 'SlidersHorizontal':
            return <SlidersHorizontal className={className} />;
        case 'PackageCheck':
            return <PackageCheck className={className} />;
        case 'PackageMinus':
            return <PackageMinus className={className} />;
        default:
            return <HelpCircle className={className} />;
    }
}

export function UserGuideDrawer() {
    const { auth } = usePage().props as { auth?: { user?: { role?: string } } };
    const currentUrl = usePage().url;
    const userRole = auth?.user?.role ?? 'sales_agent';

    const defaultRoleKey = useMemo(() => {
        if (['admin', 'sales_agent', 'product_controller', 'order_manager'].includes(userRole)) {
            return userRole;
        }
        return 'sales_agent';
    }, [userRole]);

    const [open, setOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string>(defaultRoleKey);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

    const activeRoleGuide: RoleGuide = USER_GUIDES[selectedRole] ?? USER_GUIDES.sales_agent;

    const filteredModules = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return activeRoleGuide.modules.filter((m) => {
            if (!query) return true;
            return (
                m.title.toLowerCase().includes(query) ||
                m.summary.toLowerCase().includes(query) ||
                m.steps.some((s) => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query)) ||
                m.tips.some((t) => t.toLowerCase().includes(query))
            );
        });
    }, [activeRoleGuide, searchQuery]);

    const isCurrentPage = (route: string) => {
        return currentUrl === route || (route !== '/' && currentUrl.startsWith(route));
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 cursor-pointer gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Open Quick User Guide"
                >
                    <BookOpen className="h-4 w-4 text-foreground" />
                    <span className="hidden sm:inline">Guide</span>
                </Button>
            </SheetTrigger>

            <SheetContent
                side="right"
                className="flex h-full w-full flex-col border-l border-border bg-background p-0 sm:max-w-xl"
            >
                {/* Header */}
                <div className="border-b border-border bg-muted/30 p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#071d49] text-white dark:bg-[#163b78]">
                                <BookOpen className="h-4 w-4" />
                            </div>
                            <div>
                                <SheetTitle className="text-base font-bold text-foreground">BMANNY Visual Guide</SheetTitle>
                                <p className="text-xs text-muted-foreground">Arrow-guided flowchart instructions</p>
                            </div>
                        </div>
                        <Link
                            href="/user-guide"
                            onClick={() => setOpen(false)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:underline"
                        >
                            <span>Full Flowchart</span>
                            <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>

                    {/* Role Selector Tabs */}
                    <div className="mt-4 grid grid-cols-4 gap-1 rounded-xl bg-muted/60 p-1">
                        {[
                            { id: 'sales_agent', label: 'Sales' },
                            { id: 'product_controller', label: 'Product' },
                            { id: 'order_manager', label: 'Order' },
                            { id: 'admin', label: 'Admin' },
                        ].map((r) => {
                            const isSelected = selectedRole === r.id;
                            return (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedRole(r.id);
                                        setExpandedModuleId(null);
                                    }}
                                    className={cn(
                                        'cursor-pointer rounded-lg px-2 py-1.5 text-center text-xs font-semibold transition-all',
                                        isSelected
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {r.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Search Bar */}
                    <div className="relative mt-3">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search ${activeRoleGuide.roleName} flowchart…`}
                            className="w-full rounded-lg border border-input bg-background py-1.5 pr-3 pl-8 text-xs focus:ring-2 focus:ring-ring focus:outline-none"
                        />
                    </div>
                </div>

                {/* Flowchart Stages List */}
                <div className="flex-1 space-y-1 overflow-y-auto p-4">
                    <div className="mb-3 rounded-xl border border-border bg-card p-3">
                        <span className="mb-1 inline-block rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-bold tracking-wider text-foreground uppercase">
                            {activeRoleGuide.roleName} Flow
                        </span>
                        <h3 className="text-xs font-bold text-foreground">{activeRoleGuide.headline}</h3>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                            {activeRoleGuide.description}
                        </p>
                    </div>

                    {filteredModules.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                            No guide stages match &quot;{searchQuery}&quot;.
                        </div>
                    ) : (
                        filteredModules.map((module, index) => {
                            const isCurrent = isCurrentPage(module.route);
                            const isExpanded =
                                expandedModuleId === module.id || (expandedModuleId === null && isCurrent);
                            const isLast = index === filteredModules.length - 1;

                            return (
                                <Fragment key={module.id}>
                                    <div
                                        className={cn(
                                            'overflow-hidden rounded-xl border transition-all',
                                            isCurrent
                                                ? 'border-[#d4a72c] bg-card shadow-sm'
                                                : 'border-border bg-card hover:border-border/80',
                                        )}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setExpandedModuleId(isExpanded ? '__none__' : module.id)}
                                            className="group flex w-full cursor-pointer items-center justify-between p-3 text-left"
                                        >
                                            <div className="flex min-w-0 items-center gap-2.5 pr-2">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#071d49] text-white dark:bg-[#163b78]">
                                                    {renderGuideIcon(module.iconName)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                                                            {module.stageLabel}
                                                        </span>
                                                        <h4 className="truncate text-xs font-bold text-foreground">{module.title}</h4>
                                                        {isCurrent && (
                                                            <span className="rounded-full border border-border bg-muted px-1.5 py-0.5 text-[9px] font-bold text-foreground">
                                                                Here
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="truncate text-[11px] text-muted-foreground">{module.summary}</p>
                                                </div>
                                            </div>

                                            <ChevronRight
                                                className={cn(
                                                    'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                                                    isExpanded && 'rotate-90',
                                                )}
                                            />
                                        </button>

                                        {isExpanded && (
                                            <div className="space-y-3 border-t border-border/70 bg-muted/10 p-3">
                                                {module.imageSrc ? (
                                                    <div className="overflow-hidden rounded-lg border border-border bg-background">
                                                        <img
                                                            src={module.imageSrc}
                                                            alt={module.title}
                                                            className="h-auto w-full object-contain"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                ) : (
                                                    <GuideVisualPreview moduleId={module.id} />
                                                )}

                                                <div className="rounded-lg border border-border/50 bg-muted/40 p-2.5 text-[11px]">
                                                    <span className="font-bold text-foreground">When to use: </span>
                                                    <span className="text-muted-foreground">{module.whenToUse}</span>
                                                </div>

                                                <div>
                                                    <p className="mb-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                                        Step Flow:
                                                    </p>
                                                    <div className="space-y-0">
                                                        {module.steps.map((step, sIdx) => (
                                                            <Fragment key={step.number}>
                                                                <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-background p-2 text-xs">
                                                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#071d49] font-mono text-[10px] font-bold text-white dark:bg-[#163b78]">
                                                                        {step.number}
                                                                    </span>
                                                                    <div className="min-w-0 pt-0.5">
                                                                        <p className="text-[11px] font-semibold text-foreground">
                                                                            {step.title}
                                                                        </p>
                                                                        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                                                                            {step.description}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {sIdx < module.steps.length - 1 && (
                                                                    <div className="py-0.5 pl-4 text-muted-foreground" aria-hidden="true">
                                                                        <ArrowDown className="size-3" />
                                                                    </div>
                                                                )}
                                                            </Fragment>
                                                        ))}
                                                    </div>
                                                </div>

                                                {module.tips.length > 0 && (
                                                    <div className="rounded-lg border border-border bg-muted/40 p-2.5 text-[11px]">
                                                        <div className="mb-1 flex items-center gap-1.5 font-bold text-foreground">
                                                            <Lightbulb className="h-3.5 w-3.5" />
                                                            <span>Best Practice</span>
                                                        </div>
                                                        <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                                                            {module.tips.map((tip, idx) => (
                                                                <li key={idx} className="leading-relaxed">
                                                                    {tip}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                <div className="flex justify-end pt-1">
                                                    <Link
                                                        href={module.route}
                                                        onClick={() => setOpen(false)}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                                                    >
                                                        <span>Open {module.shortTitle}</span>
                                                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {!isLast && (
                                        <div className="flex justify-center py-1 text-muted-foreground" aria-hidden="true">
                                            <ArrowDown className="size-3.5" />
                                        </div>
                                    )}
                                </Fragment>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border bg-muted/20 p-3 text-xs">
                    <span className="text-muted-foreground">Prefer the full visual flowchart?</span>
                    <Link
                        href="/user-guide"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-1 font-bold text-foreground hover:underline"
                    >
                        <span>Open Complete Manual</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </SheetContent>
        </Sheet>
    );
}
