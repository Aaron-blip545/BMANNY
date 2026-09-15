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
     * Returns all flavors, packaging types, and container materials with their real-time stock counts.
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
        $containers = $materials->filter(fn($m) => str_contains(strtolower($m['category']), 'container'))->values();

        return response()->json([
            'all'        => $materials->values(),
            'flavors'    => $flavors,
            'packaging'  => $packaging,
            'containers' => $containers,
        ]);
    }

    /**
     * Customer-facing product listing (mobile app).
     * Returns only published variants so customers only see what's been
     * explicitly made public by the Product Controller.
     */
    public function index(): JsonResponse
    {
        $variants = ProductVariant::published()
            ->with('productType:product_type_id,name')
            ->orderBy('product_type_id')
            ->orderBy('name')
            ->get()
            ->map(fn($v) => [
                'variant_id'     => $v->variant_id,
                'name'           => $v->name,
                'full_name'      => $v->full_name,
                'size_value'     => $v->size_value,
                'size_unit'      => $v->size_unit,
                'container_type' => $v->container_type,
                'is_available'   => $v->is_available,
                'notes'          => $v->notes,
                'product_type'   => $v->productType ? [
                    'product_type_id' => $v->productType->product_type_id,
                    'name'            => $v->productType->name,
                ] : null,
            ]);

        return response()->json($variants);
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