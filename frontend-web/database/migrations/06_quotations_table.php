<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inquiry_id')
                ->constrained('inquiries')
                ->cascadeOnDelete();
            $table->unsignedTinyInteger('version')->default(1);
            $table->boolean('is_active')->default(true);
            $table->foreignId('prepared_by')
                ->constrained('users')
                ->restrictOnDelete();
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 12, 2);
            $table->unsignedInteger('minimum_order_quantity');
            $table->text('quotation_notes')->nullable();
            $table->date('valid_until');
            $table->enum('quotation_status', [
                'draft',
                'sent',
                'accepted',
                'rejected',
                'expired',
            ])->default('draft');
            $table->dateTime('sent_at')->nullable();
            $table->timestamps();

            $table->index('inquiry_id');
            $table->index('quotation_status');
            $table->unique(['inquiry_id', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotations');
    }
};
