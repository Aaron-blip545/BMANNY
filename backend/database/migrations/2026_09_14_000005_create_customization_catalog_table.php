<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customization_catalog', function (Blueprint $table) {
            $table->id('customization_id');
            $table->string('name', 150);
            $table->string('customization_type', 100)->nullable(); // e.g. "label", "print"
            $table->text('description')->nullable();
            $table->boolean('is_available')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customization_catalog');
    }
};
