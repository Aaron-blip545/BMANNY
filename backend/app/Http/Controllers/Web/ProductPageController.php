<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class ProductPageController extends Controller
{
    public function index(): Response
    {
        // Direct Eloquent query — no more HTTP proxy to backend API.
        $products = Product::all();

        return Inertia::render('products/index', [
            'products' => $products,
        ]);
    }
}
