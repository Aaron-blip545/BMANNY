import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserDisplayName } from '@/components/user-info';
import { useInitials } from '@/hooks/use-initials';
import { roleDashboardHref, roleLabel } from '@/lib/role-dashboard';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Briefcase,
    Crown,
    KeyRound,
    Layers,
    PackageCheck,
    Palette,
    ShieldCheck,
    Sparkles,
    UserCog,
} from 'lucide-react';
import { type PropsWithChildren } from 'react';

interface SettingsNavItem {
    title: string;
    subtitle: string;
    href: string;
    icon: typeof UserCog;
}

const settingsNavItems: SettingsNavItem[] = [
    {
        title: 'Identity & Profile',
        subtitle: 'Personal & contact details',
        href: '/settings/profile',
        icon: UserCog,
    },
    {
        title: 'Security Vault',
        subtitle: 'Password & account safety',
        href: '/settings/password',
        icon: KeyRound,
    },
    {
        title: 'Visual Studio',
        subtitle: 'Portal theme & display',
        href: '/settings/appearance',
        icon: Palette,
    },
];

function getRoleTheme(role?: string) {
    switch (role) {
        case 'admin':
            return {
                icon: Crown,
                pill: 'border-white/20 bg-white/10 text-white',
                glow: 'from-[#d4a72c]/25 via-[#3e70db]/15 to-transparent',
                code: 'ADM',
            };
        case 'sales_agent':
            return {
                icon: Sparkles,
                pill: 'border-white/20 bg-white/10 text-white',
                glow: 'from-sky-400/25 via-[#1236a3]/20 to-transparent',
                code: 'SLS',
            };
        case 'order_manager':
            return {
                icon: PackageCheck,
                pill: 'border-white/20 bg-white/10 text-white',
                glow: 'from-amber-400/25 via-[#1236a3]/20 to-transparent',
                code: 'ORD',
            };
        case 'product_controller':
            return {
                icon: Layers,
                pill: 'border-white/20 bg-white/10 text-white',
                glow: 'from-emerald-400/25 via-[#1236a3]/20 to-transparent',
                code: 'PRD',
            };
        default:
            return {
                icon: Briefcase,
                pill: 'border-white/20 bg-white/10 text-white',
                glow: 'from-[#d4a72c]/20 via-[#1236a3]/20 to-transparent',
                code: 'STF',
            };
    }
}

