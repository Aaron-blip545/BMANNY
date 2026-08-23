<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ProductControllerModuleController extends Controller
{
    private const MODULES = [
        'variants' => [
            'title' => 'Variant Management',
            'href' => '/product-controller/variants',
            'description' => 'Manage approved product variants, sizes, and forms.',
            'emptyMessage' => 'No variant or size data available.',
        ],
        'packaging' => [
            'title' => 'Packaging Management',
            'href' => '/product-controller/packaging',
            'description' => 'Manage approved packaging, containers, bottles, and labels.',
            'emptyMessage' => 'No packaging or container data available.',
        ],
        'moq' => [
            'title' => 'MOQ Management',
            'href' => '/product-controller/moq',
            'description' => 'Review official minimum order quantities for product configurations.',
            'emptyMessage' => 'No MOQ data available.',
        ],
        'customization' => [
            'title' => 'Customization Options',
            'href' => '/product-controller/customization',
            'description' => 'Manage available rebranding and customization choices.',
            'emptyMessage' => 'No customization options available.',
        ],
        'notifications' => [
            'title' => 'Notifications',
            'href' => '/product-controller/notifications',
            'description' => 'Review product configuration and MOQ notifications.',
            'emptyMessage' => 'No notifications available.',
        ],
    ];

    public function show(string $module): Response
    {
        abort_unless(array_key_exists($module, self::MODULES), 404);

        return Inertia::render('product-controller/module', [
            'module' => self::MODULES[$module],
        ]);
    }
}
