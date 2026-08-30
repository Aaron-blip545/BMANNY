import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { useEcho } from '@laravel/echo-react';
import { router, usePage } from '@inertiajs/react';
import { useRef } from 'react';

interface AppLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

function RealtimePageSync() {
    const userId = (usePage().props as { auth?: { user?: { user_id?: number } } }).auth?.user?.user_id;
    const reloadTimer = useRef<number | null>(null);

    useEcho<{ type: string }>(
        userId ? `user.${userId}` : 'user.0',
        '.notification.created',
        (notification) => {
            // Business records must always be refreshed from the server;
            // unlike chat text, their status and totals should never be
            // guessed optimistically in the browser.
            if (!['inquiry', 'quotation', 'order', 'product', 'moderation'].includes(notification.type)) return;

            // Coalesce a burst of notifications into one authoritative
            // refresh instead of issuing a request for every event.
            if (reloadTimer.current) return;
            reloadTimer.current = window.setTimeout(() => {
                router.reload({ preserveScroll: true, preserveState: true });
                reloadTimer.current = null;
            }, 500);
        },
        [userId],
    );

    return null;
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        <RealtimePageSync />
        {children}
    </AppLayoutTemplate>
);
