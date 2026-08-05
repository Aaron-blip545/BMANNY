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
        Schema::create('inquiry_customizations', function (Blueprint $table) {
        $table->id('customization_id');
        
        // 1. Link back to the parent Inquiry
        $table->unsignedBigInteger('inquiry_id');
        $table->foreign('inquiry_id')->references('inquiry_id')->on('inquiries')->onDelete('cascade');
        
        // 2. Capture the Rebranding Details
        $table->string('customization_type', 100); // e.g., 'Screen Print', 'Embroidery'
        $table->string('placement', 100)->nullable(); // e.g., 'Left Chest', 'Full Back'
        $table->string('design_file_path', 255)->nullable(); // For saving uploaded logo files
        $table->text('client_notes')->nullable(); // Specific instructions from the app
        
        $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inquiry_customizations');
    }
};
