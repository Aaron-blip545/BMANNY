<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_moderations', function (Blueprint $table) {
            $table->id('message_moderation_id');
            $table->foreignId('message_id')->constrained('messages', 'message_id')->cascadeOnDelete();
            $table->foreignId('hidden_by_user_id')->constrained('users', 'user_id')->cascadeOnDelete();
            $table->string('reason', 500);
            $table->timestamp('hidden_at');
            $table->timestamps();
            $table->unique('message_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_moderations');
    }
};
