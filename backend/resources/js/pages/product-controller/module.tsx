import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Boxes } from 'lucide-react';

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

            <main className="bmanny-page">
                <div className="bmanny-page-inner">
                    <section className="bmanny-page-header">
                        <p className="bmanny-page-eyebrow">Product Controller</p>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{module.title}</h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{module.description}</p>
                    </section>

                    <Card className="bmanny-workspace overflow-hidden">
                        <CardHeader className="border-b border-border p-5">
                            <CardTitle className="text-base">{module.title}</CardTitle>
                            <CardDescription>Data will appear here when the approved product configuration schema is available.</CardDescription>
                        </CardHeader>
                        <CardContent className="bmanny-empty-state min-h-72">
                            <Boxes className="mb-4 size-5 stroke-[1.8] text-muted-foreground" />
                            <p className="max-w-md text-sm leading-6 text-muted-foreground">{module.emptyMessage}</p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </AppLayout>
    );
}
