<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Save the approved product details as they were when a quote was sent. */
    public function up(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->json('product_specification')->nullable()->after('item_details');
        });
    }

    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->dropColumn('product_specification');
        });
    }
};
