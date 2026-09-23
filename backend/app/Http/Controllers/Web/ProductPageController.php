<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductPageController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user('web');
        if (! $user || ! in_array($user->role, ['sales_agent', 'order_manager', 'admin', 'product_controller'])) {
            abort(403, 'Unauthorized to view raw materials inventory.');
        }

        // Direct Eloquent query — eager load category relation
        $products = Product::with('category')->orderBy('name')->get();

        return Inertia::render('products/index', [
            'products' => $products,
            'categories' => Category::orderBy('name')->get(['category_id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user('web');
        if (! $user || ! in_array($user->role, ['product_controller', 'admin'])) {
            abort(403, 'Unauthorized to add raw materials.');
        }

        $data = $request->validate([
            'name'           => 'required|string|max:200',
            'sku'            => 'required|string|max:50|unique:products,sku',
            'category_id'    => 'nullable|exists:categories,category_id',
            'price'          => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'description'    => 'nullable|string',
            'product_image'  => 'nullable|string|max:255',
        ]);

        Product::create($data);

        return back()->with('success', 'Product created successfully.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $user = $request->user('web');
        if (! $user || ! in_array($user->role, ['product_controller', 'admin'])) {
            abort(403, 'Unauthorized to update raw materials.');
        }

        $product = Product::findOrFail($id);

        $data = $request->validate([
            'name'           => 'required|string|max:200',
            'sku'            => 'required|string|max:50|unique:products,sku,' . $id . ',product_id',
            'category_id'    => 'nullable|exists:categories,category_id',
            'price'          => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'description'    => 'nullable|string',
            'product_image'  => 'nullable|string|max:255',
        ]);

        $product->update($data);

        return back()->with('success', 'Product updated successfully.');
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $user = $request->user('web');
        if (! $user || ! in_array($user->role, ['product_controller', 'admin'])) {
            abort(403, 'Unauthorized to delete raw materials.');
        }

        $product = Product::findOrFail($id);
        $product->delete();

        return back()->with('success', 'Product deleted successfully.');
    }
}

