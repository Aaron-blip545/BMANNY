<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * Update the authenticated mobile customer's account and business profile.
     * Email and role remain controlled by the account-management workflow.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'full_name'        => ['required', 'string', 'min:2', 'max:100'],
            'phone_number'     => [
                'nullable',
                'string',
                'max:20',
                'regex:/^\+?[0-9][0-9\s\-]{8,18}[0-9]$/',
                Rule::unique('users', 'phone_number')->ignore($user->user_id, 'user_id'),
            ],
            'business_address' => ['nullable', 'string', 'max:255'],
        ], [
            'phone_number.regex' => 'Please enter a valid 10–15 digit phone number.',
        ]);

        $user->update([
            'full_name'    => trim($validated['full_name']),
            'phone_number' => isset($validated['phone_number']) && trim($validated['phone_number']) !== ''
                ? trim($validated['phone_number'])
                : null,
        ]);

        $user->businessClient()->update([
            'contact_person'   => trim($validated['full_name']),
            'business_address' => isset($validated['business_address']) && trim($validated['business_address']) !== ''
                ? trim($validated['business_address'])
                : null,
        ]);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user'    => $user->fresh()->load('businessClient'),
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
            'message'         => 'Profile picture updated successfully.',
            'profile_pic_url' => $client->fresh()->profile_pic_url,
            'user'            => $request->user()->fresh()->load('businessClient'),
        ]);
    }

    // Registration
    public function register(Request $request)
    {
        $validated = $request->validate([
            'full_name'        => ['required', 'string', 'min:2', 'max:100'],
            'email'            => ['required', 'string', 'lowercase', 'email', 'max:150', 'unique:users,email'],
            'phone_number'     => [
                'required',
                'string',
                'max:20',
                'regex:/^\+?[0-9][0-9\s\-]{8,18}[0-9]$/',
                'unique:users,phone_number',
            ],
            'password'         => [
                'required',
                'string',
                'confirmed',
                Password::min(8)->mixedCase(),
                'regex:/[\d\W_]/',
            ],
            'business_name'    => ['required', 'string', 'max:150'],
            'business_type'    => ['required', 'string', 'max:100'],
            'contact_person'   => ['required', 'string', 'max:100'],
            'business_address' => ['required', 'string', 'max:255'],
        ], [
            'phone_number.regex' => 'Please enter a valid 10–15 digit phone number.',
            'password.regex'     => 'The password must include at least one number or special character.',
        ]);

        // Wrapped in a transaction: if creating the BusinessClient fails for
        // any reason, the User creation rolls back too — we never want a
        // User to exist without a matching business profile.
        $user = DB::transaction(function () use ($validated) {
            $user = User::create([
                'full_name'    => trim($validated['full_name']),
                'email'        => strtolower(trim($validated['email'])),
                'password'     => Hash::make($validated['password']),
                'phone_number' => trim($validated['phone_number']),
                // Staff accounts should only be created by an existing Admin
                // through a protected endpoint, not through public self-registration.
                'role'         => 'customer',
            ]);

            $user->businessClient()->create([
                'business_name'    => trim($validated['business_name']),
                'business_type'    => trim($validated['business_type']),
                'contact_person'   => trim($validated['contact_person']),
                'business_address' => trim($validated['business_address']),
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
            'email'    => ['required', 'email', 'max:150'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', strtolower(trim($request->email)))->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'Your account has been deactivated. Contact an administrator.',
            ], 403);
        }

        $token = $user->createToken('bmanny-auth-token')->plainTextToken;

        // Load businessClient so mobile app gets the business profile
        // without needing a separate /user request.
        $user->load('businessClient');

        return response()->json([
            'message' => 'Login successful',
            'user'    => $user,
            'token'   => $token,
        ], 200);
    }

    // Mobile / API Password Reset Request
    public function forgotPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:150'],
        ]);

        $user = User::where('email', strtolower(trim($validated['email'])))->first();

        if ($user) {
            $token = Str::random(64);

            DB::table('password_reset_tokens')->where('email', $user->email)->delete();
            DB::table('password_reset_tokens')->insert([
                'email'      => $user->email,
                'token'      => Hash::make($token),
                'created_at' => now(),
            ]);

            try {
                Mail::raw(
                    "Your BMANNY password reset token is:\n\n{$token}\n\nThis token expires in 60 minutes. If you didn't request this, ignore this email.",
                    function ($message) use ($user) {
                        $message->to($user->email)->subject('Reset your BMANNY password');
                    }
                );
            } catch (\Throwable $e) {
                // Avoid exposing mail transport internals in public endpoint responses.
            }
        }

        return response()->json([
            'message' => 'If that email exists in our system, password reset instructions have been sent.',
        ]);
    }

    // Mobile / API Password Reset Completion
    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'token'    => ['required', 'string'],
            'email'    => ['required', 'email', 'max:150'],
            'password' => [
                'required',
                'string',
                'confirmed',
                Password::min(8)->mixedCase(),
                'regex:/[\d\W_]/',
            ],
        ], [
            'password.regex' => 'The password must include at least one number or special character.',
        ]);

        $email = strtolower(trim($validated['email']));
        $record = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (! $record || ! Hash::check($validated['token'], $record->token)) {
            return response()->json(['message' => 'This password reset token is invalid.'], 422);
        }

        if (now()->diffInMinutes($record->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            return response()->json(['message' => 'This password reset token has expired. Please request a new one.'], 422);
        }

        $user = User::where('email', $email)->first();
        if ($user) {
            $user->password = Hash::make($validated['password']);
            $user->save();
        }

        DB::table('password_reset_tokens')->where('email', $email)->delete();

        return response()->json(['message' => 'Your password has been reset successfully.']);
    }
}
