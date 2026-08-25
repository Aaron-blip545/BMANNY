import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { CircleHelp } from 'lucide-react';

interface Props { section: string }

function EmptyState({ title }: { title: string }) {
    return (
        <Card className="bmanny-workspace min-h-[420px] overflow-hidden">
            <CardContent className="bmanny-empty-state min-h-[420px] p-8">
                <div>
                    <CircleHelp className="mx-auto mb-4 size-5 stroke-[1.8] text-muted-foreground" />
                    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">No data is available yet.</p>
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
            <main className="bmanny-page">
                <div className="bmanny-page-inner">
                    <header className="bmanny-page-header">
                        <p className="bmanny-page-eyebrow">Administration</p>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{section}</h1>
                    </header>
                    <EmptyState title={section} />
                </div>
            </main>
        </AppLayout>
    );
}
