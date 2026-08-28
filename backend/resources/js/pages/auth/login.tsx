import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
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
                        <Label htmlFor="email" className="text-sm font-medium text-[#172033] dark:text-[#F8FAFC]">
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
                            className="h-12 border-[#DDE3EA] bg-white px-4 text-base text-[#172033] placeholder:text-[#667085] focus-visible:border-[#174EA6] focus-visible:ring-[#174EA6] focus-visible:ring-offset-white dark:border-[#263241] dark:bg-[#111A24] dark:text-[#F8FAFC] dark:placeholder:text-[#9CA9B8] dark:focus-visible:border-[#F2B735] dark:focus-visible:ring-[#F2B735] dark:focus-visible:ring-offset-[#111A24]"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2.5">
                        <div className="flex items-center justify-between gap-4">
                            <Label htmlFor="password" className="text-sm font-medium text-[#172033] dark:text-[#F8FAFC]">
                                Password
                            </Label>
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                type={isPasswordVisible ? 'text' : 'password'}
                                name="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                                autoComplete="current-password"
                                placeholder="Password"
                                className="h-12 border-[#DDE3EA] bg-white px-4 pr-12 text-base text-[#172033] placeholder:text-[#667085] focus-visible:border-[#174EA6] focus-visible:ring-[#174EA6] focus-visible:ring-offset-white dark:border-[#263241] dark:bg-[#111A24] dark:text-[#F8FAFC] dark:placeholder:text-[#9CA9B8] dark:focus-visible:border-[#F2B735] dark:focus-visible:ring-[#F2B735] dark:focus-visible:ring-offset-[#111A24]"
                            />
                            <button
                                type="button"
                                onClick={() => setIsPasswordVisible((visible) => !visible)}
                                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                                aria-pressed={isPasswordVisible}
                                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#667085] transition-colors hover:text-[#0F2742] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017] focus-visible:ring-inset dark:text-[#9CA9B8] dark:hover:text-[#F8FAFC] dark:focus-visible:ring-[#F2B735]"
                            >
                                {isPasswordVisible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                            </button>
                        </div>
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onCheckedChange={(checked) => setData('remember', Boolean(checked))}
                            className="border-[#DDE3EA] bg-white data-[state=checked]:border-[#0F2742] data-[state=checked]:bg-[#0F2742] data-[state=checked]:text-white dark:border-[#263241] dark:bg-[#111A24] dark:data-[state=checked]:border-[#F2B735] dark:data-[state=checked]:bg-[#F2B735] dark:data-[state=checked]:text-[#0F2742]"
                        />
                        <Label htmlFor="remember" className="text-sm font-normal text-[#667085] dark:text-[#9CA9B8]">
                            Remember me
                        </Label>
                    </div>

                    <Button
                        type="submit"
                        className="mt-2 h-12 w-full rounded-md bg-[#0F2742] text-base font-semibold text-white hover:bg-[#174EA6] focus-visible:ring-[#D4A017] focus-visible:ring-offset-white dark:bg-[#174EA6] dark:text-white dark:hover:bg-[#0F2742] dark:focus-visible:ring-[#F2B735] dark:focus-visible:ring-offset-[#111A24]"
                        disabled={processing}
                    >
                        {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Log in
                    </Button>
                </div>
            </form>

            {status && <div className="mt-6 text-center text-sm font-medium text-[#174EA6] dark:text-[#F2B735]">{status}</div>}
        </AuthLayout>
    );
}
