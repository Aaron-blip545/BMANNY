import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
            <div className="w-full max-w-6xl rounded-xl overflow-hidden shadow-lg grid grid-cols-1 md:grid-cols-2 bg-transparent">
                {/* Left panel: illustration / branding */}
                <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 p-10 text-center">
                    <Link href={route('home')} className="flex flex-col items-center gap-4 font-medium">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
                            <AppLogoIcon className="size-16 fill-current text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-indigo-300">BMANNY PARTNERS INC.</h2>
                    </Link>

                    <div className="mt-8 max-w-sm text-left text-sm text-slate-300">
                        <p className="mb-4">Welcome back — manage orders, inventory and more from the admin panel.</p>
                        <div className="mt-6">
                            {/* Placeholder illustration box */}
                            <div className="h-56 w-full rounded-lg bg-gradient-to-br from-indigo-700 to-slate-700 shadow-inner" />
                        </div>
                    </div>
                </div>

                {/* Right panel: auth card */}
                <div className="flex items-center justify-center bg-white p-8 dark:bg-background">
                    <div className="w-full max-w-md">
                        <div className="mb-6 text-center">
                            <h1 className="text-2xl font-semibold text-slate-900 dark:text-foreground">{title}</h1>
                            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                        </div>

                        <div className="rounded-lg bg-white/90 dark:bg-card p-6 shadow-md">{children}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
