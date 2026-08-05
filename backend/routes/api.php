<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\AuthController; // Import Auth

// Public Routes (Anyone can login or view the catalog)
Route::post('/login', [AuthController::class, 'login']);
Route::get('/products', [ProductController::class, 'index']);
Route::post('/register', [AuthController::class, 'register']); // New registration route

// Protected Routes (Must be logged in with a valid token)
// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/inquiries', [InquiryController::class, 'store']); 
    Route::post('/quotations', [QuotationController::class, 'store']); 
    Route::get('/quotations/{client_id}', [QuotationController::class, 'show']);
    
    
    // Order Processing Route
    Route::post('/orders', [\App\Http\Controllers\OrderController::class, 'store']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});