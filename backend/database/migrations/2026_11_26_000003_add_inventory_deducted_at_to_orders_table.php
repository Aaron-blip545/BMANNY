<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'inventory_deducted_at')) {
                $table->timestamp('inventory_deducted_at')->nullable()->after('initial_payment_verified_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'inventory_deducted_at')) {
                $table->dropColumn('inventory_deducted_at');
            }
        });
    }
};
