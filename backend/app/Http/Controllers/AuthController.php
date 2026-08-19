<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class AuthController extends Controller
{
    // Registration
    public function register(Request $request)
    {
        $request->validate([
            'full_name'        => 'required|string|max:100',
            'email'            => 'required|email|unique:users,email',
            'password'         => 'required|min:6|confirmed',
            'business_name'    => 'required|string|max:150',
            'business_type'    => 'required|string|max:100',
            'contact_person'   => 'required|string|max:100',
            'business_address' => 'required|string',
        ]);

        // Wrapped in a transaction: if creating the BusinessClient fails for
        // any reason, the User creation rolls back too — we never want a
        // User to exist without a matching business profile.
        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'full_name' => $request->full_name,
                'email'     => $request->email,
                'password'  => Hash::make($request->password),
                // FIXED: was `$request->role ?? 'customer'` - anyone hitting this
                // public endpoint could pass role: "admin" and self-promote.
                // Staff accounts (sales_agent, product_controller, order_manager,
                // admin) should only be created by an existing Admin through a
                // protected endpoint, not through public self-registration.
                'role'      => 'customer',
            ]);

            $user->businessClient()->create([
                'business_name'    => $request->business_name,
                'business_type'    => $request->business_type,
                'contact_person'   => $request->contact_person,
                'business_address' => $request->business_address,
            ]);

            return $user;
        });

        $token = $user->createToken('bmanny-auth-token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'user'    => $user->load('businessClient'),
            'token'   => $token,
        ], 201);
    }

    // Login
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.'
            ], 401);
        }

        $token = $user->createToken('bmanny-auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token
        ], 200);
    }
}