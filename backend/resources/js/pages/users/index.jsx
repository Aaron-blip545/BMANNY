import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInitials } from '@/hooks/use-initials';
import AppLayout from '@/layouts/app-layout';
import { roleBadgeClasses, roleLabel } from '@/lib/role-dashboard';
import { confirmModal } from '@/lib/sweetalert';
import { cn } from '@/lib/utils';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Briefcase,
    CheckCircle2,
    Crown,
    LayoutGrid,
    List,
    Mail,
    PackageCheck,
    Pencil,
    Phone,
    Power,
    Search,
    ShieldCheck,
    Sparkles,
    Layers,
    UserCheck,
    UserPlus,
    Users,
    UserX,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const ROLE_TABS = [
    { value: 'all', label: 'All Accounts', icon: Users },
    { value: 'admin', label: 'Admins', icon: Crown },
    { value: 'sales_agent', label: 'Sales Agents', icon: Sparkles },
    { value: 'order_manager', label: 'Order Managers', icon: PackageCheck },
    { value: 'product_controller', label: 'Product Controllers', icon: Layers },
    { value: 'customer', label: 'Customers', icon: Briefcase },
];

function getRoleCode(role) {
    switch (role) {
        case 'admin':
            return 'ADM';
        case 'sales_agent':
            return 'SLS';
        case 'order_manager':
            return 'ORD';
        case 'product_controller':
            return 'PRD';
        case 'customer':
            return 'CLN';
        default:
            return 'USR';
    }
}

