<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Inquiry;
use App\Models\Message;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    /**
     * Show the chat thread for a specific inquiry.
     * The sales agent sees all messages between themselves and the customer
     * that are tied to this inquiry.
     */
    public function show(Request $request, int $inquiryId): Response
    {
        $inquiry = Inquiry::with(['client.user', 'customizations'])
            ->findOrFail($inquiryId);

        $agent    = $request->user('web');
        $customer = optional($inquiry->client)->user;

        // Load the full message thread for this inquiry, oldest first.
        $messages = Message::where('inquiry_id', $inquiryId)
            ->with(['sender', 'receiver'])
            ->orderBy('created_at')
            ->get()
            ->map(fn ($m) => [
                'message_id'   => $m->message_id,
                'body'         => $m->message_body,
                'sent_by_me'   => $m->sender_id === $agent->user_id,
                'sender_name'  => $m->sender?->full_name ?? 'Unknown',
                'created_at'   => $m->created_at->toIso8601String(),
                'is_read'      => $m->is_read,
            ]);

        // Mark any unread messages from the customer as read now that
        // the agent has opened the thread.
        if ($customer) {
            Message::where('inquiry_id', $inquiryId)
                ->where('sender_id', $customer->user_id)
                ->where('receiver_id', $agent->user_id)
                ->where('is_read', false)
                ->update(['is_read' => true]);
        }

        return Inertia::render('sales/chat', [
            'inquiry'    => [
                'inquiry_id'   => $inquiry->inquiry_id,
                'status'       => $inquiry->status,
                'business'     => $inquiry->client?->business_name ?? '—',
                'contact'      => $inquiry->client?->contact_person ?? '—',
                'customer_id'  => $customer?->user_id,
            ],
            'messages'   => $messages,
            'agentId'    => $agent->user_id,
        ]);
    }

    /**
     * Store a new message from the sales agent to the customer.
     */
    public function send(Request $request, int $inquiryId)
    {
        $inquiry  = Inquiry::with('client.user')->findOrFail($inquiryId);
        $agent    = $request->user('web');
        $customer = optional($inquiry->client)->user;

        if (! $customer) {
            return back()->withErrors(['message' => 'Cannot find the customer for this inquiry.']);
        }

        $validated = $request->validate([
            'message_body' => 'required|string|max:2000',
        ]);

        Message::create([
            'sender_id'    => $agent->user_id,
            'receiver_id'  => $customer->user_id,
            'inquiry_id'   => $inquiryId,
            'message_body' => $validated['message_body'],
            'is_read'      => false,
        ]);

        return redirect()->route('chat.show', $inquiryId);
    }
}
