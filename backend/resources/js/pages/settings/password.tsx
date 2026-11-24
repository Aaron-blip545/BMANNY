import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm } from '@inertiajs/react';
import { Check, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, Shield, ShieldCheck, ShieldHalf, X } from 'lucide-react';
import { type FormEventHandler, useMemo, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/settings/profile' },
    { title: 'Security Vault', href: '/settings/password' },
];

export default function Password({ status }: { status?: string }) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const passwordChecks = useMemo(() => {
        const value = data.password;
        return [
            { label: 'At least 8 characters long', passed: value.length >= 8 },
            { label: 'Mix of uppercase & lowercase letters', passed: /[a-z]/.test(value) && /[A-Z]/.test(value) },
            { label: 'Includes a number or special symbol', passed: /[\d\W_]/.test(value) },
            {
                label: 'Confirmation matches new password',
                passed: value.length > 0 && value === data.password_confirmation,
            },
        ];
    }, [data.password, data.password_confirmation]);

    const passedCount = passwordChecks.filter((check) => check.passed).length;
    const strengthMeta = useMemo(() => {
        if (data.password.length === 0) {
            return { label: 'Awaiting input', tone: 'text-muted-foreground', bar: 'bg-border', badge: 'bg-muted text-muted-foreground' };
        }
        if (passedCount === 4) {
            return {
                label: 'Vault Ready',
                tone: 'text-foreground',
                bar: 'bg-emerald-500',
                badge: 'border border-border bg-muted text-foreground',
            };
        }
        if (passedCount >= 2) {
            return {
                label: 'Moderate',
                tone: 'text-foreground',
                bar: 'bg-amber-500',
                badge: 'border border-border bg-muted text-foreground',
            };
        }
        return {
            label: 'Weak',
            tone: 'text-foreground',
            bar: 'bg-rose-500',
            badge: 'border border-border bg-muted text-foreground',
        };
    }, [data.password.length, passedCount]);

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (err) => {
                if (err.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (err.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Password settings" />

            <SettingsLayout>
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(310px,0.85fr)] xl:items-start">
                    {/* Left: Credential Vault Form */}
                    <section className="bmanny-form-card overflow-hidden">
                        <div className="border-b border-border px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-muted text-foreground">
                                    <KeyRound className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold tracking-tight text-foreground">Update Sign-In Password</h2>
                                    <p className="text-xs text-muted-foreground">
                                        Verify your current password and set a strong replacement credential.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={updatePassword}>
                            <div className="space-y-6 p-6">
                                {/* Step 01: Current Password */}
                                <div className="space-y-2">
                                    <Label htmlFor="current_password" className="flex items-center gap-2 text-xs font-semibold tracking-wide text-foreground uppercase">
                                        <span className="flex size-5 items-center justify-center rounded-md bg-muted font-mono text-[10px] font-bold text-foreground">
                                            01
                                        </span>
                                        Current Password <span className="text-muted-foreground">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="current_password"
                                            ref={currentPasswordInput}
                                            value={data.current_password}
                                            onChange={(e) => setData('current_password', e.target.value)}
                                            type={showCurrent ? 'text' : 'password'}
                                            className="h-11 rounded-xl pr-11 pl-10 text-sm"
                                            autoComplete="current-password"
                                            placeholder="Enter your current password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrent((prev) => !prev)}
                                            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                            aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                                        >
                                            {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    <InputError message={errors.current_password} />
                                </div>

                                <div className="border-t border-dashed border-border" />

                                {/* Step 02 & 03 */}
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="flex items-center gap-2 text-xs font-semibold tracking-wide text-foreground uppercase">
                                            <span className="flex size-5 items-center justify-center rounded-md bg-muted font-mono text-[10px] font-bold text-foreground">
                                                02
                                            </span>
                                            New Password <span className="text-muted-foreground">*</span>
                                        </Label>
                                        <div className="relative">
                                            <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                ref={passwordInput}
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                type={showNew ? 'text' : 'password'}
                                                className="h-11 rounded-xl pr-11 pl-10 text-sm"
                                                autoComplete="new-password"
                                                placeholder="Create new password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNew((prev) => !prev)}
                                                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                aria-label={showNew ? 'Hide new password' : 'Show new password'}
                                            >
                                                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                            </button>
                                        </div>
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password_confirmation" className="flex items-center gap-2 text-xs font-semibold tracking-wide text-foreground uppercase">
                                            <span className="flex size-5 items-center justify-center rounded-md bg-muted font-mono text-[10px] font-bold text-foreground">
                                                03
                                            </span>
                                            Confirm Password <span className="text-muted-foreground">*</span>
                                        </Label>
                                        <div className="relative">
                                            <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="password_confirmation"
                                                value={data.password_confirmation}
                                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                                type={showConfirm ? 'text' : 'password'}
                                                className="h-11 rounded-xl pr-11 pl-10 text-sm"
                                                autoComplete="new-password"
                                                placeholder="Repeat new password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm((prev) => !prev)}
                                                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'}
                                            >
                                                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                            </button>
                                        </div>
                                        <InputError message={errors.password_confirmation} />
                                    </div>
                                </div>
                            </div>

                            {/* Action Dock */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-4">
                                <Transition
                                    show={recentlySuccessful || status === 'password-updated'}
                                    enter="transition ease-out duration-200"
                                    enterFrom="opacity-0 translate-y-1"
                                    leave="transition ease-in duration-150"
                                    leaveTo="opacity-0"
                                >
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
                                        <CheckCircle2 className="size-3.5" />
                                        Password updated
                                    </span>
                                </Transition>

                                <Button type="submit" disabled={processing} className="ml-auto gap-2 rounded-xl px-5">
                                    {processing ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                                    <span>{processing ? 'Updating…' : 'Update Password'}</span>
                                </Button>
                            </div>
                        </form>
                    </section>

                    {/* Right: Live Security Posture Panel */}
                    <aside className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_32px_rgba(7,29,73,0.08)]">
                        <div className="border-b border-border bg-muted/30 px-5 py-4">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#071d49] text-white dark:bg-[#163b78]">
                                        {passedCount === 4 ? (
                                            <ShieldCheck className="size-4" />
                                        ) : passedCount >= 2 ? (
                                            <ShieldHalf className="size-4" />
                                        ) : (
                                            <Shield className="size-4" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground">Security Readiness</h3>
                                        <p className="text-[11px] text-muted-foreground">Live credential check</p>
                                    </div>
                                </div>
                                <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', strengthMeta.badge)}>
                                    {strengthMeta.label}
                                </span>
                            </div>

                            {/* Segmented Readiness Bar */}
                            <div className="mt-4 grid grid-cols-4 gap-1.5">
                                {[1, 2, 3, 4].map((step) => (
                                    <div
                                        key={step}
                                        className={cn(
                                            'h-2 rounded-full transition-all duration-300',
                                            passedCount >= step ? strengthMeta.bar : 'bg-border',
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 p-5">
                            <ul className="space-y-2.5">
                                {passwordChecks.map((check) => (
                                    <li
                                        key={check.label}
                                        className={cn(
                                            'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs transition-colors',
                                            check.passed
                                                ? 'border-border bg-muted/60 font-medium text-foreground'
                                                : 'border-border bg-muted/20 text-muted-foreground',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'flex size-5 shrink-0 items-center justify-center rounded-full',
                                                check.passed
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-border/70 text-muted-foreground',
                                            )}
                                        >
                                            {check.passed ? <Check className="size-3" /> : <X className="size-3 opacity-60" />}
                                        </span>
                                        <span>{check.label}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="rounded-xl border border-dashed border-border bg-background/60 p-3.5 text-[11px] leading-relaxed text-muted-foreground">
                                <span className="font-semibold text-foreground">Session tip: </span>
                                Use a password unique to BMANNY and sign out from shared office workstations via the sidebar account menu.
                            </div>
                        </div>
                    </aside>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
