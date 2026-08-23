<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->filled('role') && $request->input('role') !== 'all') {
            $query->where('role', $request->input('role'));
        }

        return Inertia::render('users/index', [
            'users' => $query->get(),
            'activeRole' => $request->input('role', 'all'),
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
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6|confirmed',
            'role' => 'required|in:admin,sales_agent,product_controller,order_manager,customer',
            'phone_number' => 'nullable|string|max:20',
        ]);

        User::create([
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'phone_number' => $validated['phone_number'] ?? null,
        ]);

        return redirect()->route('users.index')->with('success', 'Account created.');
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
            'email' => 'required|email|unique:users,email,' . $user->user_id . ',user_id',
            'role' => 'required|in:admin,sales_agent,product_controller,order_manager,customer',
            'phone_number' => 'nullable|string|max:20',
            'password' => 'nullable|min:6|confirmed',
        ]);

        $user->full_name = $validated['full_name'];
        $user->email = $validated['email'];
        $user->role = $validated['role'];
        $user->phone_number = $validated['phone_number'] ?? $user->phone_number;

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return redirect()->route('users.index')->with('success', 'Account updated.');
    }

    public function toggleActive($id)
    {
        $user = User::findOrFail($id);
        $user->is_active = !$user->is_active;
        $user->save();

        return redirect()->route('users.index')->with('success', 'Status updated.');
    }
}
