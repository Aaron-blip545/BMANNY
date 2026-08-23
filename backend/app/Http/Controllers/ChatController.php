<?php

namespace App\Http\Controllers;

use App\Models\Message;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    /**
     * List every conversation this user is part of - grouped by inquiry
     * (or by the other person, if the messages aren't tied to an inquiry).
     * This is what powers the conversations list screen.
     */
    public function conversations(Request $request)
    {
        $userId = $request->user()->user_id;

        $messages = Message::where('sender_id', $userId)
            ->orWhere('receiver_id', $userId)
            ->with(['sender', 'receiver'])
            ->orderByDesc('created_at')
            ->get();

        $conversations = $messages
            ->groupBy(function ($message) use ($userId) {
                // Group by inquiry if there is one, otherwise just by
                // whoever the other person is.
                $otherId = $message->sender_id === $userId ? $message->receiver_id : $message->sender_id;
                return $message->inquiry_id ? "inquiry_{$message->inquiry_id}" : "user_{$otherId}";
            })
            ->map(function ($group) use ($userId) {
                $latest = $group->first(); // already sorted newest-first
                $other = $latest->sender_id === $userId ? $latest->receiver : $latest->sender;

                return [
                    'inquiry_id'     => $latest->inquiry_id,
                    'other_user_id'  => $other->user_id,
                    'other_user_name'=> $other->full_name,
                    'last_message'   => $latest->message_body,
                    'last_message_at'=> $latest->created_at,
                    'unread_count'   => $group->where('receiver_id', $userId)->where('is_read', false)->count(),
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

        $message = Message::create([
            'sender_id'    => $request->user()->user_id,
            'receiver_id'  => $validated['receiver_id'],
            'message_body' => $validated['message_body'],
            'inquiry_id'   => $validated['inquiry_id'] ?? null,
            'is_read'      => false,
        ]);

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