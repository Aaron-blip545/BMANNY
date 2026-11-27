<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Inquiry;
use App\Models\Product;
use App\Models\ProductRecipe;
use App\Models\ProductRequestReview;
use App\Models\ProductType;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductRequestReviewController extends Controller
{
    public function index(): Response
    {
        $rawMaterials = Product::orderBy('name')
            ->get([
                'product_id',
                'sku',
                'name',
                'price',
                'unit_of_measure',
                'stock_quantity',
                'reorder_level',
            ])
            ->map(fn ($m) => [
                'product_id'      => $m->product_id,
                'sku'             => $m->sku,
                'name'            => $m->name,
                'rate'            => (float) $m->price,
                'unit_of_measure' => $m->unit_of_measure ?? 'kg',
                'stock_quantity'  => (float) $m->stock_quantity,
                'reorder_level'   => (float) ($m->reorder_level ?? 0),
            ])
            ->values();

        $ashigo = ProductType::where('is_active', true)->orderBy('product_type_id')->first();
        $baseBomRecipes = $ashigo
            ? ProductRecipe::with('rawMaterial')
                ->where('product_type_id', $ashigo->product_type_id)
                ->whereNull('package_slug')
                ->get()
                ->map(fn ($r) => [
                    'recipe_id'         => $r->recipe_id,
                    'product_id'        => $r->product_id,
                    'raw_material_name' => $r->rawMaterial?->name ?? 'Unknown Material',
                    'raw_material_sku'  => $r->rawMaterial?->sku ?? '',
                    'unit_of_measure'   => $r->rawMaterial?->unit_of_measure ?? 'kg',
                    'stock_quantity'    => (float) ($r->rawMaterial?->stock_quantity ?? 0),
                    'quantity_per_unit' => (float) $r->quantity_per_unit,
                    'rate'              => (float) $r->rate,
                    'amount'            => (float) $r->amount,
                ])
                ->values()
            : collect();

        return Inertia::render('product-controller/requests', [
            'requests' => ProductRequestReview::with([
                'inquiry.client.user', 'inquiry.customizations', 'productType', 'requestedVariant',
                'suggestedVariant.productType', 'suggestedPackaging', 'requester', 'reviewer',
            ])->latest()->get(),
            'productTypes' => ProductType::with(['variants' => fn ($query) => $query->available(), 'packagingOptions' => fn ($query) => $query->available()])
                ->active()->orderBy('name')->get(),
            'rawMaterials' => $rawMaterials,
            'baseBomRecipes' => $baseBomRecipes,
        ]);
    }

    public function submit(Request $request, int $inquiryId): RedirectResponse
    {
        $inquiry = Inquiry::findOrFail($inquiryId);
        $data = $request->validate([
            'product_type_id' => 'nullable|exists:product_types,product_type_id',
            'requested_variant_id' => 'nullable|exists:product_variants,variant_id',
            'request_notes' => 'nullable|string|max:2000',
        ]);

        ProductRequestReview::updateOrCreate(
            ['inquiry_id' => $inquiry->inquiry_id],
            [
                ...$data,
                'requested_by' => $request->user('web')->user_id,
                'status' => 'pending',
                'response_notes' => null,
                'suggested_variant_id' => null,
                'suggested_packaging_id' => null,
                'reviewed_by' => null,
                'reviewed_at' => null,
            ]
        );

        NotificationService::sendToRoles(['product_controller'], 'product_request', 'Product request awaiting review', "Inquiry #{$inquiry->inquiry_id} needs an availability review.", ['inquiry_id' => $inquiry->inquiry_id]);

        return back()->with('success', 'Product request sent to the Product Controller.');
    }

    public function review(Request $request, int $id): RedirectResponse
    {
        $review = ProductRequestReview::with(['inquiry.client.user', 'inquiry.customizations'])->findOrFail($id);
        $data = $request->validate([
            'status' => 'required|in:available,alternative,unavailable',
            'suggested_variant_id' => 'nullable|exists:product_variants,variant_id',
            'suggested_packaging_id' => 'nullable|exists:packaging_options,packaging_id',
            'response_notes' => 'required|string|max:2000',
            'custom_bom_items' => 'nullable|array',
            'custom_bom_items.*.product_id' => 'required|exists:products,product_id',
            'custom_bom_items.*.quantity_per_unit' => 'required|numeric|min:0.000001',
        ]);

        $selectedPackage = strtolower((string) ($review->inquiry?->customizations?->first()?->selected_package ?? 'starter'));
        $rawCustomItems = $data['custom_bom_items'] ?? [];

        if (! empty($rawCustomItems)) {
            if ($selectedPackage === 'starter') {
                return back()->withErrors([
                    'custom_bom_items' => 'Starter Package uses the fixed global base formula and does not allow custom herbal add-on ingredients.',
                ]);
            }
            $maxCustom = $selectedPackage === 'elite' ? 8 : 6;
            if (count($rawCustomItems) > $maxCustom) {
                return back()->withErrors([
                    'custom_bom_items' => ucfirst($selectedPackage) . " Package allows a maximum of {$maxCustom} custom herbal add-on ingredients.",
                ]);
            }
        }

        $normalizedBom = [];
        foreach ($rawCustomItems as $item) {
            $material = Product::find($item['product_id']);
            if (! $material) {
                continue;
            }
            $qty = round((float) $item['quantity_per_unit'], 6);
            $rate = round((float) $material->price, 2);
            $normalizedBom[] = [
                'product_id'        => $material->product_id,
                'name'              => $material->name,
                'sku'               => $material->sku,
                'unit_of_measure'   => $material->unit_of_measure ?? 'kg',
                'quantity_per_unit' => $qty,
                'rate'              => $rate,
                'amount'            => round($qty * $rate, 2),
            ];
        }

        $review->update([
            'status'                 => $data['status'],
            'suggested_variant_id'   => $data['suggested_variant_id'] ?? null,
            'suggested_packaging_id' => $data['suggested_packaging_id'] ?? null,
            'response_notes'         => $data['response_notes'],
            'custom_bom_items'       => ! empty($normalizedBom) ? $normalizedBom : null,
            'reviewed_by'            => $request->user('web')->user_id,
            'reviewed_at'            => now(),
        ]);

        // A completed Product Control decision advances the lead automatically.
        // A request BMANNY cannot accommodate is cancelled; an available request
        // or alternative is ready for Sales to quote.
        if ($review->inquiry) {
            $review->inquiry->update([
                'status' => $data['status'] === 'unavailable' ? 'cancelled' : 'for_quotation',
                'cancelled_at' => $data['status'] === 'unavailable' ? now() : $review->inquiry->cancelled_at,
                'cancellation_reason' => $data['status'] === 'unavailable'
                    ? ($data['response_notes'] ?: 'Marked unavailable by Product Control.')
                    : $review->inquiry->cancellation_reason,
            ]);
        }

        if ($review->inquiry?->client?->user) {
            NotificationService::send(
                $review->inquiry->client->user->user_id,
                'product_request',
                'Product availability reviewed',
                "Your requested product configuration has been reviewed: {$data['status']}.",
                ['inquiry_id' => $review->inquiry_id]
            );
        }
        if ($review->requested_by) {
            NotificationService::send($review->requested_by, 'product_request', 'Product request reviewed', "Inquiry #{$review->inquiry_id} is {$data['status']}.", ['inquiry_id' => $review->inquiry_id]);
        }

        return back()->with('success', 'Availability response sent to Sales Agent.');
    }
}
