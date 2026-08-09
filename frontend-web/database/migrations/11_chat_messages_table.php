<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->foreignId('receiver_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->foreignId('inquiry_id')
                ->constrained('inquiries')
                ->cascadeOnDelete();
            $table->text('message_text');
            $table->boolean('is_read')->default(false);
            $table->dateTime('sent_at');

            $table->index('inquiry_id');
            $table->index(['sender_id', 'receiver_id']);
            $table->index('is_read');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
    }
};
