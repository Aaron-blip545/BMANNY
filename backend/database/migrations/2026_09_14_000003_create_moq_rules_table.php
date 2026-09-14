<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('moq_rules', function (Blueprint $table) {
            $table->id('moq_rule_id');

            $table->unsignedBigInteger('variant_id');
            $table->foreign('variant_id')
                ->references('variant_id')
                ->on('product_variants')
                ->onDelete('cascade');

            $table->unsignedInteger('min_quantity');
            $table->date('effective_date');
            $table->text('notes')->nullable();

            // Track who set this MOQ
            $table->unsignedBigInteger('created_by')->nullable();
            $table->foreign('created_by')
                ->references('user_id')
                ->on('users')
                ->onDelete('set null');

            $table->timestamps();
            $table->softDeletes(); // audit trail — don't lose MOQ history
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('moq_rules');
    }
};
