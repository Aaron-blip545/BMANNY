import { useState, useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    BookOpen,
    Search,
    ExternalLink,
    Lightbulb,
    CheckCircle2,
    ShieldCheck,
    BarChart3,
    Users as UsersIcon,
    FileText,
    ShieldAlert,
    House,
    CircleHelp,
    Package,
    ClipboardCheck,
    Box,
    SlidersHorizontal,
    PackageCheck,
    PackageMinus,
    ArrowRight,
    Sparkles,
    BadgeCheck,
    Eye,
    ListOrdered,
    Workflow,
} from 'lucide-react';
import { USER_GUIDES, RoleGuide, GuideModule } from '@/lib/user-guides-data';
import { GuideVisualPreview } from '@/components/guide-visual-preview';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'User Guide', href: '/user-guide' }];

function renderGuideIcon(iconName: string, className = 'h-5 w-5') {
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
            return <BookOpen className={className} />;
    }
}

// Visual Flowchart Pipeline per role
function RoleVisualFlowchart({ roleId }: { roleId: string }) {
    switch (roleId) {
        case 'sales_agent':
            return (
                <div className="rounded-2xl border border-blue-500/30 bg-blue-500/[0.03] p-4 sm:p-5 mb-8 shadow-xs">
                    <div className="flex items-center gap-2 mb-3">
                        <Workflow className="h-4 w-4 text-blue-500" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            Visual End-to-End Sales Agent Workflow
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
                        <div className="rounded-xl border border-blue-500/20 bg-card p-3 relative shadow-xs">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block mb-1">Step 1</span>
                            <div className="h-8 w-8 mx-auto rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-sm mb-1.5">💬</div>
                            <span className="text-xs font-bold text-foreground block">Client Chat</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Answer inquiry & check specs</span>
                        </div>

                        <div className="rounded-xl border border-blue-500/20 bg-card p-3 relative shadow-xs">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block mb-1">Step 2</span>
                            <div className="h-8 w-8 mx-auto rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-sm mb-1.5">📄</div>
                            <span className="text-xs font-bold text-foreground block">Issue Quote</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Set items, MOQ & pricing</span>
                        </div>

                        <div className="rounded-xl border border-blue-500/20 bg-card p-3 relative shadow-xs">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block mb-1">Step 3</span>
                            <div className="h-8 w-8 mx-auto rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-sm mb-1.5">💳</div>
                            <span className="text-xs font-bold text-foreground block">Check Payment</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Inspect client bank slip</span>
                        </div>

                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] p-3 relative shadow-xs">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-1">Step 4</span>
                            <div className="h-8 w-8 mx-auto rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-sm mb-1.5">🚀</div>
                            <span className="text-xs font-bold text-foreground block">To Production</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Order goes to factory!</span>
                        </div>
                    </div>
                </div>
            );

        case 'order_manager':
            return (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.03] p-4 sm:p-5 mb-8 shadow-xs">
                    <div className="flex items-center gap-2 mb-3">
                        <Workflow className="h-4 w-4 text-amber-500" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Visual Production & Delivery Milestone Pipeline
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
                        <div className="rounded-xl border border-amber-500/20 bg-card p-3 relative shadow-xs">
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mb-1">Milestone 1</span>
                            <div className="h-8 w-8 mx-auto rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm mb-1.5">📋</div>
                            <span className="text-xs font-bold text-foreground block">Confirmed</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Verify order specs & address</span>
                        </div>

                        <div className="rounded-xl border border-amber-500/20 bg-card p-3 relative shadow-xs">
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mb-1">Milestone 2</span>
                            <div className="h-8 w-8 mx-auto rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm mb-1.5">⚙️</div>
                            <span className="text-xs font-bold text-foreground block">In Production</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Factory starts crafting</span>
                        </div>

                        <div className="rounded-xl border border-amber-500/20 bg-card p-3 relative shadow-xs">
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mb-1">Milestone 3</span>
                            <div className="h-8 w-8 mx-auto rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm mb-1.5">🔍</div>
                            <span className="text-xs font-bold text-foreground block">Quality QA</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Inspect prints & finish</span>
                        </div>

                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] p-3 relative shadow-xs">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-1">Milestone 4</span>
                            <div className="h-8 w-8 mx-auto rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-sm mb-1.5">🚚</div>
                            <span className="text-xs font-bold text-foreground block">Delivery Dispatch</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Courier shipping & completed</span>
                        </div>
                    </div>
                </div>
            );

        case 'product_controller':
            return (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.03] p-4 sm:p-5 mb-8 shadow-xs">
                    <div className="flex items-center gap-2 mb-3">
                        <Workflow className="h-4 w-4 text-emerald-500" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Visual Product Catalog & Customization Flow
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
                        <div className="rounded-xl border border-emerald-500/20 bg-card p-3 relative shadow-xs">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-1">Stage 1</span>
                            <div className="h-8 w-8 mx-auto rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm mb-1.5">📥</div>
                            <span className="text-xs font-bold text-foreground block">Review Requests</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Approve agent feasibility tickets</span>
                        </div>

                        <div className="rounded-xl border border-emerald-500/20 bg-card p-3 relative shadow-xs">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-1">Stage 2</span>
                            <div className="h-8 w-8 mx-auto rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm mb-1.5">🛍️</div>
                            <span className="text-xs font-bold text-foreground block">Manage Products</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Upload photos, SKUs & base price</span>
                        </div>

                        <div className="rounded-xl border border-emerald-500/20 bg-card p-3 relative shadow-xs">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-1">Stage 3</span>
                            <div className="h-8 w-8 mx-auto rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm mb-1.5">🏷️</div>
                            <span className="text-xs font-bold text-foreground block">MOQ & Bulk Tiers</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Set volume discount brackets</span>
                        </div>

                        <div className="rounded-xl border border-emerald-500/20 bg-card p-3 relative shadow-xs">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-1">Stage 4</span>
                            <div className="h-8 w-8 mx-auto rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm mb-1.5">🎁</div>
                            <span className="text-xs font-bold text-foreground block">Packaging & Finishes</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Configure boxes & engraving fees</span>
                        </div>
                    </div>
                </div>
            );

        case 'admin':
            return (
                <div className="rounded-2xl border border-purple-500/30 bg-purple-500/[0.03] p-4 sm:p-5 mb-8 shadow-xs">
                    <div className="flex items-center gap-2 mb-3">
                        <Workflow className="h-4 w-4 text-purple-500" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                            Visual Administration & Oversight Framework
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
                        <div className="rounded-xl border border-purple-500/20 bg-card p-3 relative shadow-xs">
                            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block mb-1">Pillar 1</span>
                            <div className="h-8 w-8 mx-auto rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-sm mb-1.5">📊</div>
                            <span className="text-xs font-bold text-foreground block">KPIs & Revenue</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Track financial health & trends</span>
                        </div>

                        <div className="rounded-xl border border-purple-500/20 bg-card p-3 relative shadow-xs">
                            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block mb-1">Pillar 2</span>
                            <div className="h-8 w-8 mx-auto rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-sm mb-1.5">👥</div>
                            <span className="text-xs font-bold text-foreground block">User Management</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Create & assign staff roles</span>
                        </div>

                        <div className="rounded-xl border border-purple-500/20 bg-card p-3 relative shadow-xs">
                            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block mb-1">Pillar 3</span>
                            <div className="h-8 w-8 mx-auto rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-sm mb-1.5">📑</div>
                            <span className="text-xs font-bold text-foreground block">Export Reports</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Download CSV & PDF financials</span>
                        </div>

                        <div className="rounded-xl border border-purple-500/20 bg-card p-3 relative shadow-xs">
                            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block mb-1">Pillar 4</span>
                            <div className="h-8 w-8 mx-auto rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-sm mb-1.5">🛡️</div>
                            <span className="text-xs font-bold text-foreground block">Chat Moderation</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Audit flagged conversations</span>
                        </div>
                    </div>
                </div>
            );

        default:
            return null;
    }
}

