<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_updates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')
                ->constrained('orders')
                ->cascadeOnDelete();
            $table->enum('delivery_status', [
                'preparing',
                'dispatched',
                'in_transit',
                'delivered',
                'failed',
            ])->default('preparing');
            $table->string('courier_name', 100)->nullable();
            $table->string('tracking_number', 100)->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->index('delivery_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_updates');
    }
};
