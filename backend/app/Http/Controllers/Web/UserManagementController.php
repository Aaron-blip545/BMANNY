<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
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
            'full_name' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:users,email',
            'password' => 'required|min:6|confirmed',
            'role' => 'required|in:admin,sales_agent,product_controller,order_manager,customer',
            'phone_number' => ['nullable', 'string', 'max:20', Rule::unique(User::class, 'phone_number')],
        ]);

        User::create([
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'phone_number' => $validated['phone_number'] ?? null,
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
            'full_name' => 'required|string|max:100',
            'email' => ['required', 'email', 'max:150', Rule::unique(User::class, 'email')->ignore($user->user_id, 'user_id')],
            'role' => 'required|in:admin,sales_agent,product_controller,order_manager,customer',
            'phone_number' => ['nullable', 'string', 'max:20', Rule::unique(User::class, 'phone_number')->ignore($user->user_id, 'user_id')],
            'password' => 'nullable|min:6|confirmed',
        ]);

        $user->full_name = $validated['full_name'];
        $user->email = $validated['email'];
        $user->role = $validated['role'];
        $user->phone_number = $validated['phone_number'] ?? null;

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