export default function UserGuidePage() {
    const { auth } = usePage().props as { auth?: { user?: { role?: string } } };
    const userRole = auth?.user?.role ?? 'sales_agent';

    const defaultRoleKey = useMemo(() => {
        if (['admin', 'sales_agent', 'product_controller', 'order_manager'].includes(userRole)) {
            return userRole;
        }
        return 'sales_agent';
    }, [userRole]);

    const [activeTab, setActiveTab] = useState<string>(defaultRoleKey);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'visual' | 'compact'>('visual');

    const rolesList = useMemo(() => {
        return [
            { id: 'admin', label: 'Admin', count: USER_GUIDES['admin'].modules.length },
            { id: 'sales_agent', label: 'Sales Agent', count: USER_GUIDES['sales_agent'].modules.length },
            { id: 'product_controller', label: 'Product Controller', count: USER_GUIDES['product_controller'].modules.length },
            { id: 'order_manager', label: 'Order Manager', count: USER_GUIDES['order_manager'].modules.length },
        ];
    }, []);

    const activeRoleGuide = USER_GUIDES[activeTab] ?? USER_GUIDES['sales_agent'];

    const filteredModules = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return activeRoleGuide.modules;

        return activeRoleGuide.modules.filter((m) => {
            return (
                m.title.toLowerCase().includes(query) ||
                m.summary.toLowerCase().includes(query) ||
                m.whenToUse.toLowerCase().includes(query) ||
                m.steps.some((s) => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query)) ||
                m.tips.some((t) => t.toLowerCase().includes(query))
            );
        });
    }, [activeRoleGuide, searchQuery]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Visual User Guide - BMANNY" />

            <div className="bmanny-page max-w-7xl mx-auto pb-16">
                {/* Header */}
                <header className="bmanny-page-header">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <p className="bmanny-page-eyebrow flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                <span>Interactive Visual Documentation</span>
                            </p>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                Visual User Guide
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                                Clear UI diagrams, step-by-step visual walkthroughs, and annotated screenshots for every module.
                            </p>
                        </div>

                        {/* Search & Mode Controls */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <div className="relative w-full sm:w-64">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search visual guides…"
                                    className="w-full rounded-xl border border-input bg-card py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring shadow-xs"
                                />
                            </div>

                            <div className="flex p-1 bg-muted/60 rounded-xl border border-border/60">
                                <button
                                    onClick={() => setViewMode('visual')}
                                    className={cn(
                                        'px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                                        viewMode === 'visual'
                                            ? 'bg-background text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>Visual Mode</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('compact')}
                                    className={cn(
                                        'px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                                        viewMode === 'compact'
                                            ? 'bg-background text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <ListOrdered className="h-3.5 w-3.5" />
                                    <span>Steps Only</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Role Tabs */}
                <div className="mb-6 flex flex-wrap gap-2 p-1.5 bg-muted/40 rounded-2xl border border-border/60">
                    {rolesList.map((tab) => {
                        const isCurrent = activeTab === tab.id;
                        const isUserRole = userRole === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer',
                                    isCurrent
                                        ? 'bg-background text-foreground shadow-md border border-border/80'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
                                )}
                            >
                                <span>{tab.label}</span>
                                <span className={cn(
                                    'rounded-full px-2 py-0.5 text-[11px] font-bold',
                                    isCurrent ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                                )}>
                                    {tab.count}
                                </span>
                                {isUserRole && (
                                    <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-1.5 py-0.5 font-bold uppercase">
                                        Your Role
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Visual Flowchart Timeline */}
                <RoleVisualFlowchart roleId={activeTab} />

                {/* Modules Grid */}
                {filteredModules.length === 0 ? (
                    <div className="bmanny-empty-state py-16 text-muted-foreground text-center">
                        <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-60" />
                        <h3 className="text-base font-semibold text-foreground">No matching guides found</h3>
                        <p className="mt-1 text-sm">
                            Try searching for terms like "permit", "payment", "quotation", "order", or "moq".
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSearchQuery('')}
                            className="mt-4"
                        >
                            Clear Search
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredModules.map((module) => (
                            <Card
                                key={module.id}
                                className="bmanny-workspace overflow-hidden border border-border/80 hover:border-primary/40 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
                            >
                                <CardContent className="p-5 sm:p-6 space-y-4">
                                    {/* Module Header */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                                                {renderGuideIcon(module.iconName, 'h-5 w-5')}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-foreground">
                                                    {module.title}
                                                </h3>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {module.summary}
                                                </p>
                                            </div>
                                        </div>

                                        <Link
                                            href={module.route}
                                            className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                                            title={`Go to ${module.title}`}
                                        >
                                            <span>Open</span>
                                            <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    </div>

                                    {/* Visual UI Wireframe / Live Preview */}
                                    {viewMode === 'visual' && (
                                        <div className="pt-1">
                                            <GuideVisualPreview moduleId={module.id} />
                                        </div>
                                    )}

                                    {/* When to use */}
                                    <div className="rounded-xl bg-muted/30 border border-border/50 p-3 text-xs leading-relaxed">
                                        <span className="font-bold text-foreground">💡 Purpose: </span>
                                        <span className="text-muted-foreground">{module.whenToUse}</span>
                                    </div>

                                    {/* Numbered Step-by-Step Flow */}
                                    <div className="space-y-2.5">
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Step-by-Step Action Plan:
                                        </p>
                                        <div className="space-y-2">
                                            {module.steps.map((step) => (
                                                <div
                                                    key={step.number}
                                                    className="flex items-start gap-2.5 text-xs rounded-lg p-2 bg-card border border-border/40 shadow-2xs"
                                                >
                                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary text-[11px] border border-primary/20">
                                                        {step.number}
                                                    </span>
                                                    <div className="min-w-0 pt-0.5">
                                                        <h4 className="font-semibold text-foreground text-xs">
                                                            {step.title}
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                                            {step.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pro Tip Callout */}
                                    {module.tips.length > 0 && (
                                        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-950 dark:text-amber-300">
                                            <div className="flex items-center gap-1.5 font-bold mb-1">
                                                <Lightbulb className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                                <span>Best Practice</span>
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
                                </CardContent>

                                {/* Footer link */}
                                <div className="border-t border-border/50 px-5 py-3 bg-muted/20 flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground font-mono text-[11px]">
                                        Route: {module.route}
                                    </span>
                                    <Link
                                        href={module.route}
                                        className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                        <span>Jump to workspace</span>
                                        <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
