<?php

namespace App\Http\Controllers;

use App\Services\BackendApi;
use Inertia\Inertia;
use Inertia\Response;

class ProductPageController extends Controller
{
    public function index(): Response
    {
        // This is the actual connection: a server-side HTTP call from
        // frontend-web to backend's public GET /api/products endpoint.
        // No auth needed for this one - it's a public route on backend.
        $response = BackendApi::get('/products');

        return Inertia::render('products/index', [
            'products' => $response->successful() ? $response->json() : [],
            'error' => $response->failed() ? 'Could not reach backend API.' : null,
        ]);
    }
}
