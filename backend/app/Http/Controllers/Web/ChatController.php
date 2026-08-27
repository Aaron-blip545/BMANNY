<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Inquiry;
use App\Models\Message;
use App\Services\NotificationService;
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

        // Load only messages between THIS agent/admin and the customer —
        // not every message on the inquiry. This keeps the admin's chat
        // thread separate from the sales agent's chat thread.
        $messages = Message::where(function ($q) use ($inquiryId) {
                $q->where('inquiry_id', $inquiryId)
                  ->orWhereNull('inquiry_id');
            })
            ->where(function ($q) use ($agent, $customer) {
                $q->where(function ($inner) use ($agent, $customer) {
                    $inner->where('sender_id',   $agent->user_id)
                          ->where('receiver_id', optional($customer)->user_id);
                })->orWhere(function ($inner) use ($agent, $customer) {
                    $inner->where('sender_id',   optional($customer)->user_id)
                          ->where('receiver_id', $agent->user_id);
                });
            })
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

        // Mark unread messages from the customer to this specific agent as read.
        if ($customer) {
            Message::where(function ($q) use ($inquiryId) {
                    $q->where('inquiry_id', $inquiryId)
                      ->orWhereNull('inquiry_id');
                })
                ->where('sender_id',   $customer->user_id)
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

        $message = Message::create([
            'sender_id'    => $agent->user_id,
            'receiver_id'  => $customer->user_id,
            'inquiry_id'   => $inquiryId,
            'message_body' => $validated['message_body'],
            'is_read'      => false,
        ]);

        // Dispatch real-time notification to the customer
        NotificationService::send(
            $customer->user_id,
            'message',
            'New message from ' . $agent->full_name,
            $validated['message_body'],
            [
                'sender_id'   => $agent->user_id,
                'sender_name' => $agent->full_name,
                'inquiry_id'  => $inquiryId,
                'message_id'  => $message->message_id,
            ]
        );

        return redirect()->route('chat.show', $inquiryId);
    }
}
