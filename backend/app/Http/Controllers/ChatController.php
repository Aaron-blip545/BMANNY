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
                'inquiry_id' => $latest->inquiry_id,
                'other_user_id' => $other->user_id,
                'other_user_name' => $other->full_name,
                'last_message' => $latest->message_body,
                'last_message_at' => $latest->created_at,
                'unread_count' => $group->where('receiver_id', $userId)->where('is_read', false)->count(),
            ];
        })
        ->values();

    return response()->json($conversations);
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