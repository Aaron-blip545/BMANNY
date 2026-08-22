<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add the column Laravel's session guard uses when "Remember me" is set.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->rememberToken()->nullable()->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropRememberToken();
        });
    }
};
