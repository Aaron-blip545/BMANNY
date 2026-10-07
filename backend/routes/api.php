<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\FileUploadController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VerificationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;

// Public Routes
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:auth');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:auth');
Route::get('/products', [ProductController::class, 'index']);
Route::get('/customization-materials', [ProductController::class, 'customizationMaterials']);

// Protected Routes (Must be authenticated via Sanctum)
Route::middleware(['auth:sanctum', 'active.api'])->group(function () {

    // The mobile app authenticates private Reverb channels with its Sanctum
    // bearer token. This exposes no secret; the channel policy still limits
    // each account to its own user.{id} channel.
    Route::post('/broadcasting/auth', function (Request $request) {
        return Broadcast::auth($request);
    });

    Route::get('/realtime/config', function (Request $request) {
        return response()->json([
            'app_key' => config('broadcasting.connections.reverb.key'),
            'port'    => (int) config('broadcasting.connections.reverb.options.port'),
            'scheme'  => config('broadcasting.connections.reverb.options.scheme'),
        ]);
    });

    // ── Admin-only ───────────────────────────────────────────────────────────
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/users', [UserController::class, 'index']);
        Route::post('/admin/users', [UserController::class, 'store']);
        Route::put('/admin/users/{user}', [UserController::class, 'update']);
        Route::patch('/admin/users/{user}/toggle-active', [UserController::class, 'toggleActive']);
    });

    // Verification queue — sales agents handle permit review, approval, and rejection
    Route::middleware('role:sales_agent,admin')->group(function () {
        Route::get('/admin/verifications', [VerificationController::class, 'index']);
        Route::patch('/admin/verifications/{client_id}/approve', [VerificationController::class, 'approve']);
        Route::patch('/admin/verifications/{client_id}/reject', [VerificationController::class, 'reject']);
    });

    // ── Business Client Routes ───────────────────────────────────────────────
    Route::middleware('role:customer,admin')->group(function () {
        Route::patch('/user/profile', [AuthController::class, 'updateProfile'])->middleware('role:customer');
        Route::post('/user/profile/picture', [AuthController::class, 'updateProfilePicture'])->middleware(['role:customer', 'throttle:upload']);

        // Verification — customers can check status and submit a permit
        Route::get('/user/verification/status', [VerificationController::class, 'status']);
        Route::post('/user/verification/submit', [VerificationController::class, 'submitPermit'])->middleware('throttle:upload');

        // Inquiry routes — guarded by 'verified' middleware so only approved
        // accounts can submit. Unverified users (leads) get a 403 with context.
        Route::post('/inquiries', [InquiryController::class, 'store'])
            ->middleware(['verified', 'throttle:write']);
        Route::get('/inquiries/my-inquiries', [InquiryController::class, 'myInquiries']);
        Route::post('/inquiries/{inquiry_id}/cancel', [InquiryController::class, 'cancel']);
        Route::post('/inquiries/{inquiry_id}/upload-design', [FileUploadController::class, 'uploadDesign'])->middleware('throttle:upload');

        Route::get('/quotations/my-quotes', [QuotationController::class, 'myQuotes']);
        Route::post('/quotations/{quotation_id}/pay', [QuotationController::class, 'submitPayment'])->middleware('throttle:write');

        Route::post('/orders/{order_id}/upload-receipt', [FileUploadController::class, 'uploadReceipt'])->middleware('throttle:upload');
        Route::get('/orders/my-orders', [OrderController::class, 'myOrders']);

        // Quick-reorder also requires verification — guarded the same way
        Route::post('/orders/{order_id}/reorder', [InquiryController::class, 'reorder'])
            ->middleware(['verified', 'throttle:write']);
    });

    // ── Sales Agent & Admin Routes ───────────────────────────────────────────
    Route::middleware('role:sales_agent,admin')->group(function () {
        Route::post('/quotations', [QuotationController::class, 'store']);
    });

    // ── Order Manager & Admin Routes ─────────────────────────────────────────
    Route::middleware('role:order_manager,admin')->group(function () {
        Route::post('/orders', [OrderController::class, 'store']);
    });

    // ── Product Controller & Admin Routes ────────────────────────────────────
    Route::middleware('role:product_controller,admin')->group(function () {
        Route::post('/products', [ProductController::class, 'store']);
    });

    // ── Shared Routes (All Authenticated Users) ──────────────────────────────
    Route::get('/conversations', [ChatController::class, 'conversations']);
    Route::post('/messages', [ChatController::class, 'sendMessage'])->middleware('throttle:chat');
    Route::get('/messages/{other_user_id}', [ChatController::class, 'getConversation']);
    Route::post('/messages/{other_user_id}/read', [ChatController::class, 'markAsRead']);

    // ── Real-Time Notification Routes ────────────────────────────────────────
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/{notification_id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{notification_id}', [NotificationController::class, 'destroy']);

    Route::get('/user', function (Request $request) {
        // Include the businessClient profile so the mobile app can read
        // client_id and verification status without a separate request.
        return $request->user()->load('businessClient');
    });
});
