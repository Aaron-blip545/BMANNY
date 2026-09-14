<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\CustomizationCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomizationController extends Controller
{
    public function index(): Response
    {
        $options = CustomizationCatalog::orderBy('name')->get();

        return Inertia::render('product-controller/customization', [
            'customizationOptions' => $options,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'               => 'required|string|max:150',
            'customization_type' => 'nullable|string|max:100',
            'description'        => 'nullable|string',
            'is_available'       => 'boolean',
        ]);

        CustomizationCatalog::create($data);

        return back()->with('success', 'Customization option added.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $option = CustomizationCatalog::findOrFail($id);

        $data = $request->validate([
            'name'               => 'required|string|max:150',
            'customization_type' => 'nullable|string|max:100',
            'description'        => 'nullable|string',
            'is_available'       => 'boolean',
        ]);

        $option->update($data);

        return back()->with('success', 'Customization option updated.');
    }

    public function destroy(int $id): RedirectResponse
    {
        CustomizationCatalog::findOrFail($id)->delete(); // hard delete

        return back()->with('success', 'Customization option removed.');
    }
}
