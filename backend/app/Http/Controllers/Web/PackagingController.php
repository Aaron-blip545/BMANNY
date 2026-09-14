<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\PackagingOption;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PackagingController extends Controller
{
    public function index(): Response
    {
        $options = PackagingOption::orderBy('name')->get();

        return Inertia::render('product-controller/packaging', [
            'packagingOptions' => $options,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'         => 'required|string|max:150',
            'description'  => 'nullable|string',
            'is_available' => 'boolean',
        ]);

        PackagingOption::create($data);

        return back()->with('success', 'Packaging option added.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $option = PackagingOption::findOrFail($id);

        $data = $request->validate([
            'name'         => 'required|string|max:150',
            'description'  => 'nullable|string',
            'is_available' => 'boolean',
        ]);

        $option->update($data);

        return back()->with('success', 'Packaging option updated.');
    }

    public function destroy(int $id): RedirectResponse
    {
        PackagingOption::findOrFail($id)->delete(); // hard delete

        return back()->with('success', 'Packaging option removed.');
    }
}
