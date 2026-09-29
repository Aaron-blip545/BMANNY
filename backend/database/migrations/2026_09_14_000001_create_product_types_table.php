<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_types', function (Blueprint $table) {
            $table->id('product_type_id');
            $table->string('name', 150)->unique();
            $table->string('category_code', 50)->nullable();
            $table->decimal('suggested_srp', 10, 2)->nullable();
            $table->text('description')->nullable();
            $table->string('shelf_life', 100)->nullable();
            $table->string('storage_conditions', 200)->nullable();
            $table->integer('lead_time_days')->nullable()->default(14);
            $table->text('formulation_notes')->nullable();
            $table->string('image_url', 500)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_types');
    }
};
