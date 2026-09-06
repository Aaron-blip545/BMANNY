<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Message $message)
    {
    }

    /** Deliver a chat update only to the intended recipient. */
    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.' . $this->message->receiver_id)];
    }

    public function broadcastAs(): string
    {
        return 'chat.message.created';
    }

    /** Clients re-fetch the authoritative conversation after this signal. */
    public function broadcastWith(): array
    {
        return [
            'message_id' => $this->message->message_id,
            'sender_id' => $this->message->sender_id,
            'receiver_id' => $this->message->receiver_id,
            'inquiry_id' => $this->message->inquiry_id,
            'created_at' => $this->message->created_at?->toISOString(),
        ];
    }
}
