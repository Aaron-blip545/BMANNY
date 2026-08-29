<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Inquiry;
use App\Models\ConversationArchive;
use App\Models\ConversationClosure;
use App\Models\Message;
use App\Models\MessageModeration;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    /** Show one customer conversation, opened from any of that customer's inquiries. */
    public function show(Request $request, int $inquiryId): Response
    {
        $inquiry = Inquiry::with(['client.user', 'customizations'])
            ->findOrFail($inquiryId);

        $agent    = $request->user('web');
        $customer = optional($inquiry->client)->user;
        $isAdmin = $agent->role === 'admin';
        $isArchived = ConversationArchive::where('user_id', $agent->user_id)
            ->when(
                $customer,
                fn ($query) => $query->where('customer_user_id', $customer->user_id),
                fn ($query) => $query->where('inquiry_id', $inquiryId),
            )
            ->exists();
        $closure = $customer
            ? ConversationClosure::where('customer_user_id', $customer->user_id)->first()
            : null;
        $isArchiveHistory = $request->boolean('archived');

        if ($isArchived && ! $isArchiveHistory) {
            return redirect()->route('archived-chats.index')
                ->with('success', 'This conversation is archived. Open it from Archived chats to view its history or restore it.');
        }

        // Load only messages between THIS agent/admin and the customer —
        // not every message on the inquiry. This keeps the admin's chat
        // thread separate from the sales agent's chat thread.
        $messageQuery = Message::query();

        // Admin reviews flagged content in the dedicated moderation screen;
        // Sales sees a neutral placeholder instead of the flagged content.
        if ($isAdmin) {
            $messageQuery->whereDoesntHave('moderation');
        }

        if ($isAdmin) {
            // Mobile replies from older app versions may not have an
            // inquiry_id. Include those replies only when they are between
            // this inquiry's customer and a sales participant already found
            // on this inquiry, never every unassigned message in the system.
            $customerInquiryIds = $inquiry->client_id
                ? Inquiry::where('client_id', $inquiry->client_id)->pluck('inquiry_id')
                : collect([$inquiryId]);

            $participantIds = Message::whereIn('inquiry_id', $customerInquiryIds)
                ->get(['sender_id', 'receiver_id'])
                ->flatMap(fn ($message) => [$message->sender_id, $message->receiver_id])
                ->unique()
                ->values();

            $salesAgentIds = $customer
                ? $participantIds->reject(fn ($userId) => $userId === $customer->user_id)->values()
                : collect();

            $messageQuery->where(function ($query) use ($customerInquiryIds, $customer, $salesAgentIds) {
                $query->whereIn('inquiry_id', $customerInquiryIds);

                if ($customer && $salesAgentIds->isNotEmpty()) {
                    $query->orWhere(function ($participants) use ($customer, $salesAgentIds) {
                        $participants->where(function ($outbound) use ($customer, $salesAgentIds) {
                            $outbound->where('sender_id', $customer->user_id)
                                ->whereIn('receiver_id', $salesAgentIds);
                        })->orWhere(function ($inbound) use ($customer, $salesAgentIds) {
                            $inbound->whereIn('sender_id', $salesAgentIds)
                                ->where('receiver_id', $customer->user_id);
                        });
                    });
                }
            });
        } else {
            $messageQuery->where(function ($q) use ($agent, $customer) {
                $q->where(function ($inner) use ($agent, $customer) {
                    $inner->where('sender_id',   $agent->user_id)
                          ->where('receiver_id', optional($customer)->user_id);
                })->orWhere(function ($inner) use ($agent, $customer) {
                    $inner->where('sender_id',   optional($customer)->user_id)
                          ->where('receiver_id', $agent->user_id);
                });
            });
        }

        $messages = $messageQuery
            ->with(['sender.businessClient', 'receiver.businessClient', 'moderation'])
            ->orderBy('created_at')
            ->get()
            ->map(fn ($m) => [
                'message_id'   => $m->message_id,
                'body'         => $m->message_body,
                'image_url'    => $m->image_url,
                'sent_by_me'   => ! $isAdmin && $m->sender_id === $agent->user_id,
                'sender_name'  => $m->sender?->full_name ?? 'Unknown',
                'sender_profile_pic_url' => $m->sender?->businessClient?->profile_pic_url,
                'created_at'   => $m->created_at->toIso8601String(),
                'is_read'      => $m->is_read,
                'is_flagged'   => $m->moderation !== null,
            ]);

        // Mark unread messages in this customer/agent conversation as read.
        if ($customer && ! $isAdmin) {
            Message::where('sender_id', $customer->user_id)
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
                'inquiry_count' => $inquiry->client_id
                    ? Inquiry::where('client_id', $inquiry->client_id)->count()
                    : 1,
            ],
            'messages'   => $messages,
            'agentId'    => $agent->user_id,
            'isArchived' => $isArchived,
            'isArchiveHistory' => $isArchiveHistory,
            'canModerate' => $isAdmin,
            'canReply'    => ! $isAdmin && ! $isArchived && ! $closure,
            'isConversationClosed' => $closure !== null,
        ]);
    }

    /** Open the relevant customer conversation for a notification with only a sender ID. */
    public function openConversationWith(Request $request, int $otherUserId)
    {
        $viewer = $request->user('web');
        abort_unless(in_array($viewer?->role, ['sales_agent', 'admin'], true), 403);

        $latestMessage = Message::where(function ($query) use ($viewer, $otherUserId) {
            $query->where('sender_id', $viewer->user_id)->where('receiver_id', $otherUserId);
        })->orWhere(function ($query) use ($viewer, $otherUserId) {
            $query->where('sender_id', $otherUserId)->where('receiver_id', $viewer->user_id);
        })->latest('created_at')->first();

        abort_unless($latestMessage, 404);

        $inquiryId = $latestMessage->inquiry_id
            ?? Inquiry::whereHas('client', fn ($query) => $query->where('user_id', $otherUserId))
                ->latest('created_at')
                ->value('inquiry_id');

        abort_unless($inquiryId, 404);

        return redirect()->route('chat.show', $inquiryId);
    }


    /**
     * Store a new message from the sales agent to the customer.
     */
    public function send(Request $request, int $inquiryId)
    {
        $inquiry  = Inquiry::with('client.user')->findOrFail($inquiryId);
        $agent    = $request->user('web');
        $customer = optional($inquiry->client)->user;

        abort_unless($agent->role === 'sales_agent', 403);

        if (ConversationArchive::where('user_id', $agent->user_id)
            ->where('customer_user_id', $customer?->user_id)
            ->exists()) {
            return redirect()->route('archived-chats.index')
                ->with('success', 'Restore this conversation before sending a new message.');
        }

        if (ConversationClosure::where('customer_user_id', $customer?->user_id)->exists()) {
            return back()->withErrors(['message' => 'This conversation was closed by an administrator and is read-only.']);
        }

        if (! $customer) {
            return back()->withErrors(['message' => 'Cannot find the customer for this inquiry.']);
        }

        $validated = $request->validate([
            'message_body' => 'nullable|string|max:2000',
            'image'        => 'nullable|image|max:10240',
        ]);

        if (empty($validated['message_body']) && !$request->hasFile('image')) {
            return back()->withErrors(['message' => 'Please enter a message or attach an image.']);
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('chat-images', 'public');
        }

        $message = Message::create([
            'sender_id'    => $agent->user_id,
            'receiver_id'  => $customer->user_id,
            'inquiry_id'   => $inquiryId,
            'message_body' => $validated['message_body'] ?? null,
            'image_path'   => $imagePath,
            'is_read'      => false,
        ]);

        $notificationBody = !empty($validated['message_body'])
            ? $validated['message_body']
            : '📷 Sent a photo';

        // Dispatch real-time notification to the customer
        NotificationService::send(
            $customer->user_id,
            'message',
            'New message from ' . $agent->full_name,
            $notificationBody,
            [
                'sender_id'   => $agent->user_id,
                'sender_name' => $agent->full_name,
                'inquiry_id'  => $inquiryId,
                'message_id'  => $message->message_id,
            ]
        );

        return redirect()->route('chat.show', $inquiryId);
    }

    /** Hide this conversation only for the current staff member. */
    public function archive(Request $request, int $inquiryId)
    {
        $inquiry = Inquiry::with('client.user')->findOrFail($inquiryId);
        $customer = optional($inquiry->client)->user;

        if (! $customer) {
            return back()->withErrors(['message' => 'Cannot archive a conversation without a customer account.']);
        }

        ConversationArchive::firstOrCreate(
            [
                'user_id' => $request->user('web')->user_id,
                'customer_user_id' => $customer->user_id,
            ],
            ['inquiry_id' => $inquiryId, 'archived_at' => now()]
        );

        return redirect()->route('inquiries.index')
            ->with('success', 'Conversation archived for your workspace. The customer history is unchanged.');
    }

    /** Restore an archived conversation to the current staff member's inbox. */
    public function restore(Request $request, int $inquiryId)
    {
        $inquiry = Inquiry::with('client.user')->findOrFail($inquiryId);
        $customer = optional($inquiry->client)->user;

        ConversationArchive::where('user_id', $request->user('web')->user_id)
            ->where(function ($query) use ($inquiryId, $customer) {
                $query->where('inquiry_id', $inquiryId);
                if ($customer) {
                    $query->orWhere('customer_user_id', $customer->user_id);
                }
            })
            ->delete();

        return redirect()->route('archived-chats.index')
            ->with('success', 'Conversation restored to your active inquiries.');
    }

    /** Admin-only: close the customer-wide conversation without deleting its history. */
    public function closeConversation(Request $request, int $inquiryId)
    {
        $admin = $request->user('web');
        abort_unless($admin?->role === 'admin', 403);

        $inquiry = Inquiry::with('client.user')->findOrFail($inquiryId);
        $customer = optional($inquiry->client)->user;

        if (! $customer) {
            return back()->withErrors(['message' => 'Cannot close a conversation without a customer account.']);
        }

        ConversationClosure::updateOrCreate(
            ['customer_user_id' => $customer->user_id],
            [
                'inquiry_id' => $inquiryId,
                'closed_by_user_id' => $admin->user_id,
                'closed_at' => now(),
            ]
        );

        $participantIds = Message::whereHas('inquiry', fn ($query) => $query->where('client_id', $inquiry->client_id))
            ->get(['sender_id', 'receiver_id'])
            ->flatMap(fn ($message) => [$message->sender_id, $message->receiver_id])
            ->push($customer->user_id)
            ->reject(fn ($userId) => $userId === $admin->user_id)
            ->unique();

        foreach ($participantIds as $userId) {
            NotificationService::send(
                $userId,
                'moderation',
                'Conversation closed by administrator',
                'This customer conversation is now read-only. Its history remains available.',
                ['inquiry_id' => $inquiryId, 'action' => 'conversation_closed']
            );
        }

        return back()->with('success', 'Conversation closed. The customer and involved sales staff can view its history but cannot send messages.');
    }

    /** Admin-only: reopen a customer-wide conversation. */
    public function reopenConversation(Request $request, int $inquiryId)
    {
        $admin = $request->user('web');
        abort_unless($admin?->role === 'admin', 403);

        $inquiry = Inquiry::with('client.user')->findOrFail($inquiryId);
        $customer = optional($inquiry->client)->user;

        if ($customer) {
            ConversationClosure::where('customer_user_id', $customer->user_id)->delete();

            NotificationService::send(
                $customer->user_id,
                'moderation',
                'Conversation reopened',
                'An administrator reopened this conversation. You can send messages again.',
                ['inquiry_id' => $inquiryId, 'action' => 'conversation_reopened']
            );
        }

        return back()->with('success', 'Conversation reopened.');
    }

    /** Admin-only: hide one message from staff views while retaining it for the customer. */
    public function hideMessage(Request $request, int $inquiryId, int $messageId)
    {
        $admin = $request->user('web');
        abort_unless($admin?->role === 'admin', 403);

        $validated = $request->validate(['reason' => 'required|string|max:500']);
        $inquiry = Inquiry::with('client.user')->findOrFail($inquiryId);
        $customer = optional($inquiry->client)->user;
        $message = Message::findOrFail($messageId);

        // A message can be a legacy mobile reply with no inquiry_id. It is
        // still eligible for moderation when it belongs to the customer and
        // one of the sales participants already associated with this inquiry.
        $customerInquiryIds = $inquiry->client_id
            ? Inquiry::where('client_id', $inquiry->client_id)->pluck('inquiry_id')
            : collect([$inquiryId]);

        $salesAgentIds = Message::whereIn('inquiry_id', $customerInquiryIds)
            ->get(['sender_id', 'receiver_id'])
            ->flatMap(fn ($item) => [$item->sender_id, $item->receiver_id])
            ->reject(fn ($userId) => $userId === $customer?->user_id)
            ->unique();

        $belongsToInquiry = $customerInquiryIds->contains($message->inquiry_id);
        $belongsToConversation = $customer && (
            ($message->sender_id === $customer->user_id && $salesAgentIds->contains($message->receiver_id)) ||
            ($message->receiver_id === $customer->user_id && $salesAgentIds->contains($message->sender_id))
        );

        abort_unless($belongsToInquiry || $belongsToConversation, 404);

        MessageModeration::updateOrCreate(
            ['message_id' => $message->message_id],
            ['hidden_by_user_id' => $admin->user_id, 'reason' => $validated['reason'], 'hidden_at' => now()]
        );

        NotificationService::send(
            $message->sender_id,
            'moderation',
            'Message flagged as inappropriate',
            'An administrator flagged one of your messages. Please keep conversations respectful and relevant. Reason: ' . $validated['reason'],
            [
                'message_id' => $message->message_id,
                'inquiry_id' => $inquiryId,
                'action' => 'message_flagged',
            ]
        );

        if ($message->receiver_id !== $message->sender_id) {
            NotificationService::send(
                $message->receiver_id,
                'moderation',
                'Conversation message flagged',
                'An administrator flagged a message in your conversation as inappropriate. The sender has been notified.',
                [
                    'message_id' => $message->message_id,
                    'inquiry_id' => $inquiryId,
                    'action' => 'message_flagged',
                ]
            );
        }

        return back()->with('success', 'Message flagged. Both conversation participants were notified and the original was retained for audit.');
    }

    /** Admin-only moderation record, separate from the normal chat view. */
    public function hiddenMessages(Request $request): Response
    {
        abort_unless($request->user('web')?->role === 'admin', 403);

        $moderations = MessageModeration::with([
            'message.sender',
            'message.receiver',
            'message.inquiry.client',
            'hiddenBy',
        ])
            ->latest('hidden_at')
            ->get();

        return Inertia::render('admin/hidden-messages', ['moderations' => $moderations]);
    }

    /** Restore one flagged message to the normal staff conversation view. */
    public function restoreMessage(Request $request, int $messageId)
    {
        abort_unless($request->user('web')?->role === 'admin', 403);

        $moderation = MessageModeration::where('message_id', $messageId)->firstOrFail();
        $moderation->delete();

        return back()->with('success', 'Message restored to staff views.');
    }
}
