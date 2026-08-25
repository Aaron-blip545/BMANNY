<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Lets a customer cancel their own inquiry from the mobile app, but
     * only before it's been quoted. Rather than overloading the existing
     * `closed` status (which could mean several different things - quoted
     * and fulfilled, no longer relevant, etc), this records exactly when
     * (and that) the customer cancelled it, so both the mobile app and the
     * Sales Agent portal can show "Cancelled" unambiguously.
     */
    public function up(): void
    {
        Schema::table('inquiries', function (Blueprint $table) {
            $table->timestamp('cancelled_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('inquiries', function (Blueprint $table) {
            $table->dropColumn('cancelled_at');
        });
    }
};
