<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()->orderByDesc('created_at');

        if ($request->filled('role') && $request->input('role') !== 'all') {
            $query->where('role', $request->input('role'));
        }

        $allUsers = User::query()->select(['role', 'is_active'])->get();

        $roleCounts = [
            'all' => $allUsers->count(),
            'active' => $allUsers->where('is_active', true)->count(),
            'inactive' => $allUsers->where('is_active', false)->count(),
            'admin' => $allUsers->where('role', 'admin')->count(),
            'sales_agent' => $allUsers->where('role', 'sales_agent')->count(),
            'product_controller' => $allUsers->where('role', 'product_controller')->count(),
            'order_manager' => $allUsers->where('role', 'order_manager')->count(),
            'customer' => $allUsers->where('role', 'customer')->count(),
        ];

        return Inertia::render('users/index', [
            'users' => $query->get(),
            'activeRole' => $request->input('role', 'all'),
            'roleCounts' => $roleCounts,
        ]);
    }

    public function create()
    {
        return Inertia::render('users/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:150', 'unique:users,email'],
            'password' => [
                'required',
                'string',
                'confirmed',
                Password::min(8)->mixedCase(),
                'regex:/[\d\W_]/',
            ],
            'role' => ['required', 'in:admin,sales_agent,product_controller,order_manager,customer'],
            'phone_number' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^\+?[0-9][0-9\s\-]{8,18}[0-9]$/',
                Rule::unique(User::class, 'phone_number'),
            ],
        ], [
            'phone_number.regex' => 'Please enter a valid 10–15 digit phone number.',
            'password.regex' => 'The password must include at least one number or special character.',
        ]);

        User::create([
            'full_name' => trim($validated['full_name']),
            'email' => strtolower(trim($validated['email'])),
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'phone_number' => ! empty($validated['phone_number']) ? trim($validated['phone_number']) : null,
        ]);

        return redirect()->route('users.index')->with('success', 'Account created successfully.');
    }

    public function edit($id)
    {
        $user = User::findOrFail($id);

        return Inertia::render('users/edit', ['user' => $user]);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'full_name' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:150', Rule::unique(User::class, 'email')->ignore($user->user_id, 'user_id')],
            'role' => ['required', 'in:admin,sales_agent,product_controller,order_manager,customer'],
            'phone_number' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^\+?[0-9][0-9\s\-]{8,18}[0-9]$/',
                Rule::unique(User::class, 'phone_number')->ignore($user->user_id, 'user_id'),
            ],
            'password' => [
                'nullable',
                'string',
                'confirmed',
                Password::min(8)->mixedCase(),
                'regex:/[\d\W_]/',
            ],
        ], [
            'phone_number.regex' => 'Please enter a valid 10–15 digit phone number.',
            'password.regex' => 'The password must include at least one number or special character.',
        ]);

        $user->full_name = trim($validated['full_name']);
        $user->email = strtolower(trim($validated['email']));
        $user->role = $validated['role'];
        $user->phone_number = ! empty($validated['phone_number']) ? trim($validated['phone_number']) : null;

        if (! empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return redirect()->route('users.index')->with('success', 'Account updated successfully.');
    }

    public function toggleActive($id)
    {
        $user = User::findOrFail($id);
        $user->is_active = ! $user->is_active;
        $user->save();

        if (! $user->is_active) {
            // Immediately invalidate mobile sessions as well as blocking new logins.
            $user->tokens()->delete();
        }

        return redirect()->route('users.index')->with('success', $user->is_active ? 'Account reactivated.' : 'Account deactivated.');
    }
}
