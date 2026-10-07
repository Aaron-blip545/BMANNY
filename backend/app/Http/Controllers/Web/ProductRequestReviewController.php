<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Inquiry;
use App\Models\PackagingOption;
use App\Models\ProductRequestReview;
use App\Models\ProductType;
use App\Models\ProductVariant;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductRequestReviewController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('product-controller/requests', [
            'requests' => ProductRequestReview::with([
                'inquiry.client.user', 'inquiry.customizations', 'productType', 'requestedVariant',
                'suggestedVariant.productType', 'suggestedPackaging', 'requester', 'reviewer',
            ])->latest()->get(),
            'productTypes' => ProductType::with(['variants' => fn ($query) => $query->available(), 'packagingOptions' => fn ($query) => $query->available()])
                ->active()->orderBy('name')->get(),
        ]);
    }

    public function submit(Request $request, int $inquiryId): RedirectResponse
    {
        $inquiry = Inquiry::findOrFail($inquiryId);
        $data = $request->validate([
            'product_type_id' => 'nullable|exists:product_types,product_type_id',
            'requested_variant_id' => 'nullable|exists:product_variants,variant_id',
            'request_notes' => 'nullable|string|max:2000',
        ]);

        ProductRequestReview::updateOrCreate(
            ['inquiry_id' => $inquiry->inquiry_id],
            [
                ...$data,
                'requested_by' => $request->user('web')->user_id,
                'status' => 'pending',
                'response_notes' => null,
                'suggested_variant_id' => null,
                'suggested_packaging_id' => null,
                'reviewed_by' => null,
                'reviewed_at' => null,
            ]
        );

        $inquiry->update(['status' => 'reviewed']);
        NotificationService::sendToRoles(['product_controller'], 'product_request', 'Product request awaiting review', "Inquiry #{$inquiry->inquiry_id} needs an availability review.", ['inquiry_id' => $inquiry->inquiry_id]);

        return back()->with('success', 'Product request sent to the Product Controller.');
    }

    public function review(Request $request, int $id): RedirectResponse
    {
        $review = ProductRequestReview::with('inquiry.client.user')->findOrFail($id);
        $data = $request->validate([
            'status' => 'required|in:available,alternative,unavailable',
            'suggested_variant_id' => 'nullable|exists:product_variants,variant_id',
            'suggested_packaging_id' => 'nullable|exists:packaging_options,packaging_id',
            'response_notes' => 'required|string|max:2000',
        ]);

        if ($data['status'] === 'alternative' && ! $data['suggested_variant_id'] && ! $data['suggested_packaging_id']) {
            return back()->withErrors(['status' => 'Choose at least one suggested variant or packaging option for an alternative.']);
        }

        $review->update([
            ...$data,
            'reviewed_by' => $request->user('web')->user_id,
            'reviewed_at' => now(),
        ]);

        if ($review->inquiry?->client?->user) {
            NotificationService::send(
                $review->inquiry->client->user->user_id,
                'product_request',
                'Product availability reviewed',
                "Your requested product configuration has been reviewed: {$data['status']}.",
                ['inquiry_id' => $review->inquiry_id]
            );
        }
        if ($review->requested_by) {
            NotificationService::send($review->requested_by, 'product_request', 'Product request reviewed', "Inquiry #{$review->inquiry_id} is {$data['status']}.", ['inquiry_id' => $review->inquiry_id]);
        }

        return back()->with('success', 'Availability response sent to Sales Agent.');
    }
}
