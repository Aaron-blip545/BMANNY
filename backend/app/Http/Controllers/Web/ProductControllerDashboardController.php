<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ProductControllerDashboardController extends Controller
{
    public function index(): Response
    {
        // The current schema has products and categories, but no product-configurations,
        // variants, packaging, customization, or MOQ tables. Keep these props ready for
        // that future data without substituting inventory records or sample values.
        return Inertia::render('product-controller/index', [
            'stats' => [
                'totalConfigurations' => null,
                'availableConfigurations' => null,
                'unavailableConfigurations' => null,
                'moqAttention' => null,
                'recentlyUpdated' => null,
            ],
            'recentUpdates' => [],
            'moqAlerts' => [],
            'configurationStatus' => null,
        ]);
    }
}
