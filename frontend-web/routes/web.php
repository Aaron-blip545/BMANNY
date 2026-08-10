<?php

use App\Http\Controllers\ProductPageController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// CHANGED: 'auth' -> 'backend.auth'. frontend-web no longer has its own
// logged-in users - see EnsureBackendAuthenticated.
Route::middleware(['backend.auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // First real proof the connection works: this page's data comes
    // entirely from backend's /api/products, not from frontend-web's DB.
    Route::get('products', [ProductPageController::class, 'index'])->name('products.index');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
