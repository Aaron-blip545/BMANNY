<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Replace the original limited enum with the lead stages defined in
        // the capstone paper. Existing records are mapped immediately below.
        Schema::table('inquiries', function (Blueprint $table) {
            $table->string('status', 32)->default('new')->change();
        });

        DB::table('inquiries')->where('status', 'pending')->update(['status' => 'new']);
        DB::table('inquiries')->where('status', 'reviewed')->update(['status' => 'for_quotation']);
        DB::table('inquiries')->where('status', 'responded')->update(['status' => 'quotation_sent']);

        Schema::table('inquiry_followups', function (Blueprint $table) {
            $table->foreignId('inquiry_id')->nullable()->after('id')->constrained('inquiries', 'inquiry_id')->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->after('inquiry_id')->constrained('users', 'user_id')->nullOnDelete();
            $table->date('follow_up_date')->nullable()->after('created_by');
            $table->text('note')->nullable()->after('follow_up_date');
            $table->timestamp('completed_at')->nullable()->after('note');
            $table->text('completion_note')->nullable()->after('completed_at');
            $table->timestamp('reminded_at')->nullable()->after('completion_note');
            $table->index(['inquiry_id', 'follow_up_date']);
        });
    }

    public function down(): void
    {
        Schema::table('inquiry_followups', function (Blueprint $table) {
            $table->dropIndex(['inquiry_id', 'follow_up_date']);
            $table->dropConstrainedForeignId('created_by');
            $table->dropConstrainedForeignId('inquiry_id');
            $table->dropColumn(['follow_up_date', 'note', 'completed_at', 'completion_note', 'reminded_at']);
        });

        DB::table('inquiries')->where('status', 'new')->update(['status' => 'pending']);
        DB::table('inquiries')->where('status', 'for_quotation')->update(['status' => 'reviewed']);
        DB::table('inquiries')->where('status', 'quotation_sent')->update(['status' => 'responded']);
        DB::table('inquiries')->where('status', 'follow_up')->update(['status' => 'pending']);
        DB::table('inquiries')->where('status', 'converted')->update(['status' => 'responded']);

        Schema::table('inquiries', function (Blueprint $table) {
            $table->enum('status', ['pending', 'reviewed', 'responded', 'closed'])->default('pending')->change();
        });
    }
};
