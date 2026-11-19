<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ProductRequestReview;
use Inertia\Inertia;
use Inertia\Response;

class ProductControllerDashboardController extends Controller
{
    public function index(): Response
    {
        $reviews = ProductRequestReview::with([
            'inquiry.client',
            'inquiry.customizations',
            'productType',
            'requestedVariant',
        ])->latest()->get();

        return Inertia::render('product-controller/index', [
            'stats' => [
                'pending' => $reviews->where('status', 'pending')->count(),
                'available' => $reviews->where('status', 'available')->count(),
                'alternative' => $reviews->where('status', 'alternative')->count(),
                'unavailable' => $reviews->where('status', 'unavailable')->count(),
            ],
            'recentRequests' => $reviews->take(8)->map(fn (ProductRequestReview $review) => [
                'id' => $review->product_request_review_id,
                'inquiryId' => $review->inquiry_id,
                'businessName' => $review->inquiry?->client?->business_name ?? 'Customer',
                'requestedConfiguration' => $review->requestedVariant?->name
                    ?? $review->productType?->name
                    ?? ($review->inquiry?->customizations->pluck('selected_package')->filter()->join(', ') ?: 'Package inquiry'),
                'status' => $review->status,
                'submittedAt' => $review->created_at?->format('M d, Y g:i A'),
            ])->values(),
        ]);
    }
}
