import InputError from '@/components/input-error';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInitials } from '@/hooks/use-initials';
import AppLayout from '@/layouts/app-layout';
import { roleBadgeClasses, roleDescription, roleLabel } from '@/lib/role-dashboard';
import { confirmModal } from '@/lib/sweetalert';
import { cn } from '@/lib/utils';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    BadgeCheck,
    Briefcase,
    Check,
    Crown,
    Eye,
    EyeOff,
    KeyRound,
    Layers,
    LoaderCircle,
    Mail,
    PackageCheck,
    Pencil,
    Phone,
    Power,
    Save,
    ShieldCheck,
    Sparkles,
    User as UserIcon,
    X,
} from 'lucide-react';
import { useState } from 'react';

const ROLE_OPTIONS = [
    { value: 'admin', label: 'Administrator', hint: 'Full system control & reports', icon: Crown },
    { value: 'sales_agent', label: 'Sales Agent', hint: 'Inquiries, chat & quotations', icon: Sparkles },
    { value: 'order_manager', label: 'Order Manager', hint: 'Production & delivery tracking', icon: PackageCheck },
    { value: 'product_controller', label: 'Product Controller', hint: 'Catalog, BOM, MOQ & inventory', icon: Layers },
    { value: 'customer', label: 'Customer', hint: 'Mobile app business client', icon: Briefcase },
];

