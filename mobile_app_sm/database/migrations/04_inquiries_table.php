<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inquiries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')
                ->constrained('business_clients')
                ->cascadeOnDelete();
            $table->foreignId('assigned_agent_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->foreignId('config_id')
                ->constrained('product_configurations')
                ->restrictOnDelete();
            $table->unsignedInteger('requested_quantity');
            $table->string('brand_name', 150);
            $table->text('special_requests')->nullable();
            $table->enum('inquiry_status', [
                'new',
                'for_quotation',
                'quotation_sent',
                'follow_up',
                'converted',
                'closed',
            ])->default('new');
            $table->dateTime('submitted_at');
            $table->timestamps();
            $table->softDeletes();

            $table->index('client_id');
            $table->index('assigned_agent_id');
            $table->index('config_id');
            $table->index('inquiry_status');
            $table->index(['inquiry_status', 'submitted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inquiries');
    }
};
