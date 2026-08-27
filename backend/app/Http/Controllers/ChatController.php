<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    /**
     * List every conversation this user is part of — grouped by the OTHER
     * person, not by inquiry. This means the client always sees exactly one
     * chat row per sales agent, even if they have multiple inquiries.
     */
    public function conversations(Request $request)
    {
        $userId = $request->user()->user_id;

        $messages = Message::where('sender_id', $userId)
            ->orWhere('receiver_id', $userId)
            ->with(['sender', 'receiver'])
            ->orderByDesc('created_at')
            ->get();

        // Group by the OTHER person's user_id so that all messages
        // between this user and any given agent collapse into one row.
        $conversations = $messages
            ->groupBy(function ($message) use ($userId) {
                $otherId = $message->sender_id === $userId
                    ? $message->receiver_id
                    : $message->sender_id;
                return $otherId;
            })
            ->map(function ($group) use ($userId) {
                $latest = $group->first(); // newest-first, so first = latest

                // Resolve the other user's name from the relationship
                $other = $latest->sender_id === $userId
                    ? $latest->receiver
                    : $latest->sender;

                $unread = $group
                    ->where('receiver_id', $userId)
                    ->where('is_read', false)
                    ->count();

                return [
                    // inquiry_id is no longer used as the key but kept for
                    // backwards-compat in case the mobile still reads it
                    'inquiry_id'      => null,
                    'other_user_id'   => $other->user_id,
                    'other_user_name' => $other->full_name,
                    'last_message'    => $latest->message_body,
                    'last_message_at' => $latest->created_at,
                    'unread_count'    => $unread,
                ];
            })
            ->values();

        return response()->json($conversations);
    }

    /**
     * Return all messages between the authenticated user and one other person.
     */
    public function getConversation(Request $request, $other_user_id)
    {
        $userId = $request->user()->user_id;

        $messages = Message::where(function ($q) use ($userId, $other_user_id) {
                $q->where('sender_id', $userId)->where('receiver_id', $other_user_id);
            })
            ->orWhere(function ($q) use ($userId, $other_user_id) {
                $q->where('sender_id', $other_user_id)->where('receiver_id', $userId);
            })
            ->with(['sender', 'receiver'])
            ->orderBy('created_at')
            ->get();

        return response()->json($messages);
    }

    /**
     * Send a new message from the authenticated user to another user.
     */
    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'receiver_id'  => 'required|integer|exists:users,user_id',
            'message_body' => 'required|string',
            'inquiry_id'   => 'nullable|integer|exists:inquiries,inquiry_id',
        ]);

        $sender = $request->user();

        $message = Message::create([
            'sender_id'    => $sender->user_id,
            'receiver_id'  => $validated['receiver_id'],
            'message_body' => $validated['message_body'],
            'inquiry_id'   => $validated['inquiry_id'] ?? null,
            'is_read'      => false,
        ]);

        // Dispatch real-time notification to recipient
        NotificationService::send(
            (int) $validated['receiver_id'],
            'message',
            'New message from ' . $sender->full_name,
            $validated['message_body'],
            [
                'sender_id'   => $sender->user_id,
                'sender_name' => $sender->full_name,
                'inquiry_id'  => $validated['inquiry_id'] ?? null,
                'message_id'  => $message->message_id,
            ]
        );

        return response()->json($message->load(['sender', 'receiver']), 201);
    }

    /**
     * Mark all messages from one specific person as read - called when the
     * customer/agent actually opens that conversation.
     */
    public function markAsRead(Request $request, $other_user_id)
    {
        Message::where('sender_id', $other_user_id)
            ->where('receiver_id', $request->user()->user_id)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'Marked as read.']);
    }
}