export default function EditUser({ user }) {
    const getInitials = useInitials();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, put, processing, errors, isDirty } = useForm({
        full_name: user.full_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        role: user.role || 'customer',
        password: '',
        password_confirmation: '',
    });

    function submit(e) {
        e.preventDefault();
        put(route('users.update', user.user_id));
    }

    async function handleToggleActive() {
        const isDeactivating = Boolean(user.is_active);
        const confirmed = await confirmModal({
            title: isDeactivating ? `Deactivate ${user.full_name}?` : `Reactivate ${user.full_name}?`,
            text: isDeactivating
                ? 'This user will immediately lose access to the web portal and mobile app.'
                : 'This user will regain access to their assigned BMANNY workspace.',
            icon: isDeactivating ? 'warning' : 'question',
            confirmButtonText: isDeactivating ? 'Deactivate Account' : 'Reactivate Account',
            cancelButtonText: 'Cancel',
            isDestructive: isDeactivating,
        });

        if (!confirmed) return;
        router.patch(route('users.toggle-active', user.user_id));
    }

    const previewName = data.full_name.trim() || user.full_name || 'User';
    const previewEmail = data.email.trim() || user.email || '—';
    const previewPhone = data.phone_number.trim() || 'Not provided';
    const passwordsMatch = data.password.length > 0 && data.password === data.password_confirmation;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Manage Users', href: '/users' },
                { title: `Edit ${user.full_name}`, href: '#' },
            ]}
        >
            <Head title={`Edit ${user.full_name}`} />

            <main className="bmanny-page pb-12">
                <div className="bmanny-page-inner max-w-6xl space-y-6">
                    {/* Navy Hero Header */}
                    <section className="relative overflow-hidden rounded-2xl border border-[#1d407b]/60 bg-gradient-to-br from-[#06183d] via-[#0a2459] to-[#123b83] px-6 py-6 text-white shadow-[0_12px_32px_rgba(7,29,73,0.2)] sm:px-8">
                        <div
                            aria-hidden="true"
                            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#d4a72c] via-[#f2cf66] to-[#d4a72c]/30"
                        />
                        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-[11px] font-semibold tracking-[0.18em] text-[#f2cf66] uppercase">
                                    BMANNY Administration
                                </p>
                                <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Edit Account — {user.full_name}</h1>
                                <p className="mt-1 text-sm text-blue-100/80">
                                    Update contact details, reassign role permissions, or reset this user&apos;s password.
                                </p>
                            </div>
                            <Link
                                href={route('users.index')}
                                className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:border-[#e5b93f]/60 hover:bg-white/15"
                            >
                                <ArrowLeft className="size-4 text-[#f2cf66]" />
                                <span>Back to Directory</span>
                            </Link>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(310px,0.85fr)] xl:items-start">
                        {/* Left: Edit Form */}
                        <section className="bmanny-form-card overflow-hidden">
                            <div className="flex items-center justify-between border-b border-border px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                                        <Pencil className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-foreground">Account Profile &amp; Permissions</h2>
                                        <p className="text-xs text-muted-foreground">
                                            Leave the password fields empty to keep the user&apos;s current password.
                                        </p>
                                    </div>
                                </div>
                                {isDirty && (
                                    <span className="rounded-full border border-amber-300/60 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300">
                                        Unsaved edits
                                    </span>
                                )}
                            </div>

                            <form onSubmit={submit}>
                                <div className="space-y-6 p-6">
                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label htmlFor="full_name" className="text-xs font-semibold tracking-wide uppercase">
                                                Full Name <span className="text-destructive">*</span>
                                            </Label>
                                            <div className="relative">
                                                <UserIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    id="full_name"
                                                    value={data.full_name}
                                                    onChange={(e) => setData('full_name', e.target.value)}
                                                    maxLength={100}
                                                    required
                                                    className="h-11 rounded-xl pl-10"
                                                />
                                            </div>
                                            <InputError message={errors.full_name} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-xs font-semibold tracking-wide uppercase">
                                                Email Address <span className="text-destructive">*</span>
                                            </Label>
                                            <div className="relative">
                                                <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    maxLength={150}
                                                    required
                                                    className="h-11 rounded-xl pl-10"
                                                />
                                            </div>
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone_number" className="text-xs font-semibold tracking-wide uppercase">
                                                Phone Number <span className="font-normal normal-case text-muted-foreground">(Optional)</span>
                                            </Label>
                                            <div className="relative">
                                                <Phone className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    id="phone_number"
                                                    type="tel"
                                                    value={data.phone_number}
                                                    onChange={(e) => setData('phone_number', e.target.value)}
                                                    placeholder="0917 123 4567"
                                                    maxLength={20}
                                                    className="h-11 rounded-xl pl-10"
                                                />
                                            </div>
                                            <InputError message={errors.phone_number} />
                                        </div>
                                    </div>

                                    {/* Visual Role Selector */}
                                    <div className="space-y-2.5">
                                        <Label className="text-xs font-semibold tracking-wide uppercase">
                                            Assigned Role <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                            {ROLE_OPTIONS.map((option) => {
                                                const Icon = option.icon;
                                                const isSelected = data.role === option.value;
                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => setData('role', option.value)}
                                                        className={cn(
                                                            'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left transition-all',
                                                            isSelected
                                                                ? 'border-[#d4a72c] bg-primary/[0.04] ring-2 ring-[#d4a72c]/25'
                                                                : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30',
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                'flex size-8 shrink-0 items-center justify-center rounded-lg border',
                                                                isSelected
                                                                    ? 'border-[#d4a72c]/50 bg-[#071d49] text-[#f2cf66] dark:bg-[#163b78]'
                                                                    : 'border-border bg-muted/50 text-muted-foreground',
                                                            )}
                                                        >
                                                            <Icon className="size-4" />
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block text-xs font-bold text-foreground">{option.label}</span>
                                                            <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                                                {option.hint}
                                                            </span>
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <InputError message={errors.role} />
                                    </div>

                                    <div className="border-t border-dashed border-border" />

                                    {/* Optional Password Reset */}
                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="password" className="text-xs font-semibold tracking-wide uppercase">
                                                Reset Password <span className="font-normal normal-case text-muted-foreground">(Optional)</span>
                                            </Label>
                                            <div className="relative">
                                                <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    id="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={data.password}
                                                    onChange={(e) => setData('password', e.target.value)}
                                                    placeholder="Leave blank to keep current"
                                                    className="h-11 rounded-xl pr-10 pl-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword((prev) => !prev)}
                                                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
                                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                >
                                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                                </button>
                                            </div>
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="password_confirmation" className="text-xs font-semibold tracking-wide uppercase">
                                                Confirm New Password
                                            </Label>
                                            <div className="relative">
                                                <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    id="password_confirmation"
                                                    type={showConfirm ? 'text' : 'password'}
                                                    value={data.password_confirmation}
                                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                                    placeholder="Repeat new password"
                                                    className="h-11 rounded-xl pr-10 pl-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirm((prev) => !prev)}
                                                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
                                                    aria-label={showConfirm ? 'Hide confirmation' : 'Show confirmation'}
                                                >
                                                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                                </button>
                                            </div>
                                            {data.password_confirmation.length > 0 && (
                                                <p
                                                    className={cn(
                                                        'flex items-center gap-1 text-xs font-medium',
                                                        passwordsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
                                                    )}
                                                >
                                                    {passwordsMatch ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                                                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4">
                                    <Button variant="outline" asChild className="rounded-xl">
                                        <Link href={route('users.index')}>Cancel</Link>
                                    </Button>
                                    <Button type="submit" disabled={processing} className="gap-2 rounded-xl px-5">
                                        {processing ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
                                        <span>{processing ? 'Saving…' : 'Save Changes'}</span>
                                    </Button>
                                </div>
                            </form>
                        </section>

                        {/* Right: Live Pass + Access Control */}
                        <aside className="space-y-4">
                            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_32px_rgba(7,29,73,0.09)]">
                                <div className="relative bg-gradient-to-r from-[#071d49] via-[#0e2d6e] to-[#123b83] px-5 pt-5 pb-10 text-white">
                                    <div
                                        aria-hidden="true"
                                        className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#d4a72c] via-[#f2cf66] to-[#d4a72c]"
                                    />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold tracking-[0.2em] text-[#f2cf66] uppercase">Account Pass</p>
                                            <p className="mt-0.5 text-xs text-blue-100/75">Live Identity Preview</p>
                                        </div>
                                        <span className="rounded-md border border-white/15 bg-white/10 px-2 py-1 font-mono text-[11px] font-semibold">
                                            #{String(user.user_id).padStart(4, '0')}
                                        </span>
                                    </div>
                                </div>

                                <div className="px-5 pb-5">
                                    <div className="-mt-7 mb-3 flex items-end justify-between">
                                        <div className="rounded-full bg-card p-1 shadow-md">
                                            <Avatar className="size-14 border-2 border-[#d4a72c]/70">
                                                <AvatarFallback className="bg-[#071d49] text-base font-bold text-white dark:bg-[#163b78]">
                                                    {getInitials(previewName)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                                                roleBadgeClasses(data.role),
                                            )}
                                        >
                                            <BadgeCheck className="size-3.5" />
                                            {roleLabel(data.role)}
                                        </span>
                                    </div>

                                    <h3 className="truncate text-base font-bold text-foreground">{previewName}</h3>
                                    <p className="truncate text-xs text-muted-foreground">{previewEmail}</p>

                                    <div className="mt-4 space-y-2 rounded-xl border border-border bg-muted/25 p-3.5 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Phone</span>
                                            <span className="font-medium text-foreground">{previewPhone}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Status</span>
                                            <span
                                                className={cn(
                                                    'inline-flex items-center gap-1 font-semibold',
                                                    user.is_active
                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                        : 'text-rose-600 dark:text-rose-400',
                                                )}
                                            >
                                                <ShieldCheck className="size-3.5" />
                                                {user.is_active ? 'Active' : 'Deactivated'}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="mt-3 rounded-xl border border-dashed border-border bg-background/60 p-3 text-[11px] leading-relaxed text-muted-foreground">
                                        <span className="font-semibold text-foreground">Role scope: </span>
                                        {roleDescription(data.role)}
                                    </p>
                                </div>
                            </div>

                            {/* Account Status Quick Action */}
                            <div className="bmanny-form-card p-5">
                                <h3 className="text-sm font-bold text-foreground">Account Access Status</h3>
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                    {user.is_active
                                        ? 'Deactivating revokes active mobile tokens and blocks new logins immediately.'
                                        : 'This account is currently deactivated. Reactivate to restore access.'}
                                </p>
                                <Button
                                    type="button"
                                    variant={user.is_active ? 'destructive' : 'default'}
                                    size="sm"
                                    onClick={handleToggleActive}
                                    className="mt-4 w-full gap-2 rounded-xl"
                                >
                                    <Power className="size-4" />
                                    <span>{user.is_active ? 'Deactivate Account' : 'Reactivate Account'}</span>
                                </Button>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}
