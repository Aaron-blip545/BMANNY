<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get paginated notifications for the authenticated user.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->user_id;

        $notifications = AppNotification::where('user_id', $userId)
            ->orderByDesc('created_at')
            ->limit($request->query('limit', 30))
            ->get();

        $unreadCount = AppNotification::where('user_id', $userId)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count'  => $unreadCount,
        ]);
    }

    /**
     * Get just the unread notifications count for fast badge polling.
     */
    public function unreadCount(Request $request)
    {
        $userId = $request->user()->user_id;

        $unreadCount = AppNotification::where('user_id', $userId)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(Request $request, $notification_id)
    {
        $userId = $request->user()->user_id;

        $notification = AppNotification::where('notification_id', $notification_id)
            ->where('user_id', $userId)
            ->firstOrFail();

        $notification->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return response()->json([
            'message'      => 'Notification marked as read.',
            'notification' => $notification,
        ]);
    }

    /**
     * Mark all notifications for the authenticated user as read.
     */
    public function markAllAsRead(Request $request)
    {
        $userId = $request->user()->user_id;

        AppNotification::where('user_id', $userId)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'message' => 'All notifications marked as read.',
        ]);
    }

    /**
     * Delete a specific notification.
     */
    public function destroy(Request $request, $notification_id)
    {
        $userId = $request->user()->user_id;

        $notification = AppNotification::where('notification_id', $notification_id)
            ->where('user_id', $userId)
            ->firstOrFail();

        $notification->delete();

        return response()->json([
            'message' => 'Notification deleted.',
        ]);
    }
}
