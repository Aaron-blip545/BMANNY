<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_packages', function (Blueprint $table) {
            $table->decimal('before_production_amount', 12, 2)->nullable()->after('initial_price');
            $table->string('before_production_label')->nullable()->after('before_production_amount');
            $table->decimal('before_pickup_amount', 12, 2)->nullable()->after('before_production_label');
            $table->string('before_pickup_label')->nullable()->after('before_pickup_amount');
        });

        Schema::table('quotations', function (Blueprint $table) {
            $table->decimal('initial_payment_amount', 12, 2)->nullable()->after('total_amount');
            $table->decimal('balance_payment_amount', 12, 2)->nullable()->after('initial_payment_amount');
        });
    }

    public function down(): void
    {
        Schema::table('product_packages', function (Blueprint $table) {
            $table->dropColumn([
                'before_production_amount',
                'before_production_label',
                'before_pickup_amount',
                'before_pickup_label',
            ]);
        });

        Schema::table('quotations', function (Blueprint $table) {
            $table->dropColumn([
                'initial_payment_amount',
                'balance_payment_amount',
            ]);
        });
    }
};
