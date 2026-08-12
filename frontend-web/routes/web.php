<?php

use App\Http\Controllers\ProductPageController;
use App\Http\Controllers\UserManagementController;
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