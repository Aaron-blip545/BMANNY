<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ProductType;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductVariantsController extends Controller
{
    /**
     * Show the Variants management page.
     * Returns all product types with their variants (and current MOQ per variant).
     */
    public function index(): Response
    {
        $types = ProductType::with([
            'variants' => function ($q) {
                $q->withTrashed()->with('currentMoq.creator:user_id,full_name');
            },
        ])->orderBy('name')->get();

        return Inertia::render('product-controller/variants', [
            'productTypes' => $types,
        ]);
    }

    // ── Product Type CRUD ─────────────────────────────────────────────────────

    public function storeType(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:150|unique:product_types,name',
            'description' => 'nullable|string',
        ]);

        ProductType::create($data);

        return back()->with('success', 'Product type created.');
    }

    public function updateType(Request $request, int $id): RedirectResponse
    {
        $type = ProductType::findOrFail($id);

        $data = $request->validate([
            'name'        => 'required|string|max:150|unique:product_types,name,' . $id . ',product_type_id',
            'description' => 'nullable|string',
            'is_active'   => 'boolean',
        ]);

        $type->update($data);

        return back()->with('success', 'Product type updated.');
    }

    public function destroyType(int $id): RedirectResponse
    {
        $type = ProductType::findOrFail($id);
        // Hard delete the type; variants cascade-delete (they are soft-deleted by DB cascade)
        $type->delete();

        return back()->with('success', 'Product type removed.');
    }

    // ── Product Variant CRUD ──────────────────────────────────────────────────

    public function store(Request $request): RedirectResponse
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

        ProductVariant::create($data);

        return back()->with('success', 'Variant added.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $variant = ProductVariant::findOrFail($id);

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

        $variant->update($data);

        return back()->with('success', 'Variant updated.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $variant = ProductVariant::findOrFail($id);
        $variant->delete(); // soft delete

        return back()->with('success', 'Variant removed.');
    }

    public function restore(int $id): RedirectResponse
    {
        $variant = ProductVariant::withTrashed()->findOrFail($id);
        $variant->restore();

        return back()->with('success', 'Variant restored.');
    }
}
