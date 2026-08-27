import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Bell, CheckCheck, CircleHelp, FileText, MessageSquare, PackageCheck, Trash2, X } from 'lucide-react';
import { useNotifications, AppNotificationItem } from '@/hooks/use-notifications';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function formatTimeAgo(dateString: string) {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function getNotificationMeta(notification: AppNotificationItem) {
    switch (notification.type) {
        case 'inquiry':
            return {
                icon: CircleHelp,
                color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
                targetUrl: '/inquiries',
            };
        case 'quotation':
            return {
                icon: FileText,
                color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
                targetUrl: '/quotations',
            };
        case 'order':
            return {
                icon: PackageCheck,
                color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
                targetUrl: '/orders',
            };
        case 'message':
            return {
                icon: MessageSquare,
                color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
                targetUrl: notification.data?.inquiry_id
                    ? `/inquiries/${notification.data.inquiry_id}/chat`
                    : '/inquiries',
            };
        default:
            return {
                icon: Bell,
                color: 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20',
                targetUrl: '/dashboard',
            };
    }
}

export function NotificationBell({ className }: { className?: string }) {
    const [open, setOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

    const handleItemClick = (item: AppNotificationItem) => {
        if (!item.is_read) {
            markAsRead(item.notification_id);
        }
        setOpen(false);

        const meta = getNotificationMeta(item);
        if (meta.targetUrl) {
            router.visit(meta.targetUrl);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        'relative h-9 w-9 rounded-full text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
                        className,
                    )}
                    aria-label="Notifications"
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm animate-pulse">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                sideOffset={8}
                className="w-80 sm:w-96 p-0 shadow-xl border-border bg-popover text-popover-foreground rounded-xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/40">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">Notifications</span>
                        {unreadCount > 0 && (
                            <span className="rounded-full bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 text-xs font-semibold">
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                            <CheckCheck className="h-3.5 w-3.5" />
                            <span>Mark all read</span>
                        </button>
                    )}
                </div>

                {/* Notification List */}
                <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                                <Bell className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">No notifications</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                You're all caught up! When updates arrive, they will appear here.
                            </p>
                        </div>
                    ) : (
                        notifications.map((item) => {
                            const meta = getNotificationMeta(item);
                            const IconComponent = meta.icon;

                            return (
                                <div
                                    key={item.notification_id}
                                    onClick={() => handleItemClick(item)}
                                    className={cn(
                                        'group relative flex items-start gap-3 p-3.5 transition-colors cursor-pointer text-left',
                                        item.is_read
                                            ? 'bg-transparent hover:bg-muted/40'
                                            : 'bg-primary/5 hover:bg-primary/10',
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                                            meta.color,
                                        )}
                                    >
                                        <IconComponent className="h-4 w-4" />
                                    </div>

                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-1.5">
                                            <p
                                                className={cn(
                                                    'text-xs truncate font-semibold',
                                                    item.is_read ? 'text-foreground/90' : 'text-foreground font-bold',
                                                )}
                                            >
                                                {item.title}
                                            </p>
                                            {!item.is_read && (
                                                <span className="h-1.5 w-1.5 rounded-full bg-red-600 shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                                            {item.message}
                                        </p>
                                        <span className="text-[10px] text-muted-foreground/80 mt-1.5 block font-medium">
                                            {formatTimeAgo(item.created_at)}
                                        </span>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNotification(item.notification_id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-red-500 rounded-md"
                                        title="Dismiss"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
