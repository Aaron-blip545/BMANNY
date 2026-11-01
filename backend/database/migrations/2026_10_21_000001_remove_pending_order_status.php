<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Existing orders that predate this workflow now enter fulfillment
        // at the same first stage as newly approved orders.
        DB::table('orders')->where('status', 'pending')->update(['status' => 'approved']);

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE orders MODIFY status ENUM(
                'approved', 'in_production', 'packed', 'for_delivery',
                'delivered', 'completed', 'cancelled'
            ) NOT NULL DEFAULT 'approved'");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE orders MODIFY status ENUM(
                'pending', 'approved', 'in_production', 'packed',
                'for_delivery', 'delivered', 'completed', 'cancelled'
            ) NOT NULL DEFAULT 'pending'");
        }
    }
};
