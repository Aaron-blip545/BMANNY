<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\QuotationController; // 1. Import the new controller

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Inventory Routes
Route::get('/products', [ProductController::class, 'index']);

// Rebranding & Inquiry Routes
Route::post('/inquiries', [InquiryController::class, 'store']); 

// Quotation Routes
Route::post('/quotations', [QuotationController::class, 'store']); // Admin sends quote
Route::get('/quotations/{client_id}', [QuotationController::class, 'show']); // Client views their quotes