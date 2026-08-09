<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')
                ->constrained('quotations')
                ->restrictOnDelete();
            $table->foreignId('client_id')
                ->constrained('business_clients')
                ->restrictOnDelete();
            $table->enum('order_status', [
                'approved',
                'in_production',
                'packed',
                'for_delivery',
                'delivered',
                'completed',
                'cancelled',
            ])->default('approved');
            $table->dateTime('confirmed_at')->nullable();
            $table->string('cancellation_reason', 255)->nullable();
            $table->dateTime('placed_at');
            $table->timestamps();
            $table->softDeletes();

            $table->index('client_id');
            $table->index('order_status');
            $table->index('quotation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
