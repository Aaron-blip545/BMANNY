<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\BackendApi;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
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
     * Step 1 of password reset: generate a token and "send" it.
     *
     * NOTE: we don't use Laravel's built-in Password::sendResetLink() broker
     * here, because it assumes the password column is called "password" -
     * ours is "password_hash" (see the users migration). Hand-rolling this
     * against the same password_reset_tokens table avoids fighting that.
     */
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        // Always return the same response whether the email exists or not -
        // this stops the endpoint being used to check who has an account.
        if ($user) {
            $token = Str::random(64);

            DB::table('password_reset_tokens')->where('email', $user->email)->delete();
            DB::table('password_reset_tokens')->insert([
                'email' => $user->email,
                'token' => Hash::make($token),
                'created_at' => now(),
            ]);

            // MAIL_MAILER=log by default (see backend/.env) - this writes
            // the "email" to storage/logs/laravel.log instead of actually
            // sending it, so you can test this whole flow with zero email
            // account setup. Switch MAIL_MAILER to smtp/resend later for
            // real delivery.
            Mail::raw(
                "Your BMANNY password reset token is:\n\n{$token}\n\nThis token expires in 60 minutes. If you didn't request this, ignore this email.",
                function ($message) use ($user) {
                    $message->to($user->email)->subject('Reset your BMANNY password');
                }
            );
        }

        return response()->json([
            'message' => 'If that email exists in our system, a reset link has been sent.',
        ]);
    }

    /**
     * Step 2 of password reset: verify the token and set a new password.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|min:6|confirmed',
        ]);

        $record = DB::table('password_reset_tokens')->where('email', $request->email)->first();

        if (! $record || ! Hash::check($request->token, $record->token)) {
            throw ValidationException::withMessages([
                'email' => ['This password reset token is invalid.'],
            ]);
        }

        if (now()->diffInMinutes($record->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();

            throw ValidationException::withMessages([
                'email' => ['This password reset token has expired. Please request a new one.'],
            ]);
        }

        $user = User::where('email', $request->email)->first();
        $user->password_hash = Hash::make($request->password);
        $user->save();

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Password reset successfully.']);
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
