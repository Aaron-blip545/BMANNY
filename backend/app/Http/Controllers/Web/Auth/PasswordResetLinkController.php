<?php

namespace App\Http\Controllers\Web\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('auth/forgotpass', [
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        // Always return the same response whether the email exists or not
        if ($user) {
            $token = Str::random(64);

            DB::table('password_reset_tokens')->where('email', $user->email)->delete();
            DB::table('password_reset_tokens')->insert([
                'email' => $user->email,
                'token' => Hash::make($token),
                'created_at' => now(),
            ]);

            Mail::raw(
                "Your BMANNY password reset token is:\n\n{$token}\n\nThis token expires in 60 minutes. If you didn't request this, ignore this email.",
                function ($message) use ($user) {
                    $message->to($user->email)->subject('Reset your BMANNY password');
                }
            );
        }

        return back()->with('status', 'If that email exists in our system, a reset link has been sent.');
    }
}
