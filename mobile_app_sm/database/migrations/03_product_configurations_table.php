<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_configurations', function (Blueprint $table) {
            $table->id();
            $table->string('product_type', 150);
            $table->string('flavor_variant', 100)->nullable();
            $table->string('size_option', 100)->nullable();
            $table->string('packaging_type', 100)->nullable();
            $table->string('container_type', 100)->nullable();
            $table->json('customization_options')->nullable();
            $table->unsignedInteger('minimum_order_quantity')->default(1);
            $table->boolean('is_available')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('product_type');
            $table->index('is_available');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_configurations');
    }
};
