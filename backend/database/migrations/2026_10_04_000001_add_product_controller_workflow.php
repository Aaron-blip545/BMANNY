<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('packaging_options', function (Blueprint $table) {
            $table->string('category', 30)->default('Other')->after('name');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->string('sku', 80)->nullable()->unique()->after('name');
        });

        DB::table('product_variants')->orderBy('variant_id')->each(function (object $variant) {
            DB::table('product_variants')->where('variant_id', $variant->variant_id)->update([
                'sku' => sprintf('BMN-%04d-%04d', $variant->product_type_id, $variant->variant_id),
            ]);
        });

        Schema::create('product_packaging_options', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_type_id');
            $table->unsignedBigInteger('packaging_id');
            $table->timestamps();

            $table->foreign('product_type_id')->references('product_type_id')->on('product_types')->cascadeOnDelete();
            $table->foreign('packaging_id')->references('packaging_id')->on('packaging_options')->cascadeOnDelete();
            $table->unique(['product_type_id', 'packaging_id'], 'product_packaging_unique');
        });

        Schema::create('product_customization_options', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_type_id');
            $table->unsignedBigInteger('customization_id');
            $table->timestamps();

            $table->foreign('product_type_id')->references('product_type_id')->on('product_types')->cascadeOnDelete();
            $table->foreign('customization_id')->references('customization_id')->on('customization_catalog')->cascadeOnDelete();
            $table->unique(['product_type_id', 'customization_id'], 'product_customization_unique');
        });

        Schema::create('product_request_reviews', function (Blueprint $table) {
            $table->id('product_request_review_id');
            $table->unsignedBigInteger('inquiry_id')->unique();
            $table->unsignedBigInteger('requested_by')->nullable();
            $table->unsignedBigInteger('product_type_id')->nullable();
            $table->unsignedBigInteger('requested_variant_id')->nullable();
            $table->unsignedBigInteger('suggested_variant_id')->nullable();
            $table->unsignedBigInteger('suggested_packaging_id')->nullable();
            $table->enum('status', ['pending', 'available', 'alternative', 'unavailable'])->default('pending');
            $table->text('request_notes')->nullable();
            $table->text('response_notes')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->foreign('inquiry_id')->references('inquiry_id')->on('inquiries')->cascadeOnDelete();
            $table->foreign('requested_by')->references('user_id')->on('users')->nullOnDelete();
            $table->foreign('product_type_id')->references('product_type_id')->on('product_types')->nullOnDelete();
            $table->foreign('requested_variant_id')->references('variant_id')->on('product_variants')->nullOnDelete();
            $table->foreign('suggested_variant_id')->references('variant_id')->on('product_variants')->nullOnDelete();
            $table->foreign('suggested_packaging_id')->references('packaging_id')->on('packaging_options')->nullOnDelete();
            $table->foreign('reviewed_by')->references('user_id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_request_reviews');
        Schema::dropIfExists('product_customization_options');
        Schema::dropIfExists('product_packaging_options');

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropUnique(['sku']);
            $table->dropColumn('sku');
        });

        Schema::table('packaging_options', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }
};
