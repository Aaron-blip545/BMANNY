import { useState, useMemo } from 'react';
import { usePage, Link } from '@inertiajs/react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
    BookOpen,
    HelpCircle,
    Search,
    ChevronRight,
    ExternalLink,
    CheckCircle2,
    Lightbulb,
    BarChart3,
    Users as UsersIcon,
    FileText,
    ShieldAlert,
    House,
    CircleHelp,
    ShieldCheck,
    Package,
    ClipboardCheck,
    Box,
    SlidersHorizontal,
    PackageCheck,
    PackageMinus,
    ArrowRight,
} from 'lucide-react';
import { USER_GUIDES, RoleGuide, GuideModule } from '@/lib/user-guides-data';
import { GuideVisualPreview } from '@/components/guide-visual-preview';
import { cn } from '@/lib/utils';

// Icon resolver helper
function renderGuideIcon(iconName: string, className = 'h-4 w-4') {
    switch (iconName) {
        case 'BarChart3':
            return <BarChart3 className={className} />;
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

    const activeRoleGuide: RoleGuide = USER_GUIDES[selectedRole] ?? USER_GUIDES['sales_agent'];

    // Auto-expand module matching current page url
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

    // Check if a module corresponds to the current page
    const isCurrentPage = (route: string) => {
        return currentUrl === route || (route !== '/' && currentUrl.startsWith(route));
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 gap-1.5 rounded-full px-3 text-xs font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 cursor-pointer"
                    title="Open Quick User Guide"
                >
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="hidden sm:inline">Guide</span>
                </Button>
            </SheetTrigger>

            <SheetContent
                side="right"
                className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-background border-l border-border"
            >
                {/* Header */}
                <div className="p-5 border-b border-border bg-muted/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                                <BookOpen className="h-4 w-4" />
                            </div>
                            <div>
                                <SheetTitle className="text-base font-bold text-foreground">
                                    BMANNY User Guide
                                </SheetTitle>
                                <p className="text-xs text-muted-foreground">
                                    Simple, step-by-step instructions for each module
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/user-guide"
                            onClick={() => setOpen(false)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                            <span>Full Guide</span>
                            <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>

                    {/* Role Selector Tabs */}
                    <div className="mt-4 grid grid-cols-4 gap-1 p-1 bg-muted/60 rounded-xl">
                        {[
                            { id: 'admin', label: 'Admin' },
                            { id: 'sales_agent', label: 'Sales' },
                            { id: 'product_controller', label: 'Product' },
                            { id: 'order_manager', label: 'Order' },
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
                                        'py-1.5 px-2 text-xs font-semibold rounded-lg transition-all text-center cursor-pointer',
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
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search ${activeRoleGuide.roleName} guides…`}
                            className="w-full rounded-lg border border-input bg-background py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </div>

                {/* Modules List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <div className="rounded-xl border border-border bg-card p-3">
                        <span className={cn('inline-block px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider mb-1', activeRoleGuide.badgeColor)}>
                            {activeRoleGuide.roleName} Overview
                        </span>
                        <h3 className="text-xs font-bold text-foreground">
                            {activeRoleGuide.headline}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                            {activeRoleGuide.description}
                        </p>
                    </div>

                    <div className="pt-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                            Available Modules ({filteredModules.length})
                        </p>

                        {filteredModules.length === 0 ? (
                            <div className="py-8 text-center text-xs text-muted-foreground">
                                No guide topics match "{searchQuery}".
                            </div>
                        ) : (
                            filteredModules.map((module) => {
                                const isCurrent = isCurrentPage(module.route);
                                const isExpanded =
                                    expandedModuleId === module.id ||
                                    (expandedModuleId === null && isCurrent);

                                return (
                                    <div
                                        key={module.id}
                                        className={cn(
                                            'mb-2.5 overflow-hidden rounded-xl border transition-all',
                                            isCurrent
                                                ? 'border-primary/60 bg-primary/[0.02] shadow-sm'
                                                : 'border-border bg-card hover:border-border/80',
                                        )}
                                    >
                                        {/* Module Card Header */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setExpandedModuleId(
                                                    isExpanded ? '__none__' : module.id,
                                                )
                                            }
                                            className="w-full p-3 flex items-center justify-between text-left cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                <div
                                                    className={cn(
                                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                                                        isCurrent
                                                            ? 'border-primary/30 bg-primary/10 text-primary'
                                                            : 'border-border bg-muted/60 text-muted-foreground group-hover:text-foreground',
                                                    )}
                                                >
                                                    {renderGuideIcon(module.iconName)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <h4 className="text-xs font-bold text-foreground truncate">
                                                            {module.title}
                                                        </h4>
                                                        {isCurrent && (
                                                            <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                                                                Current Page
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground truncate">
                                                        {module.summary}
                                                    </p>
                                                </div>
                                            </div>

                                            <ChevronRight
                                                className={cn(
                                                    'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                                                    isExpanded && 'rotate-90',
                                                )}
                                            />
                                        </button>

                                        {/* Expandable Step-by-Step Content */}
                                        {isExpanded && (
                                            <div className="border-t border-border/70 p-3 bg-muted/10 space-y-3">
                                                {/* Visual UI Preview */}
                                                <div className="mb-2">
                                                    <GuideVisualPreview moduleId={module.id} />
                                                </div>

                                                {/* When to use */}
                                                <div className="text-[11px] bg-muted/40 rounded-lg p-2.5 border border-border/50">
                                                    <span className="font-bold text-foreground">When to use: </span>
                                                    <span className="text-muted-foreground">{module.whenToUse}</span>
                                                </div>

                                                {/* Steps */}
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                                                        How It Works:
                                                    </p>
                                                    <div className="space-y-2">
                                                        {module.steps.map((step) => (
                                                            <div key={step.number} className="flex items-start gap-2 text-xs">
                                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary border border-primary/20">
                                                                    {step.number}
                                                                </span>
                                                                <div className="min-w-0 pt-0.5">
                                                                    <p className="font-semibold text-foreground text-[11px]">
                                                                        {step.title}
                                                                    </p>
                                                                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                                                                        {step.description}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Tips */}
                                                {module.tips.length > 0 && (
                                                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-900 dark:text-amber-300">
                                                        <div className="flex items-center gap-1.5 font-bold mb-1">
                                                            <Lightbulb className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                                            <span>Pro Tip</span>
                                                        </div>
                                                        <ul className="list-disc pl-4 space-y-1">
                                                            {module.tips.map((tip, idx) => (
                                                                <li key={idx} className="leading-relaxed">
                                                                    {tip}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Direct Link to Module */}
                                                <div className="pt-1 flex justify-end">
                                                    <Link
                                                        href={module.route}
                                                        onClick={() => setOpen(false)}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                                                    >
                                                        <span>Open {module.title}</span>
                                                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Need more help?</span>
                    <Link
                        href="/user-guide"
                        onClick={() => setOpen(false)}
                        className="font-bold text-primary hover:underline flex items-center gap-1"
                    >
                        <span>View Complete Guidebook</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </SheetContent>
        </Sheet>
    );
}
