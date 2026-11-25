<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

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
            'full_name' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:150', 'unique:users,email'],
            'password' => [
                'required',
                'string',
                'confirmed',
                Password::min(8)->mixedCase(),
                'regex:/[\d\W_]/',
            ],
            'phone_number' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^\+?[0-9][0-9\s\-]{8,18}[0-9]$/',
                Rule::unique(User::class, 'phone_number'),
            ],
            'role' => ['required', 'in:admin,customer,sales_agent,product_controller,order_manager'],
        ]);

        $user = User::create([
            'full_name' => trim($validated['full_name']),
            'email' => strtolower(trim($validated['email'])),
            'password' => Hash::make($validated['password']),
            'phone_number' => ! empty($validated['phone_number']) ? trim($validated['phone_number']) : null,
            'role' => $validated['role'],
            'is_active' => true,
        ]);

        return response()->json(['message' => 'Account created.', 'user' => $user], 201);
    }

    // PUT /api/admin/users/{user} - edit an existing account
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:150', Rule::unique(User::class, 'email')->ignore($user->user_id, 'user_id')],
            'phone_number' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^\+?[0-9][0-9\s\-]{8,18}[0-9]$/',
                Rule::unique(User::class, 'phone_number')->ignore($user->user_id, 'user_id'),
            ],
            'role' => ['required', 'in:admin,customer,sales_agent,product_controller,order_manager'],
            'password' => [
                'nullable',
                'string',
                'confirmed',
                Password::min(8)->mixedCase(),
                'regex:/[\d\W_]/',
            ],
        ]);

        $user->full_name = $validated['full_name'];
        $user->email = $validated['email'];
        $user->phone_number = $validated['phone_number'] ?? null;
        $user->role = $validated['role'];

        if (! empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
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

        if (! $user->is_active) {
            $user->tokens()->delete();
        }

        return response()->json(['message' => 'Status updated.', 'user' => $user]);
    }
}
