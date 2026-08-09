<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('production_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')
                ->unique()
                ->constrained('orders')
                ->cascadeOnDelete();
            $table->date('production_start');
            $table->date('target_end_date');
            $table->date('actual_end_date')->nullable();
            $table->enum('production_status', [
                'scheduled',
                'in_progress',
                'completed',
                'delayed',
            ])->default('scheduled');
            $table->text('production_notes')->nullable();
            $table->timestamps();

            $table->index('production_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_schedules');
    }
};
