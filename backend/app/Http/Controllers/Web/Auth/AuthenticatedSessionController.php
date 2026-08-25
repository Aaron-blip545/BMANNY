<?php

namespace App\Http\Controllers\Web\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Support\RoleDashboard;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     *
     * Now uses Auth::attempt() directly against the local database
     * instead of proxying to the backend API.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        // Authenticate first — this throws a ValidationException on bad
        // credentials, which Inertia catches and returns as form errors.
        $request->authenticate();

        // Only after a successful login: regenerate the session ID to
        // prevent session fixation, and if there was a prior session
        // (e.g. a different user), clear it entirely.
        $request->session()->regenerate();

        $dashboardRoute = RoleDashboard::routeNameFor($request->user('web')?->role);

        return redirect()->route($dashboardRoute);
    }

    /**
     * Log the user out.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
