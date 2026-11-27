<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_recipes', function (Blueprint $table) {
            if (! Schema::hasColumn('product_recipes', 'package_slug')) {
                $table->string('package_slug', 40)->nullable()->after('product_type_id')->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('product_recipes', function (Blueprint $table) {
            if (Schema::hasColumn('product_recipes', 'package_slug')) {
                $table->dropColumn('package_slug');
            }
        });
    }
};
