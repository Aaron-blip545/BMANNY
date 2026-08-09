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
       Schema::create('quotations', function (Blueprint $table) {
        $table->id('quotation_id');
        $table->foreignId('inquiry_id')->references('inquiry_id')->on('inquiries')->onDelete('cascade');
        $table->decimal('total_amount', 10, 2);
        // FIXED: was required, but QuotationController::store() never sets
        // this - saving a quotation would fail with a "cannot be null" error.
        // Nullable for now; populate it once the line-item UI is built.
        $table->text('item_details')->nullable();
        $table->enum('status', ['draft', 'sent', 'accepted', 'rejected'])->default('draft');
        $table->date('valid_until')->nullable();
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotations');
    }
};
