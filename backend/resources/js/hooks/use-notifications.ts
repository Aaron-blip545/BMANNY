import { useEffect, useState, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';

export interface AppNotificationItem {
    notification_id: number;
    user_id: number;
    type: 'inquiry' | 'quotation' | 'order' | 'message' | 'system' | string;
    title: string;
    message: string;
    data?: any;
    is_read: boolean;
    read_at?: string | null;
    created_at: string;
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const userId = (usePage().props as { auth?: { user?: { user_id?: number } } }).auth?.user?.user_id;

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await fetch('/notifications?limit=25', {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unread_count || 0);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEcho(
        userId ? `user.${userId}` : 'user.0',
        '.notification.created',
        () => fetchNotifications(),
        [userId, fetchNotifications],
    );

    const markAsRead = async (notificationId: number) => {
        try {
            // Optimistic update
            setNotifications((prev) =>
                prev.map((n) => (n.notification_id === notificationId ? { ...n, is_read: true } : n)),
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));

            // Get CSRF token
            const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;

            await fetch(`/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(token ? { 'X-CSRF-TOKEN': token } : {}),
                },
            });
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            // Optimistic update
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);

            const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;

            await fetch('/notifications/read-all', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(token ? { 'X-CSRF-TOKEN': token } : {}),
                },
            });
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const deleteNotification = async (notificationId: number) => {
        try {
            const target = notifications.find((n) => n.notification_id === notificationId);
            setNotifications((prev) => prev.filter((n) => n.notification_id !== notificationId));
            if (target && !target.is_read) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }

            const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;

            await fetch(`/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(token ? { 'X-CSRF-TOKEN': token } : {}),
                },
            });
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();

    }, [fetchNotifications]);

    return {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    };
}