export default function UsersIndex({ users = [], activeRole = 'all', roleCounts = {} }) {
    const { flash, auth } = usePage().props;
    const currentUserId = auth?.user?.user_id;
    const getInitials = useInitials();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState('table');

    const totalCount = roleCounts.all ?? users.length;
    const activeCount = roleCounts.active ?? users.filter((u) => u.is_active).length;
    const inactiveCount = roleCounts.inactive ?? users.filter((u) => !u.is_active).length;
    const staffCount =
        (roleCounts.admin ?? 0) +
        (roleCounts.sales_agent ?? 0) +
        (roleCounts.order_manager ?? 0) +
        (roleCounts.product_controller ?? 0);

    const filteredUsers = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return users.filter((user) => {
            if (statusFilter === 'active' && !user.is_active) return false;
            if (statusFilter === 'inactive' && user.is_active) return false;

            if (!q) return true;
            const code = `bm-${getRoleCode(user.role).toLowerCase()}-${String(user.user_id).padStart(3, '0')}`;
            return (
                (user.full_name || '').toLowerCase().includes(q) ||
                (user.email || '').toLowerCase().includes(q) ||
                (user.phone_number || '').toLowerCase().includes(q) ||
                roleLabel(user.role).toLowerCase().includes(q) ||
                code.includes(q)
            );
        });
    }, [users, searchQuery, statusFilter]);

    async function handleToggleActive(user) {
        const isDeactivating = Boolean(user.is_active);
        const confirmed = await confirmModal({
            title: isDeactivating ? `Deactivate ${user.full_name}?` : `Reactivate ${user.full_name}?`,
            text: isDeactivating
                ? 'This user will immediately lose access to the web portal and mobile app until reactivated.'
                : 'This user will regain access to their assigned BMANNY workspace.',
            icon: isDeactivating ? 'warning' : 'question',
            confirmButtonText: isDeactivating ? 'Deactivate Account' : 'Reactivate Account',
            cancelButtonText: 'Cancel',
            isDestructive: isDeactivating,
        });

        if (!confirmed) return;
        router.patch(route('users.toggle-active', user.user_id), {}, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Manage Users', href: '/users' }]}>
            <Head title="Manage Users" />

            <main className="bmanny-page pb-12">
                <div className="bmanny-page-inner max-w-7xl space-y-8">
                    {/* Executive Directory Hero Banner */}
                    <section className="relative">
                        <div className="relative overflow-hidden rounded-2xl border border-[#1d407b]/60 bg-gradient-to-br from-[#06183d] via-[#0a2459] to-[#123b83] px-6 pt-7 pb-14 text-white shadow-[0_14px_38px_rgba(7,29,73,0.22)] sm:px-8 sm:pt-8 sm:pb-16">
                            {/* Architectural Grid Overlay */}
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
                                className="pointer-events-none absolute -top-24 -right-20 size-80 rounded-full bg-radial from-[#d4a72c]/25 via-[#3e70db]/15 to-transparent blur-3xl"
                            />
                            <div
                                aria-hidden="true"
                                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#d4a72c] via-[#f2cf66] to-[#d4a72c]/30"
                            />

                            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-semibold tracking-[0.18em] text-[#f2cf66] uppercase">
                                            BMANNY Administration
                                        </span>
                                        <span className="text-white/30">•</span>
                                        <span className="text-[11px] font-medium text-blue-200/80">Access Control</span>
                                    </div>
                                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                        User Access Directory
                                    </h1>
                                    <p className="max-w-xl text-sm text-blue-100/80">
                                        Provision staff accounts, manage role permissions, and control active portal sessions across BMANNY.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <Link
                                        href={route('users.create')}
                                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4a72c] to-[#e5b93f] px-5 py-2.5 text-sm font-bold text-[#071d49] shadow-[0_6px_20px_rgba(212,167,44,0.35)] transition-all hover:-translate-y-0.5 hover:brightness-105"
                                    >
                                        <UserPlus className="size-4" />
                                        <span>Provision Account</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Telemetry Strip */}
                            <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-xs">
                                    <div className="flex items-center justify-between text-xs text-blue-200/80">
                                        <span>Total Accounts</span>
                                        <Users className="size-3.5 text-[#f2cf66]" />
                                    </div>
                                    <p className="mt-1 text-xl font-bold tabular-nums text-white">{totalCount}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-xs">
                                    <div className="flex items-center justify-between text-xs text-blue-200/80">
                                        <span>Active Access</span>
                                        <UserCheck className="size-3.5 text-emerald-400" />
                                    </div>
                                    <p className="mt-1 text-xl font-bold tabular-nums text-emerald-300">{activeCount}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-xs">
                                    <div className="flex items-center justify-between text-xs text-blue-200/80">
                                        <span>Deactivated</span>
                                        <UserX className="size-3.5 text-rose-400" />
                                    </div>
                                    <p className="mt-1 text-xl font-bold tabular-nums text-rose-300">{inactiveCount}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-xs">
                                    <div className="flex items-center justify-between text-xs text-blue-200/80">
                                        <span>Internal Staff</span>
                                        <ShieldCheck className="size-3.5 text-sky-300" />
                                    </div>
                                    <p className="mt-1 text-xl font-bold tabular-nums text-white">{staffCount}</p>
                                </div>
                            </div>
                        </div>

                        {/* Floating Filter & Search Control Dock */}
                        <div className="relative z-20 mx-3 -mt-8 rounded-2xl border border-border bg-card/95 p-3 shadow-[0_10px_30px_rgba(7,29,73,0.10)] backdrop-blur-md sm:mx-6 sm:p-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                {/* Role Tabs */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {ROLE_TABS.map((tab) => {
                                        const Icon = tab.icon;
                                        const isActive = activeRole === tab.value;
                                        const count = roleCounts[tab.value];

                                        return (
                                            <Link
                                                key={tab.value}
                                                href={route('users.index', tab.value === 'all' ? {} : { role: tab.value })}
                                                preserveScroll
                                                className={cn(
                                                    'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all',
                                                    isActive
                                                        ? 'bg-[#071d49] text-white shadow-xs dark:bg-[#163b78]'
                                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                                                )}
                                            >
                                                <Icon className={cn('size-3.5', isActive ? 'text-[#f2cf66]' : 'text-muted-foreground')} />
                                                <span>{tab.label}</span>
                                                {typeof count === 'number' && (
                                                    <span
                                                        className={cn(
                                                            'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                                                            isActive ? 'bg-white/15 text-white' : 'bg-background text-muted-foreground',
                                                        )}
                                                    >
                                                        {count}
                                                    </span>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* Right: Search + Status Filter + View Switcher */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="relative min-w-[210px] flex-1 sm:flex-initial">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search name, email, ID…"
                                            className="h-9 rounded-xl pr-8 pl-8 text-xs"
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

                                    <div className="flex rounded-xl border border-border bg-muted/40 p-0.5 text-xs">
                                        {[
                                            { id: 'all', label: 'All' },
                                            { id: 'active', label: 'Active' },
                                            { id: 'inactive', label: 'Off' },
                                        ].map((st) => (
                                            <button
                                                key={st.id}
                                                type="button"
                                                onClick={() => setStatusFilter(st.id)}
                                                className={cn(
                                                    'cursor-pointer rounded-lg px-2.5 py-1 font-semibold transition-colors',
                                                    statusFilter === st.id
                                                        ? 'bg-background text-foreground shadow-2xs'
                                                        : 'text-muted-foreground hover:text-foreground',
                                                )}
                                            >
                                                {st.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex rounded-xl border border-border bg-muted/40 p-0.5">
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('table')}
                                            className={cn(
                                                'cursor-pointer rounded-lg p-1.5 transition-colors',
                                                viewMode === 'table'
                                                    ? 'bg-background text-primary shadow-2xs'
                                                    : 'text-muted-foreground hover:text-foreground',
                                            )}
                                            title="Table view"
                                            aria-label="Table view"
                                        >
                                            <List className="size-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('cards')}
                                            className={cn(
                                                'cursor-pointer rounded-lg p-1.5 transition-colors',
                                                viewMode === 'cards'
                                                    ? 'bg-background text-primary shadow-2xs'
                                                    : 'text-muted-foreground hover:text-foreground',
                                            )}
                                            title="ID cards view"
                                            aria-label="ID cards view"
                                        >
                                            <LayoutGrid className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Flash Feedback */}
                    {flash?.success && (
                        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/35 dark:text-emerald-300">
                            <CheckCircle2 className="size-4 shrink-0" />
                            <span>{flash.success}</span>
                        </div>
                    )}

                    {/* Empty State */}
                    {filteredUsers.length === 0 ? (
                        <div className="bmanny-workspace bmanny-empty-state">
                            <Users />
                            <h3 className="text-base font-bold text-foreground">No matching accounts</h3>
                            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                Try adjusting your search query, status toggle, or role filter—or provision a new user account.
                            </p>
                            {(searchQuery || statusFilter !== 'all') && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-4 rounded-xl"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setStatusFilter('all');
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    ) : viewMode === 'table' ? (
                        /* Directory Table View */
                        <section className="bmanny-workspace overflow-hidden">
                            <div className="flex items-center justify-between border-b border-border bg-muted/25 px-5 py-3 text-xs text-muted-foreground">
                                <span>
                                    Showing <strong className="font-semibold text-foreground">{filteredUsers.length}</strong> of{' '}
                                    <strong className="font-semibold text-foreground">{users.length}</strong> account
                                    {users.length === 1 ? '' : 's'}
                                </span>
                                <span className="font-mono text-[11px] uppercase">Role Filter: {activeRole.replace('_', ' ')}</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-border bg-muted/40 text-[11px] tracking-wider text-muted-foreground uppercase">
                                        <tr>
                                            <th className="px-5 py-3.5 font-semibold">Account Holder</th>
                                            <th className="px-5 py-3.5 font-semibold">Contact</th>
                                            <th className="px-5 py-3.5 font-semibold">Role</th>
                                            <th className="px-5 py-3.5 font-semibold">Status</th>
                                            <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/70">
                                        {filteredUsers.map((user) => {
                                            const isSelf = currentUserId === user.user_id;
                                            const code = `BM-${getRoleCode(user.role)}-${String(user.user_id).padStart(3, '0')}`;
                                            return (
                                                <tr key={user.user_id} className="group transition-colors hover:bg-muted/35">
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="size-10 shrink-0 border border-[#d4a72c]/50">
                                                                <AvatarFallback className="bg-[#071d49] text-xs font-bold text-white dark:bg-[#163b78]">
                                                                    {getInitials(user.full_name || user.email)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="truncate font-semibold text-foreground">
                                                                        {user.full_name}
                                                                    </span>
                                                                    {isSelf && (
                                                                        <span className="rounded-full bg-[#d4a72c]/20 px-2 py-0.5 text-[10px] font-bold text-[#9a7310] dark:text-[#f2cf66]">
                                                                            You
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="font-mono text-[11px] text-muted-foreground">{code}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="space-y-0.5 text-xs">
                                                            <p className="font-medium text-foreground">{user.email}</p>
                                                            <p className="text-muted-foreground">{user.phone_number || 'No phone number'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold',
                                                                roleBadgeClasses(user.role),
                                                            )}
                                                        >
                                                            {roleLabel(user.role)}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                                                                user.is_active
                                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
                                                            )}
                                                        >
                                                            <span
                                                                className={cn(
                                                                    'size-1.5 rounded-full',
                                                                    user.is_active ? 'bg-emerald-500' : 'bg-rose-500',
                                                                )}
                                                            />
                                                            {user.is_active ? 'Active' : 'Deactivated'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <div className="inline-flex items-center gap-1.5">
                                                            <Button variant="outline" size="sm" asChild className="h-8 rounded-lg px-2.5 text-xs">
                                                                <Link href={route('users.edit', user.user_id)}>
                                                                    <Pencil className="mr-1.5 size-3.5" />
                                                                    Edit
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleToggleActive(user)}
                                                                className={cn(
                                                                    'h-8 rounded-lg px-2.5 text-xs font-semibold',
                                                                    user.is_active
                                                                        ? 'text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/40'
                                                                        : 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40',
                                                                )}
                                                            >
                                                                <Power className="mr-1.5 size-3.5" />
                                                                {user.is_active ? 'Deactivate' : 'Reactivate'}
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    ) : (
                        /* ID Cards Grid View */
                        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredUsers.map((user) => {
                                const isSelf = currentUserId === user.user_id;
                                const code = `BM-${getRoleCode(user.role)}-${String(user.user_id).padStart(3, '0')}`;

                                return (
                                    <article
                                        key={user.user_id}
                                        className="group overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                                    >
                                        <div className="relative flex items-center justify-between bg-gradient-to-r from-[#071d49] to-[#123b83] px-4 py-3 text-white">
                                            <span className="font-mono text-[11px] font-semibold tracking-wider text-[#f2cf66]">
                                                {code}
                                            </span>
                                            <span
                                                className={cn(
                                                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                                    user.is_active
                                                        ? 'bg-emerald-400/15 text-emerald-200'
                                                        : 'bg-rose-400/20 text-rose-200',
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'size-1.5 rounded-full',
                                                        user.is_active ? 'bg-emerald-400' : 'bg-rose-400',
                                                    )}
                                                />
                                                {user.is_active ? 'Active' : 'Deactivated'}
                                            </span>
                                        </div>

                                        <div className="p-4">
                                            <div className="flex items-start gap-3">
                                                <Avatar className="size-11 shrink-0 border-2 border-[#d4a72c]/50">
                                                    <AvatarFallback className="bg-[#071d49] text-xs font-bold text-white dark:bg-[#163b78]">
                                                        {getInitials(user.full_name || user.email)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <h3 className="truncate text-sm font-bold text-foreground">{user.full_name}</h3>
                                                        {isSelf && (
                                                            <span className="rounded-full bg-[#d4a72c]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#9a7310] dark:text-[#f2cf66]">
                                                                You
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-1">
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold',
                                                                roleBadgeClasses(user.role),
                                                            )}
                                                        >
                                                            {roleLabel(user.role)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 space-y-1.5 rounded-xl border border-border bg-muted/25 p-3 text-xs">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Mail className="size-3.5 shrink-0" />
                                                    <span className="truncate text-foreground">{user.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Phone className="size-3.5 shrink-0" />
                                                    <span className="truncate">{user.phone_number || 'No phone number'}</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                                                <Button variant="outline" size="sm" asChild className="h-8 flex-1 rounded-lg text-xs">
                                                    <Link href={route('users.edit', user.user_id)}>
                                                        <Pencil className="mr-1.5 size-3.5" />
                                                        Edit
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleToggleActive(user)}
                                                    className={cn(
                                                        'h-8 flex-1 rounded-lg text-xs font-semibold',
                                                        user.is_active
                                                            ? 'text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40'
                                                            : 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40',
                                                    )}
                                                >
                                                    <Power className="mr-1.5 size-3.5" />
                                                    {user.is_active ? 'Deactivate' : 'Reactivate'}
                                                </Button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </section>
                    )}
                </div>
            </main>
        </AppLayout>
    );
}
