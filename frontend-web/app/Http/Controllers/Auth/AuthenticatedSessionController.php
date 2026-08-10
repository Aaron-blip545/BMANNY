<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\BackendApi;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
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
     * CHANGED: this used to call Auth::attempt() against frontend-web's own
     * users table. It now calls backend's /api/login instead, since backend
     * is the single source of truth for who's allowed in and what role
     * they have. On success we store the Sanctum token it gives us in the
     * session - EnsureBackendAuthenticated checks for that token on every
     * protected page.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $response = BackendApi::post('/login', [
            'email' => $request->email,
            'password' => $request->password,
        ]);

        if ($response->failed()) {
            throw ValidationException::withMessages([
                'email' => 'These credentials do not match our records.',
            ]);
        }

        $data = $response->json();

        // Confirmed against backend's AuthController::login() - it returns
        // {message, user, token}.
        $request->session()->put('backend_token', $data['token']);
        $request->session()->put('backend_user', $data['user']);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Log the user out by simply forgetting the stored token.
     * There's nothing to tell backend - Sanctum tokens are stateless
     * until you explicitly revoke them, which is a nice-to-have for later
     * (call backend's /logout endpoint here once it exists).
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->session()->forget(['backend_token', 'backend_user']);
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
