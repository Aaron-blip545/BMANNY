<?php

namespace App\Http\Controllers;

use App\Models\InquiryCustomization;
use Illuminate\Http\Request;

/**
 * Stub controller for file upload endpoints.
 * TODO: Implement file upload logic for inquiries and orders.
 */
class FileUploadController extends Controller
{
    public function uploadDesign(Request $request, $inquiry_id)
    {
        $request->validate([
            'design' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $customization = InquiryCustomization::where('inquiry_id', $inquiry_id)
            ->whereHas('inquiry', fn ($query) => $query->where('client_id', $request->user()->businessClient?->client_id))
            ->firstOrFail();

        $path = $request->file('design')->store('inquiry-designs', 'public');
        $customization->update(['design_file_path' => $path]);

        return response()->json([
            'message' => 'Brand artwork uploaded.',
            'design_url' => asset('storage/' . $path),
        ]);
    }

    public function uploadReceipt(Request $request, $order_id)
    {
        return response()->json(['message' => 'Upload receipt not yet implemented.'], 501);
    }
}
