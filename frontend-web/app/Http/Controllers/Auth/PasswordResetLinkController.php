<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\BackendApi;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        BackendApi::post('/forgot-password', [
            'email' => $request->email,
        ]);

        return back()->with('status', 'If that email exists in our system, a reset link has been sent.');
    }
}