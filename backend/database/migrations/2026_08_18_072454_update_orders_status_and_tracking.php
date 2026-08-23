<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Widen the status enum to match Figure 6.3 exactly. MySQL doesn't
        // let you ALTER an enum directly with Blueprint, so this uses raw SQL.
        DB::statement("ALTER TABLE orders MODIFY status ENUM(
            'pending', 'approved', 'in_production', 'packed',
            'for_delivery', 'delivered', 'completed', 'cancelled'
        ) DEFAULT 'pending'");

        Schema::table('orders', function (Blueprint $table) {
            // Separate from the existing internal_tracking_number (that's
            // BMANNY's own internal order reference) - these two are
            // specifically about the courier shipment itself.
            $table->string('courier_name', 100)->nullable()->after('internal_tracking_number');
            $table->string('courier_tracking_number', 100)->nullable()->after('courier_name');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['courier_name', 'courier_tracking_number']);
        });

        DB::statement("ALTER TABLE orders MODIFY status ENUM(
            'pending', 'processing', 'completed', 'cancelled'
        ) DEFAULT 'pending'");
    }
};