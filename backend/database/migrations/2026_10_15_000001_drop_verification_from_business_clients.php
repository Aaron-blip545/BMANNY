<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Remove the verification module columns from the business_clients table.
     */
    public function up(): void
    {
        Schema::table('business_clients', function (Blueprint $table) {
            $table->dropColumn([
                'is_verified',
                'verification_status',
                'business_permit_path',
                'verification_submitted_at',
                'verification_reviewed_at',
                'verification_notes',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('business_clients', function (Blueprint $table) {
            $table->boolean('is_verified')->default(false)->after('profile_pic');
            $table->enum('verification_status', [
                'not_submitted',
                'pending',
                'approved',
                'rejected',
            ])->default('not_submitted')->after('is_verified');
            $table->string('business_permit_path', 255)->nullable()->after('verification_status');
            $table->timestamp('verification_submitted_at')->nullable()->after('business_permit_path');
            $table->timestamp('verification_reviewed_at')->nullable()->after('verification_submitted_at');
            $table->text('verification_notes')->nullable()->after('verification_reviewed_at');
        });
    }
};
