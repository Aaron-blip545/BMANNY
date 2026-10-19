<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductType;
use App\Models\ProductVariant;
use App\Models\PackagingOption;
use App\Models\CustomizationCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Customer-facing raw materials and customization options inventory (mobile app).
     * Returns raw materials (ingredients), packaging types, and customization options with their rates and stock.
     */
    public function customizationMaterials(): JsonResponse
    {
        $materials = Product::with('category:category_id,name')
            ->orderBy('name')
            ->get()
            ->map(function ($p) {
                $categoryName = $p->category?->name ?? 'Raw Materials';
                $rate = (float) $p->price;
                return [
                    'product_id'      => $p->product_id,
                    'name'            => $p->name,
                    'sku'             => $p->sku,
                    'category'        => $categoryName,
                    'category_id'     => $p->category_id,
                    'price'           => $rate,
                    'rate'            => $rate,
                    'unit_of_measure' => $p->unit_of_measure ?? 'kg',
                    'stock_quantity'  => (float) $p->stock_quantity,
                    'in_stock'        => (float) $p->stock_quantity > 0,
                    'product_image'   => $p->product_image,
                ];
            });

        $flavors = $materials->filter(fn($m) => strtolower($m['category']) === 'flavors')->values();
        $packaging = $materials->filter(fn($m) => str_contains(strtolower($m['category']), 'packaging'))->values();

        $packagingOptions = PackagingOption::where('is_available', true)
            ->orderBy('category')
            ->orderBy('name')
            ->get(['packaging_id', 'name', 'category', 'description', 'is_available']);

        $customizationOptions = CustomizationCatalog::where('is_available', true)
            ->orderBy('name')
            ->get(['customization_id', 'name', 'customization_type', 'description', 'is_available']);

        return response()->json([
            'all'                   => $materials->values(),
            'raw_materials'         => $materials->values(),
            'flavors'               => $flavors,
            'packaging'             => $packaging,
            'packaging_options'     => $packagingOptions,
            'customization_options' => $customizationOptions,
        ]);
    }

    /**
     * Customer-facing product listing (mobile app).
     * Returns all active catalog products so customers see exactly what is in
     * the Product Management catalog, including BOM recipes, packaging, and MOQ.
     */
    public function index(): JsonResponse
    {
        $products = ProductType::where('is_active', true)
            ->with([
                'activeVariants.currentMoq',
                'recipes.rawMaterial',
                'packagingOptions',
                'customizationOptions',
            ])
            ->orderBy('name')
            ->get()
            ->map(function ($product) {
                $basePrice = (float) ($product->suggested_srp ?? 0);
                $code = $product->product_code ?: sprintf('FP-%04d', $product->product_type_id);

                $variant = $product->activeVariants->first();
                $minQty = $variant?->currentMoq?->min_quantity ?? 100;

                $recipes = $product->recipes->map(function ($r) {
                    $mat = $r->rawMaterial;
                    $rate = (float) ($r->rate ?? $mat?->price ?? 0);
                    $qty = (float) $r->quantity_per_unit;
                    $amount = (float) ($r->amount ?: ($qty * $rate));
                    return [
                        'recipe_id'         => $r->recipe_id,
                        'product_id'        => $r->product_id,
                        'raw_material_name' => $mat?->name ?? 'Raw Material',
                        'raw_material_sku'  => $mat?->sku ?? '',
                        'unit_of_measure'   => $mat?->unit_of_measure ?? 'kg',
                        'quantity_per_unit' => $qty,
                        'rate'              => $rate,
                        'amount'            => $amount,
                        'notes'             => $r->notes,
                    ];
                })->values();

                $totalCost = (float) $recipes->sum('amount');

                return [
                    'id'                      => $product->product_type_id,
                    'product_type_id'         => $product->product_type_id,
                    'product_code'            => $code,
                    'name'                    => $product->name,
                    'category'                => $product->category_code ?? 'General',
                    'category_code'           => $product->category_code ?? 'General',
                    'price'                   => '₱' . number_format($basePrice, 2),
                    'base_price'              => $basePrice,
                    'description'             => $product->description ?? '',
                    'shelf_life'              => $product->shelf_life ?? '12 Months',
                    'storage_conditions'      => $product->storage_conditions ?? 'Cool, dry place',
                    'lead_time_days'          => $product->lead_time_days ?? 14,
                    'formulation_notes'       => $product->formulation_notes,
                    'packaging_specification' => $product->packaging_specification,
                    'label_specification'     => $product->label_specification,
                    'net_weight'              => $product->net_weight,
                    'moq'                     => $minQty . ' units',
                    'min_quantity'            => $minQty,
                    'image'                   => $product->image_url,
                    'image_url'               => $product->image_url,
                    'is_active'               => (bool) $product->is_active,
                    'recipes'                 => $recipes,
                    'total_recipe_cost'       => $totalCost,
                    'formatted_recipe_cost'   => '₱' . number_format($totalCost, 2),
                    'packaging_options'       => $product->packagingOptions->map(fn($p) => [
                        'packaging_id' => $p->packaging_id,
                        'name'         => $p->name,
                        'category'     => $p->category,
                        'description'  => $p->description,
                        'is_available' => (bool) $p->is_available,
                    ]),
                    'customization_options'   => $product->customizationOptions->map(fn($c) => [
                        'customization_id'   => $c->customization_id,
                        'name'               => $c->name,
                        'customization_type' => $c->customization_type,
                        'description'        => $c->description,
                        'is_available'       => (bool) $c->is_available,
                    ]),
                    'variants'                => $product->activeVariants->map(fn($v) => [
                        'variant_id'   => $v->variant_id,
                        'name'         => $v->name,
                        'size_value'   => $v->size_value,
                        'size_unit'    => $v->size_unit,
                        'is_available' => (bool) $v->is_available,
                    ]),
                ];
            });

        return response()->json($products);
    }

    /**
     * Customer-facing category listing from product management.
     */
    public function categories(): JsonResponse
    {
        $categories = \App\Models\ProductType::where('is_active', true)
            ->whereNotNull('category_code')
            ->where('category_code', '!=', '')
            ->distinct()
            ->orderBy('category_code')
            ->pluck('category_code')
            ->filter()
            ->values();

        return response()->json($categories);
    }

    /**
     * Store a new product variant (internal, role: product_controller / admin).
     * Kept for API clients if needed; primary CRUD is through the web UI.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_type_id' => 'required|exists:product_types,product_type_id',
            'name'            => 'required|string|max:150',
            'size_value'      => 'nullable|numeric|min:0',
            'size_unit'       => 'nullable|string|max:20',
            'container_type'  => 'nullable|string|max:100',
            'is_available'    => 'boolean',
            'is_published'    => 'boolean',
            'notes'           => 'nullable|string',
        ]);

        $variant = ProductVariant::create($data);

        return response()->json($variant->load('productType'), 201);
    }
}