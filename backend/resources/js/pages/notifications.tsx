import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { useNotifications } from '@/hooks/use-notifications';
import { Head } from '@inertiajs/react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';

export default function NotificationsPage() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

    return <AppLayout breadcrumbs={[{ title: 'Notifications', href: '/notifications/page' }]}>
        <Head title="Notifications" />
        <main className="bmanny-page"><div className="bmanny-page-inner space-y-5">
            <section className="bmanny-page-header flex items-center justify-between gap-4"><div><p className="bmanny-page-eyebrow">Workspace</p><h1 className="text-2xl font-semibold tracking-tight">Notifications</h1><p className="mt-1 text-sm text-muted-foreground">{unreadCount} unread notification{unreadCount === 1 ? '' : 's'}.</p></div>{unreadCount > 0 && <Button variant="outline" onClick={markAllAsRead}><CheckCheck className="mr-2 size-4" />Mark all read</Button>}</section>
            <Card className="bmanny-workspace overflow-hidden"><CardHeader><CardTitle>Recent activity</CardTitle><CardDescription>Updates relevant to your role appear here.</CardDescription></CardHeader><CardContent className="p-0">{notifications.length === 0 ? <div className="py-14 text-center text-sm text-muted-foreground"><Bell className="mx-auto mb-3 size-6" />No notifications yet.</div> : <ul className="divide-y">{notifications.map((notification) => <li key={notification.notification_id} className={`flex gap-4 p-5 ${notification.is_read ? '' : 'bg-muted/30'}`}><Bell className="mt-0.5 size-5 shrink-0 text-primary" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="font-medium">{notification.title}</p><span className="shrink-0 text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</span></div><p className="mt-1 text-sm text-muted-foreground">{notification.message}</p></div><div className="flex shrink-0 gap-1">{!notification.is_read && <Button variant="ghost" size="icon" aria-label="Mark as read" onClick={() => markAsRead(notification.notification_id)}><CheckCheck className="size-4" /></Button>}<Button variant="ghost" size="icon" aria-label="Delete notification" onClick={() => deleteNotification(notification.notification_id)}><Trash2 className="size-4" /></Button></div></li>)}</ul>}</CardContent></Card>
        </div></main>
    </AppLayout>;
}
