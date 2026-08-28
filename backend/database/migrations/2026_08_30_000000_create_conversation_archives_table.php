<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversation_archives', function (Blueprint $table) {
            $table->id('conversation_archive_id');
            $table->foreignId('user_id')->constrained('users', 'user_id')->cascadeOnDelete();
            $table->foreignId('inquiry_id')->constrained('inquiries', 'inquiry_id')->cascadeOnDelete();
            $table->timestamp('archived_at');
            $table->timestamps();
            $table->unique(['user_id', 'inquiry_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversation_archives');
    }
};
