<?php

namespace App\Services;

use App\Events\NotificationSent;
use App\Models\AppNotification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send a notification to a specific user.
     */
    public static function send(int $userId, string $type, string $title, string $message, ?array $data = null): ?AppNotification
    {
        try {
            $notification = AppNotification::create([
                'user_id' => $userId,
                'type'    => $type,
                'title'   => $title,
                'message' => $message,
                'data'    => $data,
                'is_read' => false,
            ]);

            try {
                broadcast(new NotificationSent($notification))->toOthers();
            } catch (\Throwable $e) {
                // Log broadcasting error without failing the main transaction
                Log::warning('Failed to broadcast notification: ' . $e->getMessage());
            }

            return $notification;
        } catch (\Throwable $e) {
            Log::error('Failed to create notification: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Send a notification to all active users with a given role.
     */
    public static function sendToRole(string $role, string $type, string $title, string $message, ?array $data = null): array
    {
        $users = User::where('role', $role)->where('is_active', true)->get();
        $created = [];

        foreach ($users as $user) {
            $notification = self::send($user->user_id, $type, $title, $message, $data);
            if ($notification) {
                $created[] = $notification;
            }
        }

        return $created;
    }

    /**
     * Send a notification to all active users in multiple roles.
     */
    public static function sendToRoles(array $roles, string $type, string $title, string $message, ?array $data = null): array
    {
        $users = User::whereIn('role', $roles)->where('is_active', true)->get();
        $created = [];

        foreach ($users as $user) {
            $notification = self::send($user->user_id, $type, $title, $message, $data);
            if ($notification) {
                $created[] = $notification;
            }
        }

        return $created;
    }
}
