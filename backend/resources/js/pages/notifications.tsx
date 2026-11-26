import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useNotifications } from '@/hooks/use-notifications';
import { Head } from '@inertiajs/react';
import {
    Bell,
    CheckCheck,
    Trash2,
    Clock,
} from 'lucide-react';

export default function NotificationsPage() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

    return (
        <AppLayout breadcrumbs={[{ title: 'Notifications', href: '/notifications/page' }]}>
            <Head title="Notifications" />
            <main className="bmanny-page">
                <div className="bmanny-page-inner space-y-5">
                    {/* Header Banner matching inquiries.tsx */}
                    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="border-l-4 border-amber-400 pl-3.5">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Workspace</p>
                            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">NOTIFICATIONS</h1>
                            <p className="text-xs text-muted-foreground sm:text-sm">
                                {unreadCount > 0
                                    ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}.`
                                    : 'Stay informed with updates, customer requests, and activities relevant to your role.'}
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <Button
                                variant="outline"
                                onClick={markAllAsRead}
                                className="h-10 rounded-lg border-border/80 bg-card px-4 text-xs font-semibold text-foreground shadow-sm hover:bg-muted"
                            >
                                <CheckCheck className="mr-1.5 h-4 w-4 text-muted-foreground" />
                                Mark all read
                            </Button>
                        )}
                    </header>

                    {/* Notification Floating Card Rows */}
                    {notifications.length === 0 ? (
                        <div className="rounded-xl border border-border/70 bg-card py-16 text-center text-muted-foreground shadow-sm">
                            <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                            <h2 className="text-base font-semibold text-foreground">No notifications yet</h2>
                            <p className="mt-1 text-xs">You are all caught up. No notifications found.</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.notification_id}
                                    className={`group flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-card p-5 shadow-sm transition-shadow hover:shadow-md ${
                                        !notification.is_read
                                            ? 'border-l-4 border-l-blue-600 dark:border-l-blue-400 bg-blue-50/15'
                                            : ''
                                    }`}
                                >
                                    <div className="flex items-start gap-4 min-w-0">
                                        <div
                                            className={`flex size-11 shrink-0 items-center justify-center rounded-xl border shadow-xs ${
                                                !notification.is_read
                                                    ? 'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                                    : 'border-border/80 bg-muted/40 text-muted-foreground'
                                            }`}
                                        >
                                            <Bell className="size-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-base font-bold text-foreground">
                                                    {notification.title}
                                                </p>
                                                {!notification.is_read && (
                                                    <span className="rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-[10px] font-bold">
                                                        New
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {notification.message}
                                            </p>
                                            <div className="mt-2 flex items-center gap-1.5 text-xs font-mono text-muted-foreground/70">
                                                <Clock className="size-3" />
                                                <span>{new Date(notification.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {!notification.is_read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                                                aria-label="Mark as read"
                                                onClick={() => markAsRead(notification.notification_id)}
                                            >
                                                <CheckCheck className="size-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                            aria-label="Delete notification"
                                            onClick={() => deleteNotification(notification.notification_id)}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </AppLayout>
    );
}
