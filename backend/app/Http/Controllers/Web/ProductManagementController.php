<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ProductType;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductManagementController extends Controller
{
    /**
     * Display the Product Management catalog page.
     */
    public function index(Request $request): Response
    {
        $products = ProductType::orderBy('name')
            ->get()
            ->map(function ($product) {
                return [
                    'product_type_id'    => $product->product_type_id,
                    'name'               => $product->name,
                    'category_code'      => $product->category_code ?? 'Uncategorized',
                    'suggested_srp'      => (float) ($product->suggested_srp ?? 0),
                    'formatted_price'    => '₱' . number_format((float) ($product->suggested_srp ?? 0), 2),
                    'description'        => $product->description,
                    'shelf_life'         => $product->shelf_life,
                    'storage_conditions' => $product->storage_conditions,
                    'lead_time_days'     => $product->lead_time_days,
                    'formulation_notes'  => $product->formulation_notes,
                    'image_url'          => $product->image_url,
                    'is_active'          => (bool) $product->is_active,
                    'created_at'         => $product->created_at?->toISOString(),
                ];
            });

        // Get distinct categories in use plus default suggestions
        $existingCategories = ProductType::whereNotNull('category_code')
            ->where('category_code', '!=', '')
            ->distinct()
            ->pluck('category_code')
            ->toArray();

        $defaultCategories = [
            'Health & Wellness',
            'Supplements & Wellbeing',
            'Detox & Nutrition',
            'Beauty & Personal Care',
        ];
        $categories = array_values(array_unique(array_merge($defaultCategories, $existingCategories)));
        sort($categories);

        return Inertia::render('product-controller/products', [
            'products'   => $products,
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created product in the catalog.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'               => 'required|string|max:150|unique:product_types,name',
            'category_code'      => 'required|string|max:50',
            'suggested_srp'      => 'required|numeric|min:0',
            'description'        => 'nullable|string|max:500',
            'shelf_life'         => 'nullable|string|max:100',
            'storage_conditions' => 'nullable|string|max:200',
            'lead_time_days'     => 'nullable|integer|min:1|max:365',
            'formulation_notes'  => 'nullable|string|max:1000',
            'image'              => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:5120',
            'image_url'          => 'nullable|string|max:500',
            'is_active'          => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $data['image_url'] = '/storage/' . $path;
        }

        $data['is_active'] = $request->boolean('is_active', true);

        $productType = ProductType::create($data);

        // Automatically create a default base variant if none exists
        $variant = ProductVariant::create([
            'product_type_id' => $productType->product_type_id,
            'name'            => 'Standard',
            'is_available'    => true,
            'is_published'    => true,
        ]);
        $variant->update(['sku' => sprintf('BMN-%04d-%04d', $productType->product_type_id, $variant->variant_id)]);

        return back()->with('success', 'Product added successfully and is now active in the catalog.');
    }

    /**
     * Update the specified product in the catalog.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $product = ProductType::findOrFail($id);

        $data = $request->validate([
            'name'               => 'required|string|max:150|unique:product_types,name,' . $id . ',product_type_id',
            'category_code'      => 'required|string|max:50',
            'suggested_srp'      => 'required|numeric|min:0',
            'description'        => 'nullable|string|max:500',
            'shelf_life'         => 'nullable|string|max:100',
            'storage_conditions' => 'nullable|string|max:200',
            'lead_time_days'     => 'nullable|integer|min:1|max:365',
            'formulation_notes'  => 'nullable|string|max:1000',
            'image'              => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:5120',
            'image_url'          => 'nullable|string|max:500',
            'is_active'          => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $data['image_url'] = '/storage/' . $path;
        }

        $product->update($data);

        return back()->with('success', 'Product updated successfully.');
    }

    /**
     * Toggle active / inactive status of a product.
     */
    public function toggleStatus(int $id): RedirectResponse
    {
        $product = ProductType::findOrFail($id);
        $product->is_active = ! $product->is_active;
        $product->save();

        return back()->with('success', 'Product status updated.');
    }

    /**
     * Remove the specified product from the catalog.
     */
    public function destroy(int $id): RedirectResponse
    {
        $product = ProductType::findOrFail($id);
        $product->delete();

        return back()->with('success', 'Product deleted successfully.');
    }
}
