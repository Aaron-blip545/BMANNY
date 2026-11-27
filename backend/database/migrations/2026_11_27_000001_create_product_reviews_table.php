<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('product_reviews')) {
            Schema::create('product_reviews', function (Blueprint $table) {
                $table->id('product_review_id');
                $table->unsignedBigInteger('product_type_id')->index();
                $table->unsignedBigInteger('user_id')->index();
                $table->string('author_name', 120);
                $table->unsignedTinyInteger('rating');
                $table->text('comment');
                $table->json('photos')->nullable();
                $table->timestamps();

                $table->foreign('product_type_id')
                    ->references('product_type_id')
                    ->on('product_types')
                    ->onDelete('cascade');

                $table->foreign('user_id')
                    ->references('user_id')
                    ->on('users')
                    ->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('product_reviews');
    }
};
