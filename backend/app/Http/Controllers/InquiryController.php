<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Inquiry;
use App\Models\InquiryCustomization;
use Illuminate\Support\Facades\DB; // Required for database transactions

class InquiryController extends Controller
{
    public function store(Request $request)
    {
        // 1. Start the transaction wrap
        DB::beginTransaction();

        try {
            // 2. Create the main parent Inquiry record
            $inquiry = Inquiry::create([
                'business_client_id' => $request->business_client_id,
                'status' => 'Pending',
            ]);

            // 3. Check if the app sent any custom design requests
            if ($request->has('customizations')) {
                
                // 4. Loop through each design and save it to the new table
                foreach ($request->customizations as $customization) {
                    InquiryCustomization::create([
                        'inquiry_id' => $inquiry->inquiry_id,
                        'customization_type' => $customization['customization_type'],
                        'placement' => $customization['placement'] ?? null,
                        'client_notes' => $customization['client_notes'] ?? null,
                        'design_file_path' => $customization['design_file_path'] ?? null, 
                    ]);
                }
            }

            // 5. If everything successfully saved, commit it permanently
            DB::commit();

            return response()->json([
                'message' => 'B2B Inquiry and custom designs submitted successfully.',
                'inquiry_id' => $inquiry->inquiry_id
            ], 201);

        } catch (\Exception $e) {
            // 6. If anything fails, wipe the attempt and return the error
            DB::rollBack();
            
            return response()->json([
                'error' => 'Inquiry submission failed.',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}