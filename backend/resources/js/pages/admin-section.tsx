import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

interface Props { section: string }

function EmptyState({ title }: { title: string }) {
    return (
        <Card className="border-slate-200/80 shadow-sm dark:border-border min-h-[420px]">
            <CardContent className="flex min-h-[420px] items-center justify-center p-8 text-center">
                <div>
                    <h2 className="text-lg font-semibold text-slate-950 dark:text-foreground">{title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">No data available yet.</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function AdminSection({ section }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [{ title: section, href: `/${section.toLowerCase()}` }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={section} />
            <main className="min-h-full bg-slate-50/70 p-5 text-slate-950 sm:p-7 dark:bg-background">
                <div className="mx-auto max-w-7xl">
                    <h1 className="mb-6 text-2xl font-semibold text-slate-950 dark:text-foreground">{section}</h1>
                    <EmptyState title={section} />
                </div>
            </main>
        </AppLayout>
    );
}
