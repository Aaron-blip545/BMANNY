<?php

namespace App\Http\Controllers;

use App\Services\BackendApi;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        $response = BackendApi::get('/admin/users', $request->only('role'));

        return Inertia::render('users/index', [
            'users' => $response->successful() ? $response->json() : [],
            'activeRole' => $request->input('role', 'all'),
        ]);
    }

    public function create()
    {
        return Inertia::render('users/create');
    }

    public function store(Request $request)
    {
        $response = BackendApi::post('/admin/users', $request->all());

        if ($response->failed()) {
            return back()->withErrors($response->json('errors', ['email' => $response->json('message')]));
        }

        return redirect()->route('users.index')->with('success', 'Account created.');
    }

    public function edit($id)
    {
        // backend has no GET /admin/users/{id} yet, but index already
        // returns everyone - simplest to reuse that rather than add a
        // new endpoint just for this.
        $response = BackendApi::get('/admin/users');
        $users = $response->successful() ? $response->json() : [];
        $user = collect($users)->firstWhere('user_id', (int) $id);

        return Inertia::render('users/edit', ['user' => $user]);
    }

    public function update(Request $request, $id)
    {
        $response = BackendApi::put("/admin/users/{$id}", $request->all());

        if ($response->failed()) {
            return back()->withErrors($response->json('errors', ['email' => $response->json('message')]));
        }

        return redirect()->route('users.index')->with('success', 'Account updated.');
    }

    public function toggleActive($id)
    {
        BackendApi::patch("/admin/users/{$id}/toggle-active");

        return redirect()->route('users.index')->with('success', 'Status updated.');
    }
}