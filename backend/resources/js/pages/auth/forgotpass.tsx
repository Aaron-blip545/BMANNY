import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm } from '@inertiajs/react';
import { Check, LoaderCircle, X } from 'lucide-react';
import { FormEventHandler } from 'react';

interface ForgotPasswordProps {
    status?: string;
}

export default function ForgotPassword({ status }: ForgotPasswordProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const isEmailAccepted =
        data.email.trim().length > 0 &&
        data.email.trim().length <= 150 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim());

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!isEmailAccepted) return;
        post(route('password.email'));
    };

    return (
        <AuthLayout title="Forgot password" description="Enter your email to receive a password reset link">
            <Head title="Forgot password" />

            {status && (
                <div className="mb-4 rounded-xl border border-border bg-muted/40 px-4 py-3 text-center text-sm font-medium text-foreground">
                    {status}
                </div>
            )}

            <div className="space-y-6">
                <form className="flex flex-col gap-6" onSubmit={submit}>
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="email">Email address</Label>
                            {data.email.length > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                                    {isEmailAccepted ? <Check className="size-3" /> : <X className="size-3" />}
                                    {isEmailAccepted ? 'Accepted' : 'Invalid email'}
                                </span>
                            )}
                        </div>
                        <Input
                            id="email"
                            type="email"
                            required
                            maxLength={150}
                            autoComplete="off"
                            autoFocus
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="email@example.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <Button className="w-full" disabled={processing || !isEmailAccepted}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Email password reset link
                    </Button>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                    Or, return to <TextLink href={route('login')}>log in</TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}