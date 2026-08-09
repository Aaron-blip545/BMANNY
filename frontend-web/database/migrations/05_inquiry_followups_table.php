<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inquiry_followups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inquiry_id')
                ->constrained('inquiries')
                ->cascadeOnDelete();
            $table->foreignId('logged_by')
                ->constrained('users')
                ->restrictOnDelete();
            $table->dateTime('followup_date');
            $table->text('followup_notes');
            $table->string('next_action', 255)->nullable();
            $table->timestamps();

            $table->index('inquiry_id');
            $table->index('followup_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inquiry_followups');
    }
};
