<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Store reusable client-ready details for each finished product. */
    public function up(): void
    {
        Schema::table('product_types', function (Blueprint $table) {
            $table->string('net_weight', 100)->nullable()->after('description');
            $table->text('packaging_specification')->nullable()->after('net_weight');
            $table->text('label_specification')->nullable()->after('packaging_specification');
        });
    }

    public function down(): void
    {
        Schema::table('product_types', function (Blueprint $table) {
            $table->dropColumn(['net_weight', 'packaging_specification', 'label_specification']);
        });
    }
};
