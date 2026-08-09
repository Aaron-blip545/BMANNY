<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// FIXED: this file previously created "order_items" by mistake (a copy-paste
// slip). It now actually creates the "orders" table its filename promises.
// The real order_items content that used to live here has been moved to
// 2026_08_02_091053_create_order_items_table.php, where it belongs.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id('order_id');
            $table->foreignId('client_id')->references('client_id')->on('business_clients')->onDelete('cascade');
            $table->foreignId('quotation_id')->references('quotation_id')->on('quotations')->onDelete('cascade');
            $table->string('internal_tracking_number', 100)->nullable();
            $table->decimal('total_amount', 10, 2);
            $table->enum('status', ['pending', 'processing', 'completed', 'cancelled'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
