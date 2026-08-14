<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

/**
 * Stub controller for file upload endpoints.
 * TODO: Implement file upload logic for inquiries and orders.
 */
class FileUploadController extends Controller
{
    public function uploadDesign(Request $request, $inquiry_id)
    {
        return response()->json(['message' => 'Upload design not yet implemented.'], 501);
    }

    public function uploadReceipt(Request $request, $order_id)
    {
        return response()->json(['message' => 'Upload receipt not yet implemented.'], 501);
    }
}
