<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id('variant_id');

            $table->unsignedBigInteger('product_type_id');
            $table->foreign('product_type_id')
                ->references('product_type_id')
                ->on('product_types')
                ->onDelete('cascade');

            $table->string('name', 150);
            $table->decimal('size_value', 8, 2)->nullable();   // e.g. 500
            $table->string('size_unit', 20)->nullable();       // e.g. "ml"
            $table->string('container_type', 100)->nullable(); // e.g. "PET Bottle"
            $table->boolean('is_available')->default(true);    // internal catalog flag
            $table->boolean('is_published')->default(false);   // controls mobile app visibility
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes(); // preserves quotation history
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
