<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Inquiry;
use App\Models\InquiryCustomization;
use Illuminate\Support\Facades\DB;

class InquiryController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'business_client_id' => 'required|exists:users,user_id',
            'customizations' => 'required|array',
            'customizations.*.packaging_type' => 'required|string', // Sachet, Pouch, Bottle, Box
            'customizations.*.packaging_finish' => 'nullable|string', // Matte, Glossy, Foil
            'customizations.*.serving_size' => 'nullable|string',
            'customizations.*.formulation_notes' => 'nullable|string',
            'customizations.*.client_notes' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            // Create Parent B2B Inquiry
            $inquiry = Inquiry::create([
                'business_client_id' => $request->business_client_id,
                'status' => 'Pending Review',
            ]);

            // Save Customization & Packaging Requirements
            foreach ($request->customizations as $cust) {
                InquiryCustomization::create([
                    'inquiry_id' => $inquiry->inquiry_id,
                    'customization_type' => $cust['customization_type'] ?? 'Custom Rebrand & Packaging',
                    'packaging_type' => $cust['packaging_type'],
                    'packaging_finish' => $cust['packaging_finish'] ?? null,
                    'serving_size' => $cust['serving_size'] ?? null,
                    'formulation_notes' => $cust['formulation_notes'] ?? null,
                    'client_notes' => $cust['client_notes'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Rebranding inquiry and customization specs submitted successfully.',
                'inquiry' => $inquiry->load('customizations'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'error' => 'Failed to process inquiry.',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}