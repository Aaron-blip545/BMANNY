<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inquiry_customizations', function (Blueprint $table) {
            // Drop old apparel columns if present
            if (Schema::hasColumn('inquiry_customizations', 'placement')) {
                $table->dropColumn(['placement']);
            }

            // Add BMANNY Toll Manufacturing Customization Specs
            $table->string('packaging_type')->nullable()->after('inquiry_id'); // e.g., Sachet, Stand-up Pouch, Bottle, Box
            $table->string('packaging_finish')->nullable()->after('packaging_type'); // e.g., Matte, Glossy, Metallic, Foil
            $table->string('serving_size')->nullable()->after('packaging_finish'); // e.g., 10g x 10 sachets per box
            $table->text('formulation_notes')->nullable()->after('serving_size'); // Special ingredient/sweetener notes
        });
    }

    public function down(): void
    {
        Schema::table('inquiry_customizations', function (Blueprint $table) {
            $table->dropColumn(['packaging_type', 'packaging_finish', 'serving_size', 'formulation_notes']);
        });
    }
};