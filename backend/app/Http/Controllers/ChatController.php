<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Message;

class ChatController extends Controller
{
    // Send a message
    public function sendMessage(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,user_id',
            'inquiry_id' => 'nullable|exists:inquiries,inquiry_id',
            'message_body' => 'required|string',
        ]);

        $message = Message::create([
            'sender_id' => $request->user()->user_id,
            'receiver_id' => $request->receiver_id,
            'inquiry_id' => $request->inquiry_id,
            'message_body' => $request->message_body,
        ]);

        return response()->json([
            'message' => 'Message sent successfully.',
            'data' => $message
        ], 201);
    }

    // Get conversation history with a specific user
    public function getConversation(Request $request, $other_user_id)
    {
        $current_user_id = $request->user()->user_id;

        $messages = Message::where(function ($q) use ($current_user_id, $other_user_id) {
            $q->where('sender_id', $current_user_id)->where('receiver_id', $other_user_id);
        })->orWhere(function ($q) use ($current_user_id, $other_user_id) {
            $q->where('sender_id', $other_user_id)->where('receiver_id', $current_user_id);
        })->orderBy('created_at', 'asc')->get();

        return response()->json($messages, 200);
    }
}