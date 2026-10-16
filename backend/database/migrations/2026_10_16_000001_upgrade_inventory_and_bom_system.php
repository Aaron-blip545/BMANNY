<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Upgrade products table to represent Raw Materials with decimal stock & reorder levels
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('stock_quantity', 14, 4)->default(0)->change();
            if (!Schema::hasColumn('products', 'reorder_level')) {
                $table->decimal('reorder_level', 14, 4)->default(0)->after('stock_quantity');
            }
            if (!Schema::hasColumn('products', 'unit_of_measure')) {
                $table->string('unit_of_measure', 20)->default('kg')->after('reorder_level');
            }
        });

        // 2. Add catalog details and product_code (FP-xxxx) to product_types (Finished Products)
        $productTypeColsToAdd = [];
        foreach (['product_code', 'category_code', 'suggested_srp', 'shelf_life', 'storage_conditions', 'lead_time_days', 'formulation_notes'] as $col) {
            if (!Schema::hasColumn('product_types', $col)) {
                $productTypeColsToAdd[] = $col;
            }
        }

        if (!empty($productTypeColsToAdd)) {
            Schema::table('product_types', function (Blueprint $table) use ($productTypeColsToAdd) {
                if (in_array('product_code', $productTypeColsToAdd)) {
                    $table->string('product_code', 50)->nullable()->unique()->after('product_type_id');
                }
                if (in_array('category_code', $productTypeColsToAdd)) {
                    $table->string('category_code', 50)->nullable()->after('name');
                }
                if (in_array('suggested_srp', $productTypeColsToAdd)) {
                    $table->decimal('suggested_srp', 10, 2)->default(0)->after('category_code');
                }
                if (in_array('shelf_life', $productTypeColsToAdd)) {
                    $table->string('shelf_life', 100)->nullable()->after('suggested_srp');
                }
                if (in_array('storage_conditions', $productTypeColsToAdd)) {
                    $table->string('storage_conditions', 200)->nullable()->after('shelf_life');
                }
                if (in_array('lead_time_days', $productTypeColsToAdd)) {
                    $table->integer('lead_time_days')->nullable()->after('storage_conditions');
                }
                if (in_array('formulation_notes', $productTypeColsToAdd)) {
                    $table->text('formulation_notes')->nullable()->after('lead_time_days');
                }
            });
        }

        // 3. Create product_recipes (Bill of Materials / Composite Items)
        // Links Finished Product (ProductType) to Raw Materials (Product)
        Schema::create('product_recipes', function (Blueprint $table) {
            $table->id('recipe_id');
            $table->unsignedBigInteger('product_type_id');
            $table->unsignedBigInteger('product_id'); // Raw Material from products table
            $table->decimal('quantity_per_unit', 14, 6)->comment('Amount needed for 1 unit of finished product');
            $table->decimal('rate', 10, 2)->default(0)->comment('Cost rate per unit of measure in PHP');
            $table->decimal('amount', 10, 2)->default(0)->comment('Calculated cost: quantity * rate');
            $table->string('notes', 255)->nullable();
            $table->timestamps();

            $table->foreign('product_type_id')
                ->references('product_type_id')
                ->on('product_types')
                ->cascadeOnDelete();

            $table->foreign('product_id')
                ->references('product_id')
                ->on('products')
                ->cascadeOnDelete();

            $table->unique(['product_type_id', 'product_id'], 'recipe_product_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_recipes');

        if (Schema::hasColumn('product_types', 'product_code')) {
            Schema::table('product_types', function (Blueprint $table) {
                $table->dropColumn('product_code');
            });
        }

        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'unit_of_measure')) {
                $table->dropColumn('unit_of_measure');
            }
            if (Schema::hasColumn('products', 'reorder_level')) {
                $table->dropColumn('reorder_level');
            }
            $table->integer('stock_quantity')->default(0)->change();
        });
    }
};
