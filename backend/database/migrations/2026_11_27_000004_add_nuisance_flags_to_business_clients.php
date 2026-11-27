<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_clients', function (Blueprint $table) {
            if (! Schema::hasColumn('business_clients', 'is_flagged_nuisance')) {
                $table->boolean('is_flagged_nuisance')->default(false)->after('profile_pic');
            }
            if (! Schema::hasColumn('business_clients', 'nuisance_strikes')) {
                $table->unsignedInteger('nuisance_strikes')->default(0)->after('is_flagged_nuisance');
            }
            if (! Schema::hasColumn('business_clients', 'nuisance_reason')) {
                $table->text('nuisance_reason')->nullable()->after('nuisance_strikes');
            }
            if (! Schema::hasColumn('business_clients', 'nuisance_flagged_at')) {
                $table->timestamp('nuisance_flagged_at')->nullable()->after('nuisance_reason');
            }
            if (! Schema::hasColumn('business_clients', 'nuisance_flagged_by')) {
                $table->unsignedBigInteger('nuisance_flagged_by')->nullable()->after('nuisance_flagged_at');
                $table->foreign('nuisance_flagged_by')->references('user_id')->on('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('business_clients', function (Blueprint $table) {
            if (Schema::hasColumn('business_clients', 'nuisance_flagged_by')) {
                $table->dropForeign(['nuisance_flagged_by']);
                $table->dropColumn('nuisance_flagged_by');
            }
            foreach (['is_flagged_nuisance', 'nuisance_strikes', 'nuisance_reason', 'nuisance_flagged_at'] as $col) {
                if (Schema::hasColumn('business_clients', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
