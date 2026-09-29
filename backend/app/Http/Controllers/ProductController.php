<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Customer-facing raw materials and customization options inventory (mobile app).
     * Returns all flavors and packaging types with their real-time stock counts.
     */
    public function customizationMaterials(): JsonResponse
    {
        $materials = Product::with('category:category_id,name')
            ->orderBy('name')
            ->get()
            ->map(function ($p) {
                $categoryName = $p->category?->name ?? 'Uncategorized';
                return [
                    'product_id'     => $p->product_id,
                    'name'           => $p->name,
                    'sku'            => $p->sku,
                    'category'       => $categoryName,
                    'category_id'    => $p->category_id,
                    'price'          => (float) $p->price,
                    'stock_quantity' => (int) $p->stock_quantity,
                    'in_stock'       => (int) $p->stock_quantity > 0,
                    'product_image'  => $p->product_image,
                ];
            });

        $flavors = $materials->filter(fn($m) => strtolower($m['category']) === 'flavors')->values();
        $packaging = $materials->filter(fn($m) => str_contains(strtolower($m['category']), 'packaging'))->values();

        return response()->json([
            'all'       => $materials->values(),
            'flavors'   => $flavors,
            'packaging' => $packaging,
        ]);
    }

    /**
     * Customer-facing product listing (mobile app).
     * Returns all active catalog products so customers see exactly what is in
     * the Product Management catalog.
     */
    public function index(): JsonResponse
    {
        $products = \App\Models\ProductType::where('is_active', true)
            ->with(['activeVariants'])
            ->orderBy('name')
            ->get()
            ->map(function ($product) {
                $basePrice = (float) ($product->suggested_srp ?? 0);
                return [
                    'id'                 => $product->product_type_id,
                    'product_type_id'    => $product->product_type_id,
                    'name'               => $product->name,
                    'category'           => $product->category_code ?? 'General',
                    'category_code'      => $product->category_code ?? 'General',
                    'price'              => '₱' . number_format($basePrice, 2),
                    'base_price'         => $basePrice,
                    'description'        => $product->description ?? '',
                    'shelf_life'         => $product->shelf_life ?? '12 Months',
                    'storage_conditions' => $product->storage_conditions ?? 'Cool, dry place',
                    'lead_time_days'     => $product->lead_time_days ?? 14,
                    'formulation_notes'  => $product->formulation_notes,
                    'moq'                => '100 units',
                    'image'              => $product->image_url,
                    'image_url'          => $product->image_url,
                    'is_active'          => (bool) $product->is_active,
                    'variants'           => $product->activeVariants->map(fn($v) => [
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