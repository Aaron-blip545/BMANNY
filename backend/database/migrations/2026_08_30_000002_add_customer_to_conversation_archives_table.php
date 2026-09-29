<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversation_archives', function (Blueprint $table) {
            $table->foreignId('customer_user_id')
                ->nullable()
                ->after('user_id')
                ->constrained('users', 'user_id')
                ->cascadeOnDelete();
            $table->index(['user_id', 'customer_user_id']);
        });

        // Preserve existing archive records while converting their scope
        // from one inquiry to the entire customer conversation.
        if (DB::table('conversation_archives')->exists()) {
            $archives = DB::table('conversation_archives')
                ->join('inquiries', 'conversation_archives.inquiry_id', '=', 'inquiries.inquiry_id')
                ->join('business_clients', 'inquiries.client_id', '=', 'business_clients.client_id')
                ->select('conversation_archives.id', 'business_clients.user_id')
                ->get();

            foreach ($archives as $arch) {
                DB::table('conversation_archives')
                    ->where('id', $arch->id)
                    ->update(['customer_user_id' => $arch->user_id]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('conversation_archives', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'customer_user_id']);
            $table->dropConstrainedForeignId('customer_user_id');
        });
    }
};
