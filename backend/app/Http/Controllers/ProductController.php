<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product; // 1. Pull in the Product Model

class ProductController extends Controller
{
    public function index()
    {
        // 2. Fetch all products and include their linked category data
        $products = Product::with('category')->get();

        // 3. Return the data as a clean JSON response
        return response()->json($products);
    }
}