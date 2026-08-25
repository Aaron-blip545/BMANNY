<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\FileUploadController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;

// Public Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::get('/products', [ProductController::class, 'index']);

// Protected Routes (Must be authenticated via Sanctum)
Route::middleware('auth:sanctum')->group(function () {

    Route::middleware('role:admin')->group(function () {
       Route::get('/admin/users', [UserController::class, 'index']);
       Route::post('/admin/users', [UserController::class, 'store']);
       Route::put('/admin/users/{user}', [UserController::class, 'update']);
       Route::patch('/admin/users/{user}/toggle-active', [UserController::class, 'toggleActive']);
   });

    // 1. Business Client Routes
    Route::middleware('role:customer,admin')->group(function () {
        Route::post('/inquiries', [InquiryController::class, 'store']);
        Route::get('/inquiries/my-inquiries', [InquiryController::class, 'myInquiries']);
        Route::post('/inquiries/{inquiry_id}/cancel', [InquiryController::class, 'cancel']);
        Route::post('/inquiries/{inquiry_id}/upload-design', [FileUploadController::class, 'uploadDesign']);
        Route::get('/quotations/my-quotes', [QuotationController::class, 'myQuotes']);
        Route::post('/quotations/{quotation_id}/pay', [QuotationController::class, 'submitPayment']);
        Route::post('/orders/{order_id}/upload-receipt', [FileUploadController::class, 'uploadReceipt']);
        Route::get('/orders/my-orders', [OrderController::class, 'myOrders']);
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
    Route::get('/conversations', [ChatController::class, 'conversations']);
    Route::post('/messages', [ChatController::class, 'sendMessage']);
    Route::get('/messages/{other_user_id}', [ChatController::class, 'getConversation']);
    Route::post('/messages/{other_user_id}/read', [ChatController::class, 'markAsRead']);
    
    Route::get('/user', function (Request $request) {
        // Include the businessClient profile so the mobile app can read
        // client_id without a separate request.
        return $request->user()->load('businessClient');
    });
});
