<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('product_packages', function (Blueprint $table) {
            $table->text('public_ingredients')->nullable()->after('payment_terms');
            $table->json('cost_breakdown')->nullable()->after('public_ingredients');
            $table->text('package_notes')->nullable()->after('cost_breakdown');
        });
    }

    public function down(): void {
        Schema::table('product_packages', function (Blueprint $table) {
            $table->dropColumn(['public_ingredients', 'cost_breakdown', 'package_notes']);
        });
    }
};
