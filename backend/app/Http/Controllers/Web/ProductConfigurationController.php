<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\CustomizationCatalog;
use App\Models\PackagingOption;
use App\Models\ProductType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductConfigurationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('product-controller/configurations', [
            'productTypes' => ProductType::with([
                'variants.currentMoq', 'packagingOptions', 'customizationOptions',
            ])->orderBy('name')->get(),
            'packagingOptions' => PackagingOption::orderBy('category')->orderBy('name')->get(),
            'customizationOptions' => CustomizationCatalog::orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $product = ProductType::findOrFail($id);
        $data = $request->validate([
            'packaging_ids' => 'array',
            'packaging_ids.*' => 'integer|exists:packaging_options,packaging_id',
            'customization_ids' => 'array',
            'customization_ids.*' => 'integer|exists:customization_catalog,customization_id',
        ]);

        $product->packagingOptions()->sync($data['packaging_ids'] ?? []);
        $product->customizationOptions()->sync($data['customization_ids'] ?? []);

        return back()->with('success', 'Allowed product options updated.');
    }
}
