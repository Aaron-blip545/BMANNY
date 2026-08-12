<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

// All routes for this controller are wrapped in role:admin middleware
// (see routes/api.php) - only an Admin can reach any method here.
class UserController extends Controller
{
    // GET /api/admin/users - list every account, optionally filtered by role
    public function index(Request $request)
    {
        $query = User::orderBy('created_at', 'desc');

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        return response()->json($query->get());
    }

    // POST /api/admin/users - create a staff (or customer) account
    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:users,email',
            'password' => 'required|min:6|confirmed',
            'phone_number' => 'nullable|string|max:20',
            'role' => 'required|in:admin,customer,sales_agent,product_controller,order_manager',
        ]);

        $user = User::create([
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'password_hash' => Hash::make($validated['password']),
            'phone_number' => $validated['phone_number'] ?? null,
            'role' => $validated['role'],
            'is_active' => true,
        ]);

        return response()->json(['message' => 'Account created.', 'user' => $user], 201);
    }

    // PUT /api/admin/users/{user} - edit an existing account
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:users,email,' . $user->user_id . ',user_id',
            'phone_number' => 'nullable|string|max:20',
            'role' => 'required|in:admin,customer,sales_agent,product_controller,order_manager',
            'password' => 'nullable|min:6|confirmed',
        ]);

        $user->full_name = $validated['full_name'];
        $user->email = $validated['email'];
        $user->phone_number = $validated['phone_number'] ?? null;
        $user->role = $validated['role'];

        if (! empty($validated['password'])) {
            $user->password_hash = Hash::make($validated['password']);
        }

        $user->save();

        return response()->json(['message' => 'Account updated.', 'user' => $user]);
    }

    // PATCH /api/admin/users/{user}/toggle-active - deactivate/reactivate
    // Deactivating instead of deleting keeps their inquiry/order history intact.
    public function toggleActive(User $user)
    {
        $user->is_active = ! $user->is_active;
        $user->save();

        return response()->json(['message' => 'Status updated.', 'user' => $user]);
    }
}