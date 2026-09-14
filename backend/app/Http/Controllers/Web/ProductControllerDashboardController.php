<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\CustomizationCatalog;
use App\Models\MoqRule;
use App\Models\PackagingOption;
use App\Models\ProductType;
use App\Models\ProductVariant;
use Inertia\Inertia;
use Inertia\Response;

class ProductControllerDashboardController extends Controller
{
    public function index(): Response
    {
        $totalVariants     = ProductVariant::count();
        $availableVariants = ProductVariant::where('is_available', true)->count();
        $unavailable       = ProductVariant::where('is_available', false)->count();

        // Variants that have no MOQ rule at all
        $variantIdsWithMoq = MoqRule::distinct()->pluck('variant_id');
        $moqAttention      = ProductVariant::whereNotIn('variant_id', $variantIdsWithMoq)->count();

        // Variants updated in the last 7 days
        $recentlyUpdated = ProductVariant::where('updated_at', '>=', now()->subDays(7))->count();

        // Last 10 changes across variants + packaging + customization
        $variantUpdates = ProductVariant::withTrashed()
            ->with('productType:product_type_id,name')
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get()
            ->map(fn($v) => [
                'id'                => $v->variant_id,
                'configurationName' => $v->productType?->name . ' — ' . $v->name,
                'action'            => $v->deleted_at ? 'Removed' : ($v->wasRecentlyCreated ? 'Added' : 'Updated'),
                'updatedBy'         => null,
                'updatedAt'         => $v->updated_at?->format('M d, Y g:i A'),
            ]);

        $packagingUpdates = PackagingOption::orderByDesc('updated_at')
            ->limit(5)
            ->get()
            ->map(fn($p) => [
                'id'                => 'pkg-' . $p->packaging_id,
                'configurationName' => 'Packaging: ' . $p->name,
                'action'            => 'Updated',
                'updatedBy'         => null,
                'updatedAt'         => $p->updated_at?->format('M d, Y g:i A'),
            ]);

        $recentUpdates = $variantUpdates->merge($packagingUpdates)
            ->sortByDesc('updatedAt')
            ->take(10)
            ->values();

        // MOQ attention sidebar: variants missing a rule
        $moqAlerts = ProductVariant::whereNotIn('variant_id', $variantIdsWithMoq)
            ->with('productType:product_type_id,name')
            ->limit(10)
            ->get()
            ->map(fn($v) => [
                'id'                => $v->variant_id,
                'configurationName' => ($v->productType?->name ?? '—') . ' — ' . $v->name,
                'currentMoq'        => null,
                'status'            => 'No MOQ set',
            ]);

        return Inertia::render('product-controller/index', [
            'stats' => [
                'totalConfigurations'     => $totalVariants,
                'availableConfigurations' => $availableVariants,
                'unavailableConfigurations' => $unavailable,
                'moqAttention'            => $moqAttention,
                'recentlyUpdated'         => $recentlyUpdated,
            ],
            'recentUpdates'       => $recentUpdates,
            'moqAlerts'           => $moqAlerts,
            'configurationStatus' => [
                'available'    => $availableVariants,
                'unavailable'  => $unavailable,
                'moqAttention' => $moqAttention,
            ],
        ]);
    }
}
