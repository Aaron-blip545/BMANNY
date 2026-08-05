<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('inquiries', function (Blueprint $table) {
        $table->id('inquiry_id');
        $table->foreignId('user_id')->nullable()->references('user_id')->on('users')->onDelete('set null');
        $table->string('subject', 200);
        $table->text('message');
        $table->enum('status', ['pending', 'reviewed', 'responded', 'closed'])->default('pending');
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inquiries');
    }
};
