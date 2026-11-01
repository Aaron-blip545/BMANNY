<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('initial_payment_amount', 12, 2)->nullable()->after('total_amount');
            $table->timestamp('initial_payment_verified_at')->nullable()->after('initial_payment_amount');
            $table->decimal('balance_payment_amount', 12, 2)->nullable()->after('initial_payment_verified_at');
            $table->string('balance_payment_method', 20)->nullable()->after('balance_payment_amount');
            $table->string('balance_payment_proof_path')->nullable()->after('balance_payment_method');
            $table->timestamp('balance_payment_submitted_at')->nullable()->after('balance_payment_proof_path');
            $table->timestamp('balance_payment_verified_at')->nullable()->after('balance_payment_submitted_at');
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE orders MODIFY status ENUM('pending','approved','in_production','packed','ready_for_pickup','for_delivery','delivered','completed','cancelled') DEFAULT 'pending'");
        }
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['initial_payment_amount', 'initial_payment_verified_at', 'balance_payment_amount', 'balance_payment_method', 'balance_payment_proof_path', 'balance_payment_submitted_at', 'balance_payment_verified_at']);
        });
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE orders MODIFY status ENUM('pending','approved','in_production','packed','for_delivery','delivered','completed','cancelled') DEFAULT 'pending'");
        }
    }
};
