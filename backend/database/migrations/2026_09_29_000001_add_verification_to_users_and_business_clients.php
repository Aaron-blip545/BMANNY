<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Make phone_number unique on the users table (prevents duplicate accounts)
     * and add verification tracking fields to the business_clients table so we
     * can gate inquiry access.
     */
    public function up(): void
    {
        // ── users ────────────────────────────────────────────────────────────
        Schema::table('users', function (Blueprint $table) {
            // A unique index on phone_number stops duplicate account creation.
            // phone_number is nullable for staff accounts that don't need one,
            // but any customer who provides one must have a unique number.
            $table->unique('phone_number');
        });

        // ── business_clients ─────────────────────────────────────────────────
        Schema::table('business_clients', function (Blueprint $table) {
            // Whether an admin has approved this client's business permit.
            $table->boolean('is_verified')->default(false)->after('profile_pic');

            // Workflow state: not_submitted → pending → approved / rejected
            $table->enum('verification_status', [
                'not_submitted',
                'pending',
                'approved',
                'rejected',
            ])->default('not_submitted')->after('is_verified');

            // Stored path of the uploaded business permit image.
            $table->string('business_permit_path', 255)->nullable()->after('verification_status');

            // Timestamps for the verification lifecycle.
            $table->timestamp('verification_submitted_at')->nullable()->after('business_permit_path');
            $table->timestamp('verification_reviewed_at')->nullable()->after('verification_submitted_at');

            // Optional admin note (reason for rejection, etc.)
            $table->text('verification_notes')->nullable()->after('verification_reviewed_at');
        });
    }

    public function down(): void
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

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['phone_number']);
        });
    }
};
