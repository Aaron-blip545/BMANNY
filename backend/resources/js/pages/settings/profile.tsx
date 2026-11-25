import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInitials } from '@/hooks/use-initials';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { roleBadgeClasses, roleDescription, roleLabel } from '@/lib/role-dashboard';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    BadgeCheck,
    Calendar,
    Check,
    CheckCircle2,
    Fingerprint,
    Loader2,
    Mail,
    Phone,
    RotateCcw,
    Save,
    ShieldCheck,
    Sparkles,
    User as UserIcon,
    X,
} from 'lucide-react';
import { type FormEventHandler } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/settings/profile' },
    { title: 'Identity & Profile', href: '/settings/profile' },
];

export default function Profile({ status }: { status?: string }) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
    const getInitials = useInitials();

    const { data, setData, patch, errors, processing, recentlySuccessful, isDirty, reset } = useForm({
        full_name: user?.full_name ?? '',
        email: user?.email ?? '',
        phone_number: user?.phone_number ?? '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        patch(route('profile.update'), {
            preserveScroll: true,
        });
    };

    const previewName = data.full_name.trim() || user?.full_name || 'Staff Member';
    const previewEmail = data.email.trim() || user?.email || '—';
    const previewPhone = data.phone_number.trim() || 'Not provided';
    const previewInitials = getInitials(previewName);
    const staffIdLabel = `BM-${String(user?.user_id ?? user?.id ?? 1).padStart(4, '0')}`;

    const isNameAccepted = data.full_name.trim().length >= 2 && data.full_name.trim().length <= 100;
    const isEmailAccepted =
        data.email.trim().length > 0 &&
        data.email.trim().length <= 150 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim());
    const phoneDigits = data.phone_number.trim().replace(/\D/g, '');
    const isPhoneAccepted =
        data.phone_number.trim() === '' ||
        (/^\+?[0-9][0-9\s-]{8,18}[0-9]$/.test(data.phone_number.trim()) &&
            phoneDigits.length >= 10 &&
            phoneDigits.length <= 15);
    const isProfileValid = isNameAccepted && isEmailAccepted && isPhoneAccepted;

    const memberSince = user?.created_at
        ? new Date(user.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
          })
        : '—';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(310px,0.85fr)] xl:items-start">
                    {/* Left: Editorial Profile Form Studio */}
                    <section className="bmanny-form-card overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-muted text-foreground">
                                    <UserIcon className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold tracking-tight text-foreground">Identity &amp; Contact Details</h2>
                                    <p className="text-xs text-muted-foreground">
                                        Updates reflect immediately on your live staff credential pass and portal sidebar.
                                    </p>
                                </div>
                            </div>

                            {isDirty && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground">
                                    <Sparkles className="size-3" />
                                    Unsaved edits
                                </span>
                            )}
                        </div>

                        <form onSubmit={submit}>
                            <div className="space-y-6 p-6">
                                {/* Full Name */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="full_name" className="text-xs font-semibold tracking-wide text-foreground uppercase">
                                            Full Name <span className="text-muted-foreground">*</span>
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                                                {isNameAccepted ? <Check className="size-3" /> : <X className="size-3" />}
                                                {isNameAccepted ? 'Accepted' : 'Min 2 chars'}
                                            </span>
                                            <span className="font-mono text-[11px] text-muted-foreground">
                                                {data.full_name.length}/100
                                            </span>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <UserIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="full_name"
                                            value={data.full_name}
                                            onChange={(e) => setData('full_name', e.target.value)}
                                            required
                                            autoComplete="name"
                                            maxLength={100}
                                            placeholder="Enter your full name"
                                            className="h-11 rounded-xl pl-10 text-sm"
                                        />
                                    </div>
                                    <InputError message={errors.full_name} />
                                </div>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    {/* Email */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="email" className="text-xs font-semibold tracking-wide text-foreground uppercase">
                                                Email Address <span className="text-muted-foreground">*</span>
                                            </Label>
                                            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                                                {isEmailAccepted ? <Check className="size-3" /> : <X className="size-3" />}
                                                {isEmailAccepted ? 'Accepted' : 'Invalid'}
                                            </span>
                                        </div>
                                        <div className="relative">
                                            <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                required
                                                autoComplete="email"
                                                maxLength={150}
                                                placeholder="name@bmanny.com"
                                                className="h-11 rounded-xl pl-10 text-sm"
                                            />
                                        </div>
                                        <InputError message={errors.email} />
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="phone_number" className="text-xs font-semibold tracking-wide text-foreground uppercase">
                                                Phone Number <span className="font-normal normal-case text-muted-foreground">(Optional)</span>
                                            </Label>
                                            {data.phone_number.trim().length > 0 && (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                                                    {isPhoneAccepted ? <Check className="size-3" /> : <X className="size-3" />}
                                                    {isPhoneAccepted ? 'Accepted' : '10–15 digits'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Phone className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="phone_number"
                                                type="tel"
                                                value={data.phone_number}
                                                onChange={(e) => setData('phone_number', e.target.value.replace(/[^\d+\s-]/g, ''))}
                                                autoComplete="tel"
                                                maxLength={20}
                                                placeholder="e.g. 0917 123 4567"
                                                className="h-11 rounded-xl pl-10 text-sm"
                                            />
                                        </div>
                                        <InputError message={errors.phone_number} />
                                    </div>
                                </div>

                                {/* Role Scope Note */}
                                <div className="rounded-xl border border-border/80 bg-muted/35 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground">
                                            <ShieldCheck className="size-4" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-foreground">
                                                Workspace Access Scope — {roleLabel(user?.role)}
                                            </p>
                                            <p className="text-xs leading-relaxed text-muted-foreground">
                                                {roleDescription(user?.role)} Role permissions are controlled centrally by an Administrator.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Dock */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-4">
                                <Transition
                                    show={recentlySuccessful || status === 'profile-updated'}
                                    enter="transition ease-out duration-200"
                                    enterFrom="opacity-0 translate-y-1"
                                    leave="transition ease-in duration-150"
                                    leaveTo="opacity-0"
                                >
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
                                        <CheckCircle2 className="size-3.5" />
                                        Profile saved
                                    </span>
                                </Transition>

                                <div className="ml-auto flex items-center gap-2.5">
                                    {isDirty && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => reset()}
                                            disabled={processing}
                                            className="rounded-xl"
                                        >
                                            <RotateCcw className="mr-1.5 size-3.5" />
                                            Discard
                                        </Button>
                                    )}
                                    <Button type="submit" disabled={processing || !isDirty || !isProfileValid} className="gap-2 rounded-xl px-5">
                                        {processing ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                                        <span>{processing ? 'Saving…' : 'Save Profile'}</span>
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </section>

                    {/* Right: Live BMANNY Staff Credential Pass */}
                    <aside className="space-y-4">
                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_32px_rgba(7,29,73,0.09)]">
                            {/* Pass Header Strip */}
                            <div className="relative overflow-hidden bg-gradient-to-r from-[#071d49] via-[#0e2d6e] to-[#123b83] px-5 pt-5 pb-10 text-white">
                                <div
                                    aria-hidden="true"
                                    className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#d4a72c] via-[#f2cf66] to-[#d4a72c]"
                                />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.2em] text-white/80 uppercase">BMANNY Staff Pass</p>
                                        <p className="mt-0.5 text-xs text-white/70">Live Identity Preview</p>
                                    </div>
                                    <span className="rounded-md border border-white/15 bg-white/10 px-2 py-1 font-mono text-[11px] font-semibold tracking-wider text-white">
                                        {staffIdLabel}
                                    </span>
                                </div>
                            </div>

                            {/* Pass Body */}
                            <div className="px-5 pb-5">
                                <div className="-mt-7 mb-3 flex items-end justify-between">
                                    <div className="rounded-full bg-card p-1 shadow-md">
                                        <Avatar className="size-14 border-2 border-[#d4a72c]/70">
                                            <AvatarImage src={user?.avatar} alt={previewName} />
                                            <AvatarFallback className="bg-[#071d49] text-base font-bold text-white dark:bg-[#163b78]">
                                                {previewInitials}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                                            roleBadgeClasses(user?.role),
                                        )}
                                    >
                                        <BadgeCheck className="size-3.5" />
                                        {roleLabel(user?.role)}
                                    </span>
                                </div>

                                <div className="space-y-0.5">
                                    <h3 className="truncate text-base font-bold text-foreground">{previewName}</h3>
                                    <p className="truncate text-xs text-muted-foreground">{previewEmail}</p>
                                </div>

                                <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-muted/25 text-xs">
                                    <div className="flex items-center justify-between px-3.5 py-2.5">
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="size-3.5" />
                                            Contact
                                        </span>
                                        <span className="truncate font-medium text-foreground">{previewPhone}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-3.5 py-2.5">
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="size-3.5" />
                                            Joined
                                        </span>
                                        <span className="font-medium text-foreground">{memberSince}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-3.5 py-2.5">
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <Fingerprint className="size-3.5" />
                                            Status
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                                            <span className="size-1.5 rounded-full bg-emerald-500" />
                                            {user?.is_active === false ? 'Inactive' : 'Active'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
