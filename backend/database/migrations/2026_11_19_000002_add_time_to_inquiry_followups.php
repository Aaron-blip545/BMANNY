<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inquiry_followups', function (Blueprint $table) {
            $table->dateTime('follow_up_date')->change();
        });
    }

    public function down(): void
    {
        Schema::table('inquiry_followups', function (Blueprint $table) {
            $table->date('follow_up_date')->change();
        });
    }
};
