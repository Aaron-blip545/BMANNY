import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

interface Module {
    title: string;
    href: string;
    description: string;
    emptyMessage: string;
}

interface Props {
    module: Module;
}

export default function ProductControllerModule({ module }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Product Controller', href: '/product-controller/dashboard' },
        { title: module.title, href: module.href },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={module.title} />

            <main className="min-h-full bg-slate-50/70 p-4 sm:p-6 lg:p-8 dark:bg-background">
                <div className="mx-auto max-w-7xl">
                    <section className="border-b border-border pb-6">
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-foreground">{module.title}</h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{module.description}</p>
                    </section>

                    <Card className="mt-6 border-border bg-card shadow-none">
                        <CardHeader className="border-b border-border p-5">
                            <CardTitle className="text-base">{module.title}</CardTitle>
                            <CardDescription>Data will appear here when the approved product configuration schema is available.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 text-sm text-muted-foreground">{module.emptyMessage}</CardContent>
                    </Card>
                </div>
            </main>
        </AppLayout>
    );
}
