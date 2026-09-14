<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\MoqRule;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MoqController extends Controller
{
    /**
     * Show the MOQ management page.
     * Lists all variants with their current MOQ and full history.
     * Variants without any MOQ rule are highlighted.
     */
    public function index(): Response
    {
        $variants = ProductVariant::with([
            'productType:product_type_id,name',
            'moqRules.creator:user_id,full_name',
        ])->orderBy('name')->get();

        // Separate variants that are missing an active MOQ rule
        $variantsWithoutMoq = $variants->filter(function ($v) {
            return $v->moqRules->isEmpty();
        })->values();

        return Inertia::render('product-controller/moq', [
            'variants'          => $variants,
            'variantsWithoutMoq' => $variantsWithoutMoq->pluck('variant_id'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'variant_id'     => 'required|exists:product_variants,variant_id',
            'min_quantity'   => 'required|integer|min:1',
            'effective_date' => 'required|date',
            'notes'          => 'nullable|string',
        ]);

        $data['created_by'] = $request->user('web')->user_id;

        MoqRule::create($data);

        return back()->with('success', 'MOQ rule set.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $rule = MoqRule::findOrFail($id);

        $data = $request->validate([
            'min_quantity'   => 'required|integer|min:1',
            'effective_date' => 'required|date',
            'notes'          => 'nullable|string',
        ]);

        $rule->update($data);

        return back()->with('success', 'MOQ rule updated.');
    }

    public function destroy(int $id): RedirectResponse
    {
        MoqRule::findOrFail($id)->delete(); // soft delete — audit trail preserved

        return back()->with('success', 'MOQ rule removed.');
    }
}
