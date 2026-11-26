import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { useEcho } from '@laravel/echo-react';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

interface AppLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

const AUTO_SYNC_EXCLUDED_PATHS = ['/create', '/edit', '/settings', '/chat', '/user-guide', '/reports'];

function RealtimePageSync() {
    const page = usePage();
    const userId = (page.props as { auth?: { user?: { user_id?: number } } }).auth?.user?.user_id;
    const currentUrl = page.url || '';
    const reloadTimer = useRef<number | null>(null);
    const inFlight = useRef(false);

    const triggerSafeReload = () => {
        if (inFlight.current) return;
        inFlight.current = true;
        router.reload({
            preserveScroll: true,
            preserveState: true,
            onFinish: () => {
                inFlight.current = false;
            },
        });
    };

    useEcho<{ type: string }>(
        userId ? `user.${userId}` : 'user.0',
        '.notification.created',
        (notification) => {
            // Business records must always be refreshed from the server;
            // unlike chat text, their status and totals should never be
            // guessed optimistically in the browser.
            if (!['inquiry', 'quotation', 'order', 'payment', 'product', 'product_request', 'moderation'].includes(notification.type)) return;

            // Coalesce a burst of notifications into one authoritative
            // refresh instead of issuing a request for every event.
            if (reloadTimer.current) return;
            reloadTimer.current = window.setTimeout(() => {
                triggerSafeReload();
                reloadTimer.current = null;
            }, 400);
        },
        [userId],
    );

    // Lightweight silent auto-sync fallback (every 10s) for presentation tunnels
    // or temporary WebSocket disconnects. Never interrupts form typing or open modals.
    useEffect(() => {
        if (!userId) return;
        const pathOnly = currentUrl.split('?')[0];
        if (AUTO_SYNC_EXCLUDED_PATHS.some((segment) => pathOnly.includes(segment))) {
            return;
        }

        const interval = window.setInterval(() => {
            if (document.visibilityState !== 'visible') return;
            if (document.querySelector('[role="dialog"]')) return;
            const activeTag = document.activeElement?.tagName?.toLowerCase();
            if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;
            triggerSafeReload();
        }, 10000);

        return () => window.clearInterval(interval);
    }, [userId, currentUrl]);

    return null;
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        <RealtimePageSync />
        {children}
    </AppLayoutTemplate>
);
