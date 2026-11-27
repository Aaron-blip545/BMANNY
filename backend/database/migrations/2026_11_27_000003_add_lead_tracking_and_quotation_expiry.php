<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inquiries', function (Blueprint $table) {
            if (! Schema::hasColumn('inquiries', 'lost_reason')) {
                $table->string('lost_reason', 100)->nullable()->after('cancellation_reason');
            }
            if (! Schema::hasColumn('inquiries', 'lost_at')) {
                $table->timestamp('lost_at')->nullable()->after('lost_reason');
            }
            if (! Schema::hasColumn('inquiries', 'status_remarks')) {
                $table->text('status_remarks')->nullable()->after('lost_at');
            }
            if (! Schema::hasColumn('inquiries', 'cancelled_by')) {
                $table->unsignedBigInteger('cancelled_by')->nullable()->after('status_remarks');
                $table->foreign('cancelled_by')->references('user_id')->on('users')->nullOnDelete();
            }
        });

        if (! Schema::hasTable('inquiry_status_logs')) {
            Schema::create('inquiry_status_logs', function (Blueprint $table) {
                $table->id('log_id');
                $table->unsignedBigInteger('inquiry_id');
                $table->string('from_status', 40)->nullable();
                $table->string('to_status', 40);
                $table->string('reason', 120)->nullable();
                $table->text('remarks')->nullable();
                $table->unsignedBigInteger('changed_by')->nullable();
                $table->timestamps();

                $table->foreign('inquiry_id')
                    ->references('inquiry_id')
                    ->on('inquiries')
                    ->cascadeOnDelete();

                $table->foreign('changed_by')
                    ->references('user_id')
                    ->on('users')
                    ->nullOnDelete();

                $table->index(['inquiry_id', 'created_at'], 'inquiry_status_logs_inq_idx');
            });
        }

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE quotations MODIFY COLUMN status ENUM('draft','sent','accepted','rejected','expired') NOT NULL DEFAULT 'sent'");
        }

        Schema::table('quotations', function (Blueprint $table) {
            if (! Schema::hasColumn('quotations', 'payment_rejection_reason')) {
                $table->text('payment_rejection_reason')->nullable()->after('payment_submitted_at');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inquiry_status_logs');

        Schema::table('inquiries', function (Blueprint $table) {
            if (Schema::hasColumn('inquiries', 'cancelled_by')) {
                $table->dropForeign(['cancelled_by']);
                $table->dropColumn('cancelled_by');
            }
            foreach (['lost_reason', 'lost_at', 'status_remarks'] as $col) {
                if (Schema::hasColumn('inquiries', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('quotations', function (Blueprint $table) {
            if (Schema::hasColumn('quotations', 'payment_rejection_reason')) {
                $table->dropColumn('payment_rejection_reason');
            }
        });
    }
};
