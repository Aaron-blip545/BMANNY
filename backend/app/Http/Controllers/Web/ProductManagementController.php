<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\CustomizationCatalog;
use App\Models\MoqRule;
use App\Models\PackagingOption;
use App\Models\Product;
use App\Models\ProductRecipe;
use App\Models\ProductType;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        $products = ProductType::with([
            'recipes.rawMaterial',
            'packagingOptions',
            'customizationOptions',
            'variants.currentMoq',
        ])
            ->orderBy('name')
            ->get()
            ->map(function ($product) {
                $recipes = $product->recipes->map(function ($recipe) {
                    return [
                        'recipe_id'         => $recipe->recipe_id,
                        'product_id'        => $recipe->product_id,
                        'raw_material_name' => $recipe->rawMaterial?->name ?? 'Unknown Material',
                        'raw_material_sku'  => $recipe->rawMaterial?->sku ?? '',
                        'unit_of_measure'   => $recipe->rawMaterial?->unit_of_measure ?? 'kg',
                        'product_image'     => $recipe->rawMaterial?->product_image,
                        'quantity_per_unit' => (float) $recipe->quantity_per_unit,
                        'rate'              => (float) $recipe->rate,
                        'amount'            => (float) $recipe->amount,
                        'notes'             => $recipe->notes,
                    ];
                });

                $totalCost = $recipes->sum('amount');
                $firstVariant = $product->variants->first();
                $currentMoq = $firstVariant?->currentMoq;

                return [
                    'product_type_id'         => $product->product_type_id,
                    'product_code'            => $product->product_code ?? sprintf('FP-%04d', $product->product_type_id),
                    'name'                    => $product->name,
                    'category_code'           => $product->category_code ?? 'Uncategorized',
                    'suggested_srp'           => (float) ($product->suggested_srp ?? 0),
                    'formatted_price'         => '₱' . number_format((float) ($product->suggested_srp ?? 0), 2),
                    'description'             => $product->description,
                    'shelf_life'              => $product->shelf_life,
                    'storage_conditions'      => $product->storage_conditions,
                    'lead_time_days'          => $product->lead_time_days,
                    'formulation_notes'       => $product->formulation_notes,
                    'net_weight'              => $product->net_weight,
                    'packaging_specification' => $product->packaging_specification,
                    'label_specification'     => $product->label_specification,
                    'packaging_ids'           => $product->packagingOptions->pluck('packaging_id')->values()->all(),
                    'customization_ids'       => $product->customizationOptions->pluck('customization_id')->values()->all(),
                    'min_quantity'            => $currentMoq?->min_quantity ? (int) $currentMoq->min_quantity : null,
                    'moq_notes'               => $currentMoq?->notes,
                    'variant_id'              => $firstVariant?->variant_id,
                    'image_url'               => $product->image_url,
                    'is_active'               => (bool) $product->is_active,
                    'created_at'              => $product->created_at?->toISOString(),
                    'recipes'                 => $recipes,
                    'total_recipe_cost'       => $totalCost,
                    'formatted_recipe_cost'   => '₱' . number_format($totalCost, 2),
                    'materials_count'         => $recipes->count(),
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

        // All available raw materials for the BOM builder (strictly raw materials, no P- packaging)
        $rawMaterials = Product::orderBy('name')
            ->get([
                'product_id',
                'sku',
                'name',
                'price',
                'unit_of_measure',
                'stock_quantity',
                'reorder_level',
                'product_image',
            ])
            ->map(function ($item) {
                return [
                    'product_id'      => $item->product_id,
                    'sku'             => $item->sku,
                    'name'            => $item->name,
                    'rate'            => (float) $item->price,
                    'unit_of_measure' => $item->unit_of_measure ?? 'kg',
                    'stock_quantity'  => (float) $item->stock_quantity,
                    'reorder_level'   => (float) $item->reorder_level,
                    'product_image'   => $item->product_image,
                ];
            });

        $packagingOptions = PackagingOption::orderBy('category')->orderBy('name')->get();
        $customizationOptions = CustomizationCatalog::orderBy('name')->get();

        return Inertia::render('product-controller/products', [
            'products'             => $products,
            'categories'           => $categories,
            'rawMaterials'         => $rawMaterials,
            'packagingOptions'     => $packagingOptions,
            'customizationOptions' => $customizationOptions,
        ]);
    }

    /**
     * Store a newly created product in the catalog.
     */
    public function store(Request $request): RedirectResponse
    {
        if ($request->has('packaging_ids') && is_string($request->packaging_ids)) {
            $request->merge(['packaging_ids' => json_decode($request->packaging_ids, true) ?? []]);
        }
        if ($request->has('customization_ids') && is_string($request->customization_ids)) {
            $request->merge(['customization_ids' => json_decode($request->customization_ids, true) ?? []]);
        }

        $data = $request->validate([
            'name'                    => 'required|string|max:150|unique:product_types,name',
            'product_code'            => 'nullable|string|max:50|unique:product_types,product_code',
            'category_code'           => 'required|string|max:50',
            'suggested_srp'           => 'required|numeric|min:0',
            'description'             => 'nullable|string|max:500',
            'shelf_life'              => 'nullable|string|max:100',
            'storage_conditions'      => 'nullable|string|max:200',
            'lead_time_days'          => 'nullable|integer|min:1|max:365',
            'formulation_notes'       => 'nullable|string|max:2000',
            'net_weight'              => 'nullable|string|max:100',
            'packaging_specification' => 'nullable|string|max:2000',
            'label_specification'     => 'nullable|string|max:2000',
            'min_quantity'            => 'nullable|integer|min:1',
            'moq_notes'               => 'nullable|string|max:500',
            'packaging_ids'           => 'nullable|array',
            'packaging_ids.*'         => 'integer|exists:packaging_options,packaging_id',
            'customization_ids'       => 'nullable|array',
            'customization_ids.*'     => 'integer|exists:customization_catalog,customization_id',
            'image'                   => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:5120',
            'image_url'               => 'nullable|string|max:500',
            'is_active'               => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $data['image_url'] = '/storage/' . $path;
        }

        $data['is_active'] = $request->boolean('is_active', true);

        $packagingIds = $data['packaging_ids'] ?? [];
        $customizationIds = $data['customization_ids'] ?? [];
        $minQuantity = $data['min_quantity'] ?? null;
        $moqNotes = $data['moq_notes'] ?? null;
        unset($data['packaging_ids'], $data['customization_ids'], $data['min_quantity'], $data['moq_notes'], $data['image']);

        $productType = ProductType::create($data);

        // Generate product_code if not supplied (e.g. FP-0001)
        if (empty($productType->product_code)) {
            $productType->update([
                'product_code' => sprintf('FP-%04d', $productType->product_type_id),
            ]);
        }

        if (!empty($packagingIds)) {
            $productType->packagingOptions()->sync($packagingIds);
        }
        if (!empty($customizationIds)) {
            $productType->customizationOptions()->sync($customizationIds);
        }

        // Automatically create a default base variant if none exists
        $variant = ProductVariant::create([
            'product_type_id' => $productType->product_type_id,
            'name'            => 'Standard',
            'is_available'    => true,
            'is_published'    => true,
        ]);
        $variant->update(['sku' => sprintf('BMN-%04d-%04d', $productType->product_type_id, $variant->variant_id)]);

        if ($minQuantity) {
            MoqRule::create([
                'variant_id'     => $variant->variant_id,
                'min_quantity'   => (int) $minQuantity,
                'effective_date' => now()->toDateString(),
                'notes'          => $moqNotes ?: 'Initial MOQ set via Product Management',
                'created_by'     => $request->user('web')?->user_id ?? $request->user()?->user_id,
            ]);
        }

        return back()->with('success', 'Product added successfully and is now active in the catalog.');
    }

    /**
     * Update the specified product in the catalog.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $product = ProductType::findOrFail($id);

        if ($request->has('packaging_ids') && is_string($request->packaging_ids)) {
            $request->merge(['packaging_ids' => json_decode($request->packaging_ids, true) ?? []]);
        }
        if ($request->has('customization_ids') && is_string($request->customization_ids)) {
            $request->merge(['customization_ids' => json_decode($request->customization_ids, true) ?? []]);
        }

        $data = $request->validate([
            'name'                    => 'required|string|max:150|unique:product_types,name,' . $id . ',product_type_id',
            'product_code'            => 'nullable|string|max:50|unique:product_types,product_code,' . $id . ',product_type_id',
            'category_code'           => 'required|string|max:50',
            'suggested_srp'           => 'required|numeric|min:0',
            'description'             => 'nullable|string|max:500',
            'shelf_life'              => 'nullable|string|max:100',
            'storage_conditions'      => 'nullable|string|max:200',
            'lead_time_days'          => 'nullable|integer|min:1|max:365',
            'formulation_notes'       => 'nullable|string|max:2000',
            'net_weight'              => 'nullable|string|max:100',
            'packaging_specification' => 'nullable|string|max:2000',
            'label_specification'     => 'nullable|string|max:2000',
            'min_quantity'            => 'nullable|integer|min:1',
            'moq_notes'               => 'nullable|string|max:500',
            'packaging_ids'           => 'nullable|array',
            'packaging_ids.*'         => 'integer|exists:packaging_options,packaging_id',
            'customization_ids'       => 'nullable|array',
            'customization_ids.*'     => 'integer|exists:customization_catalog,customization_id',
            'image'                   => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:5120',
            'image_url'               => 'nullable|string|max:500',
            'is_active'               => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $data['image_url'] = '/storage/' . $path;
        }

        if (empty($data['product_code'])) {
            $data['product_code'] = sprintf('FP-%04d', $product->product_type_id);
        }

        if ($request->has('packaging_ids')) {
            $product->packagingOptions()->sync($data['packaging_ids'] ?? []);
        }
        if ($request->has('customization_ids')) {
            $product->customizationOptions()->sync($data['customization_ids'] ?? []);
        }

        if ($request->has('min_quantity') && $request->filled('min_quantity')) {
            $variant = $product->variants()->first();
            if (!$variant) {
                $variant = ProductVariant::create([
                    'product_type_id' => $product->product_type_id,
                    'name'            => 'Standard',
                    'is_available'    => true,
                    'is_published'    => true,
                ]);
                $variant->update(['sku' => sprintf('BMN-%04d-%04d', $product->product_type_id, $variant->variant_id)]);
            }

            MoqRule::create([
                'variant_id'     => $variant->variant_id,
                'min_quantity'   => (int) $request->input('min_quantity'),
                'effective_date' => now()->toDateString(),
                'notes'          => $request->input('moq_notes') ?: 'Updated via Product Management',
                'created_by'     => $request->user('web')?->user_id ?? $request->user()?->user_id,
            ]);
        }

        unset($data['packaging_ids'], $data['customization_ids'], $data['min_quantity'], $data['moq_notes'], $data['image']);

        $product->update($data);

        return back()->with('success', 'Product updated successfully.');
    }

    /**
     * Save Bill of Materials (BOM) / Formulation for a composite finished product.
     */
    public function saveBom(Request $request, int $id): RedirectResponse
    {
        $product = ProductType::findOrFail($id);

        $request->validate([
            'items'                       => 'present|array',
            'items.*.product_id'          => 'required|exists:products,product_id',
            'items.*.quantity_per_unit'   => 'required|numeric|min:0.000001',
            'items.*.rate'                => 'nullable|numeric|min:0',
            'items.*.notes'               => 'nullable|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            // Delete existing recipe rows
            ProductRecipe::where('product_type_id', $product->product_type_id)->delete();

            // Insert new recipe items
            foreach ($request->input('items', []) as $item) {
                $rawMaterial = Product::find($item['product_id']);
                $rate = isset($item['rate']) && $item['rate'] !== null && $item['rate'] !== ''
                    ? (float) $item['rate']
                    : (float) ($rawMaterial?->price ?? 0);

                $qty = (float) $item['quantity_per_unit'];
                $amount = round($qty * $rate, 2);

                ProductRecipe::create([
                    'product_type_id'   => $product->product_type_id,
                    'product_id'        => $item['product_id'],
                    'quantity_per_unit' => $qty,
                    'rate'              => $rate,
                    'amount'            => $amount,
                    'notes'             => $item['notes'] ?? null,
                ]);
            }

            DB::commit();
            return back()->with('success', "Bill of Materials (BOM) for {$product->name} saved successfully.");
        } catch (\Throwable $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to save Bill of Materials: ' . $e->getMessage()]);
        }
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
