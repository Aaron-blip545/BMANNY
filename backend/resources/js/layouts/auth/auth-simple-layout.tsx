import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import { Moon, Sun } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    const { updateAppearance } = useAppearance();

    const toggleAppearance = () => {
        updateAppearance(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
    };

    return (
        <main className="flex min-h-screen items-center bg-[#f7fbff] px-4 py-8 text-slate-950 sm:px-6 lg:px-8 dark:bg-[#020617] dark:text-slate-100">
            <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-2xl border border-[#c8dced] bg-white shadow-[0_20px_45px_rgba(29,78,122,0.12)] lg:grid-cols-2 dark:border-slate-700/70 dark:bg-[#05070b] dark:shadow-2xl dark:shadow-black/30">
                <section className="relative hidden min-h-[680px] overflow-hidden lg:block">
                    <img
                        src="/images/login-partnership.png"
                        alt="Business partners shaking hands"
                        className="absolute inset-0 h-full w-full object-cover opacity-55 dark:opacity-100"
                    />
                    <div className="absolute inset-0 bg-[#c7dcf0]/68 dark:bg-[#06132a]/80" />

                    <div className="relative flex h-full flex-col p-12 xl:p-14">
                        <div className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <img
                                className="h-44 w-44 object-contain drop-shadow-[0_8px_16px_rgba(15,35,55,0.28)] xl:h-52 xl:w-52 dark:drop-shadow-2xl"
                                src="/images/bmanny-logo-transparent.png"
                                alt="BMANNY Partners Inc."
                            />
                        </div>

                        <div className="mt-auto max-w-sm">
                            <p className="mb-5 h-px w-10 bg-[#1d70b8] dark:w-14 dark:bg-slate-300" />
                            <h2 className="text-4xl leading-tight font-semibold tracking-tight text-[#09233d] xl:text-5xl dark:text-white">
                                BMANNY PARTNERS INC.
                            </h2>
                            <p className="mt-6 text-base leading-7 text-[#284764] xl:text-lg dark:text-slate-200">
                                Your Partner in Building Your Dream Business Empire.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="relative flex min-h-[calc(100vh-4rem)] items-center bg-white px-6 py-12 sm:px-10 lg:min-h-[680px] lg:px-14 xl:px-16 dark:bg-[#080a0e]">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleAppearance}
                        className="absolute top-5 right-5 h-10 w-10 rounded-md border border-[#d8e3ee] text-[#385a7d] hover:bg-[#f1f6fb] hover:text-[#0a2540] focus-visible:ring-[#476a8a] focus-visible:ring-offset-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-slate-300 dark:focus-visible:ring-offset-[#080a0e]"
                        aria-label="Toggle light and dark mode"
                    >
                        <Sun className="size-4 dark:hidden" aria-hidden="true" />
                        <Moon className="hidden size-4 dark:block" aria-hidden="true" />
                    </Button>
                    <div className="mx-auto w-full max-w-md">
                        <div className="mb-9">
                            <div className="mb-8 lg:hidden">
                                <img className="h-16 w-16 object-contain" src="/images/bmanny-logo-transparent.png" alt="BMANNY Partners Inc." />
                                <p className="mt-4 text-sm font-medium tracking-[0.16em] text-[#0a2540] dark:text-slate-300">BMANNY PARTNERS INC.</p>
                                <p className="mt-2 text-sm leading-6 text-[#52677d] dark:text-slate-400">
                                    Your Partner in Building Your Dream Business Empire.
                                </p>
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight text-[#0b1f35] sm:text-4xl dark:text-white">{title}</h1>
                            <p className="mt-3 text-base text-[#52677d] dark:text-slate-400">{description}</p>
                        </div>

                        {children}
                    </div>
                </section>
            </div>
        </main>
    );
}
