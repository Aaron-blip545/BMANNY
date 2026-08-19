import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEvent } from 'react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout title="Log in to your account" description="Enter your email and password below to log in">
            <Head title="Log in" />

            <form onSubmit={submit} className="flex flex-col gap-7">
                <div className="grid gap-6">
                    <div className="grid gap-2.5">
                        <Label htmlFor="email" className="text-sm font-medium text-[#1e3a56] dark:text-slate-100">
                            Email address
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            autoFocus
                            autoComplete="email"
                            placeholder="email@example.com"
                            className="h-12 border-[#b8cadc] bg-white px-4 text-base text-[#0b1f35] placeholder:text-[#71859b] focus-visible:border-[#476a8a] focus-visible:ring-[#476a8a] focus-visible:ring-offset-white dark:border-slate-700 dark:bg-[#0b0e14] dark:text-white dark:placeholder:text-slate-500 dark:focus-visible:border-slate-400 dark:focus-visible:ring-slate-400 dark:focus-visible:ring-offset-[#080a0e]"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2.5">
                        <div className="flex items-center justify-between gap-4">
                            <Label htmlFor="password" className="text-sm font-medium text-[#1e3a56] dark:text-slate-100">
                                Password
                            </Label>
                            {canResetPassword && (
                                <TextLink
                                    href={route('password.request')}
                                    className="ml-auto text-sm text-[#385a7d] underline-offset-4 hover:text-[#0a2540] dark:text-slate-300 dark:hover:text-white"
                                    tabIndex={5}
                                >
                                    Forgot password?
                                </TextLink>
                            )}
                        </div>
                        <Input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            required
                            autoComplete="current-password"
                            placeholder="Password"
                            className="h-12 border-[#b8cadc] bg-white px-4 text-base text-[#0b1f35] placeholder:text-[#71859b] focus-visible:border-[#476a8a] focus-visible:ring-[#476a8a] focus-visible:ring-offset-white dark:border-slate-700 dark:bg-[#0b0e14] dark:text-white dark:placeholder:text-slate-500 dark:focus-visible:border-slate-400 dark:focus-visible:ring-slate-400 dark:focus-visible:ring-offset-[#080a0e]"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onCheckedChange={(checked) => setData('remember', Boolean(checked))}
                            className="border-[#8fa6bc] bg-white data-[state=checked]:border-slate-900 data-[state=checked]:bg-slate-900 data-[state=checked]:text-white dark:border-slate-600 dark:bg-[#0b0e14] dark:data-[state=checked]:border-slate-200 dark:data-[state=checked]:bg-slate-100 dark:data-[state=checked]:text-slate-950"
                        />
                        <Label htmlFor="remember" className="text-sm font-normal text-[#52677d] dark:text-slate-300">
                            Remember me
                        </Label>
                    </div>

                    <Button
                        type="submit"
                        className="mt-2 h-12 w-full rounded-md bg-slate-950 text-base font-semibold text-white hover:bg-slate-800 focus-visible:ring-slate-500 focus-visible:ring-offset-white dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white dark:focus-visible:ring-slate-300 dark:focus-visible:ring-offset-[#080a0e]"
                        disabled={processing}
                    >
                        {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Log in
                    </Button>
                </div>
            </form>

            {status && <div className="mt-6 text-center text-sm font-medium text-emerald-700 dark:text-emerald-400">{status}</div>}
        </AuthLayout>
    );
}
