import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <main className="min-h-full bg-slate-50/70 p-4 sm:p-6 lg:p-8 dark:bg-background">
                <div className="mx-auto max-w-7xl">
                    <Card className="border-slate-200/80 shadow-sm dark:border-border">
                        <CardContent className="p-8 text-center sm:p-10">
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-foreground">Dashboard</h1>
                            <p className="mt-2 text-sm text-muted-foreground">No data available yet.</p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </AppLayout>
    );
}
