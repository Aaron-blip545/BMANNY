<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class ProductPageController extends Controller
{
    public function index(): Response
    {
        // Direct Eloquent query — no more HTTP proxy to backend API.
        // FIXED: was Product::all() with no eager load, so `category` was
        // never included when this got serialized to JSON for the page -
        // the same class of bug fixed earlier for Inquiry::customizations.
        // The frontend's category column/filter had nothing to read.
        $products = Product::with('category')->orderBy('name')->get();

        return Inertia::render('products/index', [
            'products' => $products,
            'categories' => Category::orderBy('name')->get(['category_id', 'name']),
        ]);
    }
}
