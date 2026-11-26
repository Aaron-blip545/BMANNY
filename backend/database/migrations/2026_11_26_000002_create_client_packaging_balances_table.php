<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_packaging_balances', function (Blueprint $table) {
            $table->id('balance_id');
            $table->unsignedBigInteger('client_id');
            $table->unsignedBigInteger('source_order_id')->nullable();
            $table->string('brand_name')->default('Client Brand');
            $table->string('package_slug', 40); // gold, elite
            $table->unsignedInteger('total_pouches');
            $table->unsignedInteger('used_pouches')->default(0);
            $table->unsignedInteger('remaining_pouches');
            $table->decimal('production_unit_cost', 10, 2);
            $table->decimal('packaging_unit_cost', 10, 2)->default(10.00);
            $table->unsignedInteger('batch_min_quantity');
            $table->boolean('cylinder_paid')->default(true);
            $table->timestamp('expires_at');
            $table->string('status', 20)->default('active'); // active, depleted, expired
            $table->timestamps();

            $table->foreign('client_id')
                ->references('client_id')
                ->on('business_clients')
                ->cascadeOnDelete();

            $table->foreign('source_order_id')
                ->references('order_id')
                ->on('orders')
                ->nullOnDelete();
        });

        Schema::table('inquiries', function (Blueprint $table) {
            $table->string('inquiry_type', 30)->default('new')->after('status');
            $table->unsignedBigInteger('packaging_balance_id')->nullable()->after('inquiry_type');
            $table->unsignedInteger('reorder_batch_quantity')->nullable()->after('packaging_balance_id');
            $table->unsignedBigInteger('source_order_id')->nullable()->after('reorder_batch_quantity');

            $table->foreign('packaging_balance_id')
                ->references('balance_id')
                ->on('client_packaging_balances')
                ->nullOnDelete();

            $table->foreign('source_order_id')
                ->references('order_id')
                ->on('orders')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('inquiries', function (Blueprint $table) {
            $table->dropForeign(['packaging_balance_id']);
            $table->dropForeign(['source_order_id']);
            $table->dropColumn([
                'inquiry_type',
                'packaging_balance_id',
                'reorder_batch_quantity',
                'source_order_id',
            ]);
        });

        Schema::dropIfExists('client_packaging_balances');
    }
};
