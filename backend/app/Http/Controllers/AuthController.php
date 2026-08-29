<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class AuthController extends Controller
{
    /**
     * Update the authenticated mobile customer's account and business profile.
     * Email and role remain controlled by the account-management workflow.
     */
    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:100'],
            'phone_number' => ['nullable', 'string', 'max:20'],
            'business_address' => ['nullable', 'string', 'max:255'],
        ]);

        $user = $request->user();
        $user->update([
            'full_name' => $validated['full_name'],
            'phone_number' => $validated['phone_number'] ?? null,
        ]);

        $user->businessClient()->update([
            'contact_person' => $validated['full_name'],
            'business_address' => $validated['business_address'] ?? null,
        ]);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user->fresh()->load('businessClient'),
        ]);
    }

    /** Store a customer's profile picture for use across the app. */
    public function updateProfilePicture(Request $request)
    {
        $request->validate([
            'profile_picture' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $client = $request->user()->businessClient;

        if (! $client) {
            return response()->json(['message' => 'A business profile is required before adding a profile picture.'], 422);
        }

        // Keep previous images intact rather than deleting user data during
        // an update. The database always points to the currently selected one.
        $path = $request->file('profile_picture')->store('profile-pictures', 'public');
        $client->update(['profile_pic' => $path]);

        return response()->json([
            'message' => 'Profile picture updated successfully.',
            'profile_pic_url' => $client->fresh()->profile_pic_url,
            'user' => $request->user()->fresh()->load('businessClient'),
        ]);
    }

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

        if (! $user->is_active) {
            return response()->json([
                'message' => 'Your account has been deactivated. Contact an administrator.',
            ], 403);
        }

        $token = $user->createToken('bmanny-auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token
        ], 200);
    }
}
