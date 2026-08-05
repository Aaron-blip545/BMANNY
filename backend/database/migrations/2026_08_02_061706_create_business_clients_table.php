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
        Schema::create('business_clients', function (Blueprint $table) {
        $table->id('client_id');
        $table->foreignId('user_id')->references('user_id')->on('users')->onDelete('cascade');
        $table->string('business_name', 150);
        $table->string('business_type', 100);
        $table->string('contact_person', 100);
        $table->text('business_address');
        $table->string('profile_pic', 255)->nullable();
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_clients');
    }
};
