<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('approved','in_production','packed','ready_for_pickup','for_delivery','delivered','completed','cancelled') NOT NULL DEFAULT 'approved'");
        }

        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'priority')) {
                $table->string('priority', 20)->default('normal')->after('status');
            }
            if (! Schema::hasColumn('orders', 'estimated_completion_date')) {
                $table->date('estimated_completion_date')->nullable()->after('priority');
            }
            if (! Schema::hasColumn('orders', 'estimated_delivery_date')) {
                $table->date('estimated_delivery_date')->nullable()->after('estimated_completion_date');
            }
            if (! Schema::hasColumn('orders', 'production_started_at')) {
                $table->timestamp('production_started_at')->nullable()->after('estimated_delivery_date');
            }
            if (! Schema::hasColumn('orders', 'packed_at')) {
                $table->timestamp('packed_at')->nullable()->after('production_started_at');
            }
            if (! Schema::hasColumn('orders', 'ready_for_pickup_at')) {
                $table->timestamp('ready_for_pickup_at')->nullable()->after('packed_at');
            }
            if (! Schema::hasColumn('orders', 'dispatched_at')) {
                $table->timestamp('dispatched_at')->nullable()->after('ready_for_pickup_at');
            }
            if (! Schema::hasColumn('orders', 'delivered_at')) {
                $table->timestamp('delivered_at')->nullable()->after('dispatched_at');
            }
            if (! Schema::hasColumn('orders', 'completed_at')) {
                $table->timestamp('completed_at')->nullable()->after('delivered_at');
            }
        });

        if (! Schema::hasTable('production_schedules')) {
            Schema::create('production_schedules', function (Blueprint $table) {
                $table->id('schedule_id');
                $table->unsignedBigInteger('order_id');
                $table->string('batch_code', 40)->nullable();
                $table->date('production_start_date');
                $table->date('target_end_date');
                $table->date('actual_start_date')->nullable();
                $table->date('actual_end_date')->nullable();
                $table->unsignedInteger('planned_quantity')->default(0);
                $table->unsignedInteger('daily_capacity_units')->default(500);
                $table->string('priority', 20)->default('normal'); // normal, high, rush
                $table->string('production_status', 30)->default('scheduled'); // scheduled, in_progress, completed, delayed, cancelled
                $table->text('production_notes')->nullable();
                $table->unsignedBigInteger('scheduled_by')->nullable();
                $table->timestamps();

                $table->foreign('order_id')
                    ->references('order_id')
                    ->on('orders')
                    ->cascadeOnDelete();

                $table->foreign('scheduled_by')
                    ->references('user_id')
                    ->on('users')
                    ->nullOnDelete();

                $table->index(['production_start_date', 'target_end_date'], 'prod_sched_dates_idx');
                $table->index(['production_status', 'priority'], 'prod_sched_status_priority_idx');
            });
        }

        if (! Schema::hasTable('delivery_batches')) {
            Schema::create('delivery_batches', function (Blueprint $table) {
                $table->id('batch_id');
                $table->unsignedBigInteger('order_id');
                $table->unsignedInteger('batch_number')->default(1);
                $table->unsignedInteger('quantity')->default(0);
                $table->string('fulfillment_type', 20)->default('delivery'); // delivery, pickup
                $table->string('delivery_status', 30)->default('scheduled'); // scheduled, packed, ready_for_pickup, for_delivery, delivered, cancelled
                $table->date('scheduled_date')->nullable();
                $table->timestamp('dispatched_at')->nullable();
                $table->timestamp('delivered_at')->nullable();
                $table->string('courier_name', 100)->nullable();
                $table->string('tracking_number', 100)->nullable();
                $table->text('remarks')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->timestamps();

                $table->foreign('order_id')
                    ->references('order_id')
                    ->on('orders')
                    ->cascadeOnDelete();

                $table->foreign('updated_by')
                    ->references('user_id')
                    ->on('users')
                    ->nullOnDelete();

                $table->index(['order_id', 'batch_number'], 'delivery_batches_order_num_idx');
                $table->index('delivery_status', 'delivery_batches_status_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_batches');
        Schema::dropIfExists('production_schedules');

        Schema::table('orders', function (Blueprint $table) {
            $cols = [
                'priority',
                'estimated_completion_date',
                'estimated_delivery_date',
                'production_started_at',
                'packed_at',
                'ready_for_pickup_at',
                'dispatched_at',
                'delivered_at',
                'completed_at',
            ];
            foreach ($cols as $col) {
                if (Schema::hasColumn('orders', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