export default function SettingsLayout({ children }: PropsWithChildren) {
    const page = usePage<SharedData>();
    const currentPath = page.url.split('?')[0];
    const user = page.props.auth?.user;
    const getInitials = useInitials();

    const displayName = user ? getUserDisplayName(user) : 'Staff Member';
    const initials = getInitials(displayName);
    const dashboardHref = roleDashboardHref(user?.role);
    const roleTheme = getRoleTheme(user?.role);
    const RoleIcon = roleTheme.icon;
    const staffCode = `BM-${roleTheme.code}-${String(user?.user_id ?? user?.id ?? 1).padStart(3, '0')}`;

    return (
        <main className="bmanny-page pb-12">
            <div className="bmanny-page-inner max-w-6xl space-y-8">
                {/* Executive Identity Hero Banner */}
                <section className="relative">
                    <div className="relative overflow-hidden rounded-2xl border border-[#1d407b]/60 bg-gradient-to-br from-[#06183d] via-[#0a2459] to-[#123b83] px-6 pt-7 pb-14 text-white shadow-[0_14px_38px_rgba(7,29,73,0.22)] sm:px-8 sm:pt-8 sm:pb-16">
                        {/* Subtle Architectural Grid & Glow */}
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 opacity-[0.07]"
                            style={{
                                backgroundImage:
                                    'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
                                backgroundSize: '36px 36px',
                            }}
                        />
                        <div
                            aria-hidden="true"
                            className={cn('pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-radial blur-3xl', roleTheme.glow)}
                        />
                        {/* Top Metallic Gold Accent Line */}
                        <div
                            aria-hidden="true"
                            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#d4a72c] via-[#f2cf66] to-[#d4a72c]/30"
                        />

                        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            {/* Left: Monogram Crest + Identity */}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                                <div className="relative w-fit shrink-0">
                                    <div className="rounded-full bg-gradient-to-br from-[#e5b93f] via-[#d4a72c] to-[#8a6510] p-[2.5px] shadow-[0_0_24px_rgba(212,167,44,0.3)]">
                                        <Avatar className="size-16 border-2 border-[#071d49] sm:size-[72px]">
                                            <AvatarImage src={user?.avatar} alt={displayName} />
                                            <AvatarFallback className="bg-[#102d69] text-lg font-bold tracking-wider text-white sm:text-xl">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <span
                                        title={user?.is_active === false ? 'Inactive' : 'Active account'}
                                        className={cn(
                                            'absolute right-0.5 bottom-0.5 flex size-4 items-center justify-center rounded-full border-2 border-[#071d49]',
                                            user?.is_active === false ? 'bg-rose-500' : 'bg-emerald-400',
                                        )}
                                    />
                                </div>

                                <div className="min-w-0 space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[11px] font-semibold tracking-[0.16em] text-white/80 uppercase">
                                            BMANNY Control Desk
                                        </span>
                                        <span className="text-white/30">•</span>
                                        <span className="font-mono text-[11px] tracking-wider text-white/75">{staffCode}</span>
                                    </div>

                                    <h1 className="truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">{displayName}</h1>

                                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-white/80">
                                        <span className="truncate">{user?.email}</span>
                                        <span className="hidden text-white/30 sm:inline">•</span>
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-xs',
                                                roleTheme.pill,
                                            )}
                                        >
                                            <RoleIcon className="size-3" />
                                            {roleLabel(user?.role)}
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white">
                                            <ShieldCheck className="size-3" />
                                            {user?.is_active === false ? 'Inactive' : 'Verified Active'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Glassmorphic Back Pill */}
                            <div className="flex shrink-0 items-center gap-3">
                                <Link
                                    href={dashboardHref}
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition-all hover:border-white/40 hover:bg-white/15"
                                >
                                    <ArrowLeft className="size-4 text-white" />
                                    <span>Return to Dashboard</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Floating Tab Dock Overlapping Hero Bottom */}
                    <nav
                        aria-label="Settings sections"
                        className="relative z-20 mx-3 -mt-8 rounded-2xl border border-border bg-card/95 p-1.5 shadow-[0_10px_30px_rgba(7,29,73,0.10)] backdrop-blur-md sm:mx-6"
                    >
                        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                            {settingsNavItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = currentPath === item.href;

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            prefetch
                                            className={cn(
                                                'group relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3 transition-all duration-200',
                                                isActive
                                                    ? 'bg-[#071d49] text-white shadow-sm dark:bg-[#163b78]'
                                                    : 'text-foreground hover:bg-muted/80',
                                            )}
                                        >
                                            {isActive && (
                                                <span
                                                    aria-hidden="true"
                                                    className="absolute inset-x-4 bottom-0 h-[3px] rounded-t-full bg-gradient-to-r from-[#d4a72c] via-[#f2cf66] to-[#d4a72c]"
                                                />
                                            )}
                                            <span
                                                className={cn(
                                                    'flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
                                                    isActive
                                                        ? 'border-white/25 bg-white/10 text-white'
                                                        : 'border-border bg-background text-muted-foreground group-hover:text-foreground',
                                                )}
                                            >
                                                <Icon className="size-4" />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-semibold leading-tight">{item.title}</span>
                                                <span
                                                    className={cn(
                                                        'mt-0.5 block truncate text-[11px]',
                                                        isActive ? 'text-white/75' : 'text-muted-foreground',
                                                    )}
                                                >
                                                    {item.subtitle}
                                                </span>
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </section>

                {/* Active Page Canvas */}
                <div className="min-w-0">{children}</div>
            </div>
        </main>
    );
}
