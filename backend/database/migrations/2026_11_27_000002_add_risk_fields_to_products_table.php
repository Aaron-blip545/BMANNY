<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'batch_lot_number')) {
                $table->string('batch_lot_number', 80)->nullable()->after('sku');
            }
            if (! Schema::hasColumn('products', 'max_stock_level')) {
                $table->decimal('max_stock_level', 14, 4)->nullable()->after('reorder_level');
            }
            if (! Schema::hasColumn('products', 'expiration_date')) {
                $table->date('expiration_date')->nullable()->after('unit_of_measure');
            }
            if (! Schema::hasColumn('products', 'restock_lead_days')) {
                $table->unsignedInteger('restock_lead_days')->default(7)->after('expiration_date');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            foreach (['batch_lot_number', 'max_stock_level', 'expiration_date', 'restock_lead_days'] as $col) {
                if (Schema::hasColumn('products', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
