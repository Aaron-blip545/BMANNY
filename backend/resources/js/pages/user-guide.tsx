import { GuideVisualPreview } from '@/components/guide-visual-preview';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { roleDashboardHref } from '@/lib/role-dashboard';
import { type GuideModule, USER_GUIDES } from '@/lib/user-guides-data';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowRight,
    BookOpen,
    ExternalLink,
    ImageIcon,
    Lightbulb,
    Maximize2,
    Search,
    X,
} from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'User Guide', href: '/user-guide' }];

export default function UserGuidePage() {
    const { auth } = usePage().props as { auth?: { user?: { role?: string } } };
    const userRole = auth?.user?.role ?? 'sales_agent';
    const isAdmin = userRole === 'admin';

    const defaultRoleKey = useMemo(() => {
        if (['admin', 'sales_agent', 'product_controller', 'order_manager'].includes(userRole)) {
            return userRole;
        }
        return 'sales_agent';
    }, [userRole]);

    const [activeTab, setActiveTab] = useState<string>(defaultRoleKey);
    const [searchQuery, setSearchQuery] = useState('');
    const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string; caption?: string } | null>(null);

    const rolesList = useMemo(
        () => [
            { id: 'admin', label: 'Admin' },
            { id: 'sales_agent', label: 'Sales Agent' },
            { id: 'product_controller', label: 'Product Controller' },
            { id: 'order_manager', label: 'Order Manager' },
        ],
        [],
    );

    const effectiveRoleKey = isAdmin ? activeTab : defaultRoleKey;
    const activeRoleGuide = USER_GUIDES[effectiveRoleKey] ?? USER_GUIDES.sales_agent;

    const canAccessRoute = (route: string) => {
        if (!isAdmin) return true;
        if (effectiveRoleKey === 'admin') return true;
        return ['/products', '/inquiries', '/quotations', '/orders', '/notifications/page', '/user-guide'].includes(route);
    };

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

    const scrollToModule = (id: string) => {
        const el = document.getElementById(`guide-step-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`User Guide — ${activeRoleGuide.roleName}`} />

            <main className="bmanny-page pb-16">
                <div className="mx-auto w-full max-w-5xl space-y-6">
                    {/* Clean Page Header */}
                    <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Visual Manual
                            </p>
                            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                                {activeRoleGuide.roleName} User Guide
                            </h1>
                            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                                {activeRoleGuide.description}
                            </p>
                        </div>

                        <Button variant="outline" size="sm" asChild className="w-fit shrink-0 rounded-lg">
                            <Link href={roleDashboardHref(userRole)}>Back to Dashboard</Link>
                        </Button>
                    </header>

                    {/* Admin-Only Cross-Process Overview */}
                    {isAdmin && (
                        <section className="rounded-xl border border-border bg-card p-4 shadow-2xs sm:p-5">
                            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                Administrator Overview — All Web Processes
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Select any department below to inspect its complete visual workflow:
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                {[
                                    { id: 'product_controller', step: '1', title: 'Product Controller', desc: 'Catalog, BOM & Stock' },
                                    { id: 'sales_agent', step: '2', title: 'Sales Agent', desc: 'Inquiries & Quotations' },
                                    { id: 'order_manager', step: '3', title: 'Order Manager', desc: 'Production & Delivery' },
                                    { id: 'admin', step: '4', title: 'Admin Oversight', desc: 'Analytics, Reports & Users' },
                                ].map((proc, idx, arr) => {
                                    const isSelected = effectiveRoleKey === proc.id;
                                    return (
                                        <Fragment key={proc.id}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setActiveTab(proc.id);
                                                    setSearchQuery('');
                                                }}
                                                className={cn(
                                                    'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2 text-left transition-colors',
                                                    isSelected
                                                        ? 'border-[#071d49] bg-[#071d49] text-white dark:border-[#163b78] dark:bg-[#163b78]'
                                                        : 'border-border bg-background text-foreground hover:bg-muted',
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                                                        isSelected
                                                            ? 'bg-white/20 text-white'
                                                            : 'bg-muted text-foreground',
                                                    )}
                                                >
                                                    {proc.step}
                                                </span>
                                                <div>
                                                    <span className="block text-xs font-bold leading-tight">{proc.title}</span>
                                                    <span
                                                        className={cn(
                                                            'block text-[11px]',
                                                            isSelected ? 'text-white/75' : 'text-muted-foreground',
                                                        )}
                                                    >
                                                        {proc.desc}
                                                    </span>
                                                </div>
                                            </button>
                                            {idx < arr.length - 1 && (
                                                <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Search Bar (and Role Label for Non-Admins) */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs font-medium text-muted-foreground">
                            {isAdmin ? (
                                <>
                                    Viewing <strong className="font-semibold text-foreground">{activeRoleGuide.roleName}</strong> workflow ({activeRoleGuide.modules.length} steps)
                                </>
                            ) : (
                                <>
                                    Showing step-by-step instructions tailored for your <strong className="font-semibold text-foreground">{activeRoleGuide.roleName}</strong> workspace.
                                </>
                            )}
                        </p>

                        <div className="relative w-full sm:w-64">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search guide…"
                                className="w-full rounded-lg border border-border bg-card py-2 pr-8 pl-8 text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    aria-label="Clear search"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Simple Horizontal Flowchart Overview */}
                    <nav
                        aria-label="Workflow overview"
                        className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-2xs"
                    >
                        <p className="mb-2.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Workflow Overview — Click any step to jump
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            {activeRoleGuide.modules.map((mod, idx) => (
                                <Fragment key={mod.id}>
                                    <button
                                        type="button"
                                        onClick={() => scrollToModule(mod.id)}
                                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                                    >
                                        <span className="flex size-5 items-center justify-center rounded-full bg-[#071d49] text-[10px] font-bold text-white dark:bg-[#163b78]">
                                            {idx + 1}
                                        </span>
                                        <span>{mod.shortTitle}</span>
                                    </button>
                                    {idx < activeRoleGuide.modules.length - 1 && (
                                        <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                                    )}
                                </Fragment>
                            ))}
                        </div>
                    </nav>

                    {/* Clean Vertical Flowchart Cards */}
                    {filteredModules.length === 0 ? (
                        <div className="rounded-xl border border-border bg-card px-6 py-14 text-center">
                            <BookOpen className="mx-auto mb-3 size-8 text-muted-foreground" />
                            <h3 className="text-sm font-bold text-foreground">No matching steps found</h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Try a different keyword or clear the search box.
                            </p>
                            <Button variant="outline" size="sm" onClick={() => setSearchQuery('')} className="mt-4 rounded-lg">
                                Clear Search
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-0">
                            {filteredModules.map((module: GuideModule, index: number) => {
                                const isLast = index === filteredModules.length - 1;

                                return (
                                    <div key={module.id} id={`guide-step-${module.id}`} className="scroll-mt-6">
                                        <article className="overflow-hidden rounded-xl border border-border bg-card shadow-2xs">
                                            {/* Simple Card Header */}
                                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#071d49] text-xs font-bold text-white dark:bg-[#163b78]">
                                                        {index + 1}
                                                    </span>
                                                    <div>
                                                        <h2 className="text-base font-bold text-foreground">{module.title}</h2>
                                                        <p className="text-xs text-muted-foreground">{module.summary}</p>
                                                    </div>
                                                </div>

                                                {canAccessRoute(module.route) && (
                                                    <Button variant="outline" size="sm" asChild className="rounded-lg text-xs">
                                                        <Link href={module.route}>
                                                            <span>Open Page</span>
                                                            <ExternalLink className="ml-1.5 size-3.5" />
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Consistent 2-Column Content: Screenshot Left, Steps Right */}
                                            <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
                                                {/* Screenshot */}
                                                <div>
                                                    {module.imageSrc ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setLightboxImage({
                                                                    src: module.imageSrc!,
                                                                    title: module.title,
                                                                    caption: module.imageCaption || module.summary,
                                                                })
                                                            }
                                                            className="group relative block w-full cursor-zoom-in overflow-hidden rounded-lg border border-border bg-muted/20 text-left"
                                                            title="Click to enlarge"
                                                        >
                                                            <img
                                                                src={module.imageSrc}
                                                                alt={module.title}
                                                                className="h-auto w-full object-contain transition-transform duration-200 group-hover:scale-[1.01]"
                                                                loading="lazy"
                                                            />
                                                            <span className="absolute right-2.5 bottom-2.5 inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[11px] font-medium text-white">
                                                                <Maximize2 className="size-3" />
                                                                Zoom
                                                            </span>
                                                        </button>
                                                    ) : (
                                                        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3">
                                                            <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
                                                                <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                                                                    <ImageIcon className="size-3.5" />
                                                                    Preview
                                                                </span>
                                                                <span>Screenshot pending</span>
                                                            </div>
                                                            <GuideVisualPreview moduleId={module.id} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Simple Numbered Steps + Tip */}
                                                <div className="space-y-4">
                                                    <ol className="space-y-3">
                                                        {module.steps.map((step) => (
                                                            <li key={step.number} className="flex items-start gap-3">
                                                                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-bold text-foreground">
                                                                    {step.number}
                                                                </span>
                                                                <div className="min-w-0 text-xs leading-relaxed">
                                                                    <p className="font-semibold text-foreground">{step.title}</p>
                                                                    <p className="mt-0.5 text-muted-foreground">{step.description}</p>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ol>

                                                    {module.tips.length > 0 && (
                                                        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                                                            <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-foreground" />
                                                            <p>
                                                                <strong className="font-semibold text-foreground">Tip: </strong>
                                                                {module.tips[0]}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </article>

                                        {/* Minimal Downward Flowchart Arrow */}
                                        {!isLast && (
                                            <div className="flex flex-col items-center py-2.5 text-muted-foreground" aria-hidden="true">
                                                <div className="h-4 w-px bg-border" />
                                                <ArrowDown className="size-4" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Fullscreen Zoom Modal */}
            {lightboxImage && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={lightboxImage.title}
                    onClick={() => setLightboxImage(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                            <div>
                                <h3 className="text-sm font-bold text-foreground">{lightboxImage.title}</h3>
                                {lightboxImage.caption && (
                                    <p className="mt-0.5 text-xs text-muted-foreground">{lightboxImage.caption}</p>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setLightboxImage(null)}
                                aria-label="Close preview"
                                className="shrink-0 rounded-lg"
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                        <div className="max-h-[78vh] overflow-auto bg-muted/30 p-4">
                            <img
                                src={lightboxImage.src}
                                alt={lightboxImage.title}
                                className="mx-auto h-auto max-w-full rounded-lg border border-border"
                            />
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
