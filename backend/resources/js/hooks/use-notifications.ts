import { useEffect, useState, useCallback, useRef } from 'react';

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
    const prevUnreadRef = useRef<number>(0);

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
                prevUnreadRef.current = data.unread_count || 0;
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await fetch('/notifications/unread-count', {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const data = await response.json();
                const newCount = data.unread_count ?? 0;
                
                // If unread count increased, re-fetch full list
                if (newCount > prevUnreadRef.current) {
                    fetchNotifications();
                }
                setUnreadCount(newCount);
                prevUnreadRef.current = newCount;
            }
        } catch (err) {
            // Silently ignore network hiccup during background polling
        }
    }, [fetchNotifications]);

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

        // Background polling every 8 seconds for real-time responsiveness
        const interval = setInterval(fetchUnreadCount, 8000);
        return () => clearInterval(interval);
    }, [fetchNotifications, fetchUnreadCount]);

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
