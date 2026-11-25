import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { cn } from '@/lib/utils';
import { Head, useForm } from '@inertiajs/react';
import { Check, Eye, EyeOff, LoaderCircle, X } from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';

interface ResetPasswordProps {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const passwordRules = useMemo(() => {
        const value = data.password;
        return [
            { label: 'At least 8 characters', passed: value.length >= 8 },
            { label: 'Uppercase & lowercase letters (A–Z, a–z)', passed: /[a-z]/.test(value) && /[A-Z]/.test(value) },
            { label: 'Includes a number or symbol', passed: /[\d\W_]/.test(value) },
        ];
    }, [data.password]);

    const isPasswordAccepted = passwordRules.every((r) => r.passed);
    const isConfirmAccepted = data.password_confirmation.length > 0 && data.password === data.password_confirmation;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!isPasswordAccepted || !isConfirmAccepted) return;
        post(route('password.store'));
    };

    return (
        <AuthLayout title="Reset password" description="Please enter your new password below">
            <Head title="Reset password" />

            <form onSubmit={submit} className="flex flex-col gap-5">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" autoComplete="email" value={data.email} readOnly />
                    <InputError message={errors.email} />
                </div>

                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">New password</Label>
                        {data.password.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                                {isPasswordAccepted ? <Check className="size-3" /> : <X className="size-3" />}
                                {isPasswordAccepted ? 'Accepted' : 'Needs criteria'}
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            autoFocus
                            required
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Create new password"
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                    </div>
                    <div className="space-y-1.5 rounded-xl border border-border bg-muted/25 p-3">
                        {passwordRules.map((rule) => (
                            <div
                                key={rule.label}
                                className={cn(
                                    'flex items-center gap-2 text-xs',
                                    rule.passed ? 'font-medium text-foreground' : 'text-muted-foreground',
                                )}
                            >
                                <span
                                    className={cn(
                                        'flex size-4 shrink-0 items-center justify-center rounded-full border',
                                        rule.passed
                                            ? 'border-foreground bg-foreground text-background'
                                            : 'border-border bg-background text-muted-foreground',
                                    )}
                                >
                                    {rule.passed ? <Check className="size-2.5" /> : <X className="size-2.5 opacity-60" />}
                                </span>
                                <span>{rule.label}</span>
                            </div>
                        ))}
                    </div>
                    <InputError message={errors.password} />
                </div>

                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password_confirmation">Confirm new password</Label>
                        {data.password_confirmation.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                                {isConfirmAccepted ? <Check className="size-3" /> : <X className="size-3" />}
                                {isConfirmAccepted ? 'Matched' : 'Mismatch'}
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <Input
                            id="password_confirmation"
                            type={showConfirm ? 'text' : 'password'}
                            autoComplete="new-password"
                            required
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder="Confirm password"
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
                            aria-label={showConfirm ? 'Hide confirmation' : 'Show confirmation'}
                        >
                            {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                    </div>
                    <InputError message={errors.password_confirmation} />
                </div>

                <Button
                    type="submit"
                    className="mt-2 w-full"
                    disabled={processing || !isPasswordAccepted || !isConfirmAccepted}
                >
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Reset password
                </Button>
            </form>
        </AuthLayout>
    );
}