<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')
                ->constrained('orders')
                ->cascadeOnDelete();
            $table->enum('payment_type', [
                'downpayment',
                'full_payment',
                'balance',
            ]);
            $table->enum('payment_method', [
                'bank_transfer',
                'gcash',
                'cash',
                'other',
            ]);
            $table->decimal('amount', 12, 2);
            $table->string('payment_reference_no', 100)->nullable();
            $table->enum('payment_status', [
                'pending',
                'verified',
                'rejected',
            ])->default('pending');
            $table->foreignId('verified_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->dateTime('payment_date');
            $table->timestamps();

            $table->index('order_id');
            $table->index('payment_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
