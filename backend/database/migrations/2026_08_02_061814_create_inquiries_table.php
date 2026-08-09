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
        // FIXED: was user_id -> users. Every other table (BusinessClient,
        // Order) treats a customer as a business_clients.client_id, not a
        // raw users.user_id. This now matches that pattern.
        $table->foreignId('client_id')->references('client_id')->on('business_clients')->onDelete('cascade');
        // FIXED: made nullable - InquiryController doesn't currently set
        // these (the real inquiry content lives in inquiry_customizations).
        $table->string('subject', 200)->nullable();
        $table->text('message')->nullable();
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
