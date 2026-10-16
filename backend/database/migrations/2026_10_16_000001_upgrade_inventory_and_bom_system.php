<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * MySQL DDL is not transactional. These guards allow this migration to
     * resume safely if a previous run added some columns before failing.
     */
    public function up(): void
    {
        if (Schema::hasColumn('products', 'stock_quantity')) {
            Schema::table('products', function (Blueprint $table) {
                $table->decimal('stock_quantity', 14, 4)->default(0)->change();
            });
        }

        if (! Schema::hasColumn('products', 'reorder_level')) {
            Schema::table('products', function (Blueprint $table) {
                $table->decimal('reorder_level', 14, 4)->default(0)->after('stock_quantity');
            });
        }

        if (! Schema::hasColumn('products', 'unit_of_measure')) {
            Schema::table('products', function (Blueprint $table) {
                $table->string('unit_of_measure', 20)->default('kg')->after('reorder_level');
            });
        }

        if (! Schema::hasColumn('product_types', 'product_code')) {
            Schema::table('product_types', function (Blueprint $table) {
                $table->string('product_code', 50)->nullable()->after('product_type_id');
            });
        }

        if (! Schema::hasColumn('product_types', 'category_code')) {
            Schema::table('product_types', function (Blueprint $table) {
                $table->string('category_code', 50)->nullable()->after('name');
            });
        }

        if (! Schema::hasColumn('product_types', 'suggested_srp')) {
            Schema::table('product_types', function (Blueprint $table) {
                $table->decimal('suggested_srp', 10, 2)->default(0)->after('category_code');
            });
        }

        if (! Schema::hasColumn('product_types', 'shelf_life')) {
            Schema::table('product_types', function (Blueprint $table) {
                $table->string('shelf_life', 100)->nullable()->after('suggested_srp');
            });
        }

        if (! Schema::hasColumn('product_types', 'storage_conditions')) {
            Schema::table('product_types', function (Blueprint $table) {
                $table->string('storage_conditions', 200)->nullable()->after('shelf_life');
            });
        }

        if (! Schema::hasColumn('product_types', 'lead_time_days')) {
            Schema::table('product_types', function (Blueprint $table) {
                $table->integer('lead_time_days')->nullable()->after('storage_conditions');
            });
        }

        if (! Schema::hasColumn('product_types', 'formulation_notes')) {
            Schema::table('product_types', function (Blueprint $table) {
                $table->text('formulation_notes')->nullable()->after('lead_time_days');
            });
        }

        if (! $this->hasIndex('product_types', 'product_types_product_code_unique')) {
            Schema::table('product_types', function (Blueprint $table) {
                $table->unique('product_code', 'product_types_product_code_unique');
            });
        }

        if (! Schema::hasTable('product_recipes')) {
            Schema::create('product_recipes', function (Blueprint $table) {
                $table->id('recipe_id');
                $table->unsignedBigInteger('product_type_id');
                $table->unsignedBigInteger('product_id');
                $table->decimal('quantity_per_unit', 14, 6)->comment('Amount needed for 1 unit of finished product');
                $table->decimal('rate', 10, 2)->default(0)->comment('Cost rate per unit of measure in PHP');
                $table->decimal('amount', 10, 2)->default(0)->comment('Calculated cost: quantity * rate');
                $table->string('notes', 255)->nullable();
                $table->timestamps();

                $table->foreign('product_type_id')->references('product_type_id')->on('product_types')->cascadeOnDelete();
                $table->foreign('product_id')->references('product_id')->on('products')->cascadeOnDelete();
                $table->unique(['product_type_id', 'product_id'], 'recipe_product_unique');
            });
        }
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        foreach (Schema::getIndexes($table) as $index) {
            if (($index['name'] ?? null) === $indexName) {
                return true;
            }
        }

        return false;
    }

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
