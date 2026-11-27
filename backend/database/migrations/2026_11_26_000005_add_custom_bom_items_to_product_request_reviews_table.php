<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_request_reviews', function (Blueprint $table) {
            if (! Schema::hasColumn('product_request_reviews', 'custom_bom_items')) {
                $table->json('custom_bom_items')->nullable()->after('response_notes');
            }
        });
    }

    public function down(): void
    {
        Schema::table('product_request_reviews', function (Blueprint $table) {
            if (Schema::hasColumn('product_request_reviews', 'custom_bom_items')) {
                $table->dropColumn('custom_bom_items');
            }
        });
    }
};
