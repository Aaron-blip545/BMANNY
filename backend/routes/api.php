<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\FileUploadController;
use App\Http\Controllers\ChatController;

// Public Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/products', [ProductController::class, 'index']);

// Protected Routes (Must be authenticated via Sanctum)
Route::middleware('auth:sanctum')->group(function () {

    // 1. Business Client Routes
    Route::middleware('role:customer,admin')->group(function () {
        Route::post('/inquiries', [InquiryController::class, 'store']);
        Route::post('/inquiries/{inquiry_id}/upload-design', [FileUploadController::class, 'uploadDesign']);
        Route::get('/quotations/my-quotes', [QuotationController::class, 'show']);
        Route::post('/orders/{order_id}/upload-receipt', [FileUploadController::class, 'uploadReceipt']);
    });

    // 2. Sales Agent & Admin Routes
    Route::middleware('role:sales_agent,admin')->group(function () {
        Route::post('/quotations', [QuotationController::class, 'store']);
    });

    // 3. Order Manager & Admin Routes
    Route::middleware('role:order_manager,admin')->group(function () {
        Route::post('/orders', [OrderController::class, 'store']);
    });

    // 4. Product Controller & Admin Routes
    Route::middleware('role:product_controller,admin')->group(function () {
        Route::post('/products', [ProductController::class, 'store']);
    });

    // 5. Shared Routes (All Authenticated Users)
    Route::post('/messages', [ChatController::class, 'sendMessage']);
    Route::get('/messages/{other_user_id}', [ChatController::class, 'getConversation']);
    
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});
