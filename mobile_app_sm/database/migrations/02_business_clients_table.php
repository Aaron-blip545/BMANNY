<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('business_name', 150);
            $table->string('business_type', 100)->nullable();
            $table->string('contact_person', 100)->nullable();
            $table->text('business_address')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('business_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_clients');
    }
};
