<?php

use App\Http\Controllers\Web\OrderManagerController;
use App\Http\Controllers\Web\ProductPageController;
use App\Http\Controllers\Web\SalesAgentController;
use App\Http\Controllers\Web\UserManagementController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['backend.auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('products', [ProductPageController::class, 'index'])->name('products.index');

    // Sales Agent + Admin: Inquiries list and Quotation creation
    Route::middleware(['backend.role:sales_agent,admin'])->group(function () {
        Route::get('inquiries', [SalesAgentController::class, 'inquiries'])->name('inquiries.index');
        Route::get('quotations/create', [SalesAgentController::class, 'createQuotation'])->name('quotations.create');
        Route::post('quotations', [SalesAgentController::class, 'storeQuotation'])->name('quotations.store');
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

