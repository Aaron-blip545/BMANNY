<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add a unique registration number to each user account (prevents
     * duplicate accounts) and verification tracking fields to the
     * business_clients table so we can gate inquiry access.
     */
    public function up(): void
    {
        // ── users ────────────────────────────────────────────────────────────
        Schema::table('users', function (Blueprint $table) {
            // Unique human-readable number shown on the user's profile,
            // e.g.  BMN-20260929-A3F7X.  Generated on registration.
            $table->string('registration_number', 30)->nullable()->unique()->after('phone_number');
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
            $table->dropColumn('registration_number');
        });
    }
};
