<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversation_closures', function (Blueprint $table) {
            $table->id('conversation_closure_id');
            $table->foreignId('customer_user_id')->constrained('users', 'user_id')->cascadeOnDelete();
            $table->foreignId('inquiry_id')->constrained('inquiries', 'inquiry_id')->cascadeOnDelete();
            $table->foreignId('closed_by_user_id')->constrained('users', 'user_id')->cascadeOnDelete();
            $table->timestamp('closed_at');
            $table->timestamps();

            // A closure applies to the customer-wide conversation, not one inquiry only.
            $table->unique('customer_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversation_closures');
    }
};
