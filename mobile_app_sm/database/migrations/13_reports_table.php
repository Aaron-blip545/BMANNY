<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('generated_by')
                ->constrained('users')
                ->restrictOnDelete();
            $table->enum('report_type', [
                'inquiry',
                'quotation',
                'sales_performance',
                'product_demand',
                'order_status',
            ]);
            $table->date('date_from');
            $table->date('date_to');
            $table->json('report_data')->nullable();
            $table->dateTime('generated_at');

            $table->index('generated_by');
            $table->index('report_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
