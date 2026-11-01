<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inquiry_customizations', function (Blueprint $table) {
            $table->string('selected_package', 40)->nullable()->after('customization_type');
            $table->text('requested_ingredient_note')->nullable()->after('formulation_notes');
        });
    }

    public function down(): void
    {
        Schema::table('inquiry_customizations', function (Blueprint $table) {
            $table->dropColumn(['selected_package', 'requested_ingredient_note']);
        });
    }
};
