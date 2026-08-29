<?php

use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Web\AdminDashboardController;
use App\Http\Controllers\Web\ChatController;
use App\Http\Controllers\Web\OrderManagerController;
use App\Http\Controllers\Web\ProductControllerDashboardController;
use App\Http\Controllers\Web\ProductControllerModuleController;
use App\Http\Controllers\Web\ProductPageController;
use App\Http\Controllers\Web\SalesAgentController;
use App\Http\Controllers\Web\SalesDashboardController;
use App\Http\Controllers\Web\UserManagementController;
use App\Support\RoleDashboard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['backend.auth'])->group(function () {
    // Real-Time Notification Endpoints (Web Authenticated)
    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
    Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
    Route::delete('notifications/{id}', [NotificationController::class, 'destroy'])->name('notifications.destroy');

    Route::get('dashboard', function (Request $request) {
        $dashboardRoute = RoleDashboard::routeNameFor($request->user('web')?->role);

        if ($dashboardRoute !== 'dashboard') {
            return redirect()->route($dashboardRoute);
        }

        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('products', [ProductPageController::class, 'index'])->name('products.index');

    Route::middleware(['backend.role:admin'])->get('admin/dashboard', [AdminDashboardController::class, 'index'])
        ->name('admin.dashboard');
    Route::middleware(['backend.role:admin'])->get('admin/analytics', [AdminDashboardController::class, 'analytics'])
        ->name('admin.analytics');
    Route::middleware(['backend.role:admin'])->get('admin/reports', [AdminDashboardController::class, 'reports'])
        ->name('admin.reports');
    Route::middleware(['backend.role:admin'])->get('admin/reports/{report}/export', [AdminDashboardController::class, 'exportReport'])
        ->whereIn('report', ['inquiries', 'quotations', 'orders', 'users'])
        ->name('admin.reports.export');

    Route::middleware(['backend.role:sales_agent'])->get('sales/dashboard', [SalesDashboardController::class, 'index'])
        ->name('sales.dashboard');

    Route::middleware(['backend.role:order_manager'])->get('order-manager/dashboard', [OrderManagerController::class, 'dashboard'])
        ->name('order-manager.dashboard');

    Route::middleware(['backend.role:product_controller'])->group(function () {
        Route::get('product-controller/dashboard', [ProductControllerDashboardController::class, 'index'])
            ->name('product-controller.dashboard');
        Route::get('product-controller/{module}', [ProductControllerModuleController::class, 'show'])
            ->whereIn('module', ['variants', 'packaging', 'moq', 'customization', 'notifications'])
            ->name('product-controller.module');
    });

    // Sales Agent + Admin: Inquiries list, Quotation workflow, and Chat
    Route::middleware(['backend.role:sales_agent,admin'])->group(function () {
        Route::get('inquiries', [SalesAgentController::class, 'inquiries'])->name('inquiries.index');
        Route::get('quotations', [SalesAgentController::class, 'quotations'])->name('quotations.index');
        Route::get('quotations/create', [SalesAgentController::class, 'createQuotation'])->name('quotations.create');
        Route::post('quotations', [SalesAgentController::class, 'storeQuotation'])->name('quotations.store');
        Route::post('quotations/{id}/accept', [SalesAgentController::class, 'acceptQuotation'])->name('quotations.accept');
        Route::post('quotations/{id}/reject-payment', [SalesAgentController::class, 'rejectPayment'])->name('quotations.reject-payment');

        // Chat: one thread per inquiry
        Route::get('conversations/with/{user_id}', [ChatController::class, 'openConversationWith'])->name('chat.with-user');
        Route::get('inquiries/{inquiry_id}/chat', [ChatController::class, 'show'])->name('chat.show');
        Route::post('inquiries/{inquiry_id}/chat', [ChatController::class, 'send'])->name('chat.send');
        Route::post('inquiries/{inquiry_id}/chat/archive', [ChatController::class, 'archive'])->name('chat.archive');
        Route::delete('inquiries/{inquiry_id}/chat/archive', [ChatController::class, 'restore'])->name('chat.restore');
        Route::get('archived-chats', [SalesAgentController::class, 'archivedChats'])->name('archived-chats.index');
    });

    // Order Manager + Admin: Orders list and status updates
    Route::middleware(['backend.role:order_manager,admin'])->group(function () {
        Route::get('orders', [OrderManagerController::class, 'index'])->name('orders.index');
        Route::patch('orders/{id}/status', [OrderManagerController::class, 'updateStatus'])->name('orders.update-status');
        Route::patch('orders/{id}/tracking', [OrderManagerController::class, 'updateTracking'])->name('orders.update-tracking');
    });

    // Admin-only. backend.role checks the SPECIFIC role, not just "logged
    // in" - a sales agent hitting these URLs gets a 403, not the page.
    Route::middleware(['backend.role:admin'])->group(function () {
        Route::post('inquiries/{inquiry_id}/chat/close', [ChatController::class, 'closeConversation'])->name('chat.close');
        Route::delete('inquiries/{inquiry_id}/chat/close', [ChatController::class, 'reopenConversation'])->name('chat.reopen');
        Route::post('inquiries/{inquiry_id}/chat/messages/{message_id}/hide', [ChatController::class, 'hideMessage'])->name('chat.messages.hide');
        Route::get('moderation/messages', [ChatController::class, 'hiddenMessages'])->name('moderation.messages.index');
        Route::delete('moderation/messages/{message_id}', [ChatController::class, 'restoreMessage'])->name('moderation.messages.restore');
        Route::get('users', [UserManagementController::class, 'index'])->name('users.index');
        Route::get('users/create', [UserManagementController::class, 'create'])->name('users.create');
        Route::post('users', [UserManagementController::class, 'store'])->name('users.store');
        Route::get('users/{id}/edit', [UserManagementController::class, 'edit'])->name('users.edit');
        Route::put('users/{id}', [UserManagementController::class, 'update'])->name('users.update');
        Route::patch('users/{id}/toggle-active', [UserManagementController::class, 'toggleActive'])->name('users.toggle-active');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
