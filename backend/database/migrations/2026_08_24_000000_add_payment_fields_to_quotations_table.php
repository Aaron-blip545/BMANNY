<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adds the fields needed for the "customer pays before the sales agent
     * accepts" flow:
     *
     *   quotation sent -> customer submits payment proof -> sales agent
     *   reviews it -> sales agent accepts (creates the Order).
     *
     * We deliberately don't add a new `status` enum value for this. The
     * quotation stays `sent` the whole time the client is expected to pay;
     * `payment_submitted_at` (set once the client uploads proof) is what
     * gates the "Accept & Create Order" action in the Sales Agent portal.
     */
    public function up(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->string('payment_method', 20)->nullable()->after('status');
            $table->string('payment_proof_path')->nullable()->after('payment_method');
            $table->timestamp('payment_submitted_at')->nullable()->after('payment_proof_path');
        });
    }

    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'payment_proof_path', 'payment_submitted_at']);
        });
    }
};
