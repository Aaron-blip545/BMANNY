<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
       Schema::create('products', function (Blueprint $table) {
            $table->id('product_id');
            
            // 1. Explicitly create the integer column first
            $table->unsignedBigInteger('category_id')->nullable();
            
            // 2. Manually link it to the categories table
            $table->foreign('category_id')->references('category_id')->on('categories')->onDelete('set null');
            
            $table->string('sku', 50)->unique();
            $table->string('name', 200);
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->integer('stock_quantity')->default(0);
            $table->string('product_image', 255)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
