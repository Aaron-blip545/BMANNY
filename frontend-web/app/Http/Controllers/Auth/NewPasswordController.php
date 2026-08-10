<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\BackendApi;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class NewPasswordController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|confirmed|min:6',
        ]);

        $response = BackendApi::post('/reset-password', [
            'email' => $request->email,
            'token' => $request->token,
            'password' => $request->password,
            'password_confirmation' => $request->password_confirmation,
        ]);

        if ($response->failed()) {
            throw ValidationException::withMessages([
                'email' => $response->json('message', 'This password reset token is invalid or has expired.'),
            ]);
        }

        return to_route('login')->with('status', 'Your password has been reset.');
    }
}