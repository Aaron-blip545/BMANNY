<?php

namespace App\Http\Controllers;

use App\Models\ProductReview;
use App\Models\ProductType;
use Illuminate\Http\Request;

class ProductReviewController extends Controller
{
    private function formatReview(ProductReview $review): array
    {
        $user = $review->user;
        $author = trim($review->author_name ?: ($user?->full_name ?? 'Verified Client'));
        $parts = preg_split('/\s+/', $author) ?: [];
        $initials = strtoupper(substr(implode('', array_map(fn ($w) => $w[0] ?? '', $parts)), 0, 2)) ?: 'VC';

        $avatarUrl = null;
        $rawPic = $user?->businessClient?->profile_pic
            ?? $user?->profile_picture
            ?? $user?->profile_pic
            ?? null;
        if (! empty($rawPic)) {
            $avatarUrl = str_starts_with($rawPic, 'http')
                ? $rawPic
                : asset('storage/' . ltrim($rawPic, '/'));
        }

        $photos = [];
        if (is_array($review->photos)) {
            foreach ($review->photos as $path) {
                if (is_string($path) && $path !== '') {
                    $photos[] = str_starts_with($path, 'http')
                        ? $path
                        : asset('storage/' . ltrim($path, '/'));
                }
            }
        }

        $isEdited = $review->updated_at && $review->created_at
            && $review->updated_at->diffInSeconds($review->created_at) >= 5;

        return [
            'id'         => (string) $review->product_review_id,
            'user_id'    => (int) $review->user_id,
            'author'     => $author,
            'avatar'     => $initials,
            'avatar_url' => $avatarUrl,
            'rating'     => (int) $review->rating,
            'comment'    => $review->comment,
            'photos'     => $photos,
            'created_at' => $review->created_at?->toIso8601String(),
            'updated_at' => $review->updated_at?->toIso8601String(),
            'is_edited'  => $isEdited,
        ];
    }

    public function index(int $product_type_id)
    {
        $reviews = ProductReview::with(['user.businessClient'])
            ->where('product_type_id', $product_type_id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ProductReview $r) => $this->formatReview($r))
            ->values();

        return response()->json($reviews);
    }

    public function store(Request $request, int $product_type_id)
    {
        ProductType::findOrFail($product_type_id);

        $validated = $request->validate([
            'rating'      => 'required|integer|min:1|max:5',
            'comment'     => 'required|string|max:2000',
            'author_name' => 'nullable|string|max:120',
            'photos'      => 'nullable|array|max:4',
            'photos.*'    => 'image|max:5120',
        ]);

        $storedPhotos = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $file) {
                if ($file && $file->isValid()) {
                    $storedPhotos[] = $file->store('review-photos', 'public');
                }
            }
        }

        $user = $request->user();
        $review = ProductReview::create([
            'product_type_id' => $product_type_id,
            'user_id'         => $user->user_id,
            'author_name'     => trim((string) ($validated['author_name'] ?? '')) ?: ($user->full_name ?? 'Verified Client'),
            'rating'          => (int) $validated['rating'],
            'comment'         => trim($validated['comment']),
            'photos'          => ! empty($storedPhotos) ? $storedPhotos : null,
        ]);

        $review->load('user.businessClient');

        return response()->json($this->formatReview($review), 201);
    }

    public function update(Request $request, int $review_id)
    {
        $review = ProductReview::with('user')->findOrFail($review_id);
        $user = $request->user();

        if ((int) $review->user_id !== (int) $user->user_id && $user->role !== 'admin') {
            return response()->json(['message' => 'You can only edit your own review.'], 403);
        }

        $validated = $request->validate([
            'rating'        => 'required|integer|min:1|max:5',
            'comment'       => 'required|string|max:2000',
            'author_name'   => 'nullable|string|max:120',
            'keep_photos'   => 'nullable|array|max:4',
            'keep_photos.*' => 'string',
            'photos'        => 'nullable|array|max:4',
            'photos.*'      => 'image|max:5120',
        ]);

        $finalPhotos = [];
        if (isset($validated['keep_photos']) && is_array($validated['keep_photos'])) {
            foreach ($validated['keep_photos'] as $existingUrl) {
                // Convert full /storage/... URL back to relative path when possible
                if (preg_match('#/storage/(.+)$#', $existingUrl, $m)) {
                    $finalPhotos[] = $m[1];
                } elseif (! str_starts_with($existingUrl, 'http')) {
                    $finalPhotos[] = $existingUrl;
                }
            }
        }

        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $file) {
                if ($file && $file->isValid() && count($finalPhotos) < 4) {
                    $finalPhotos[] = $file->store('review-photos', 'public');
                }
            }
        }

        $review->update([
            'author_name' => trim((string) ($validated['author_name'] ?? '')) ?: $review->author_name,
            'rating'      => (int) $validated['rating'],
            'comment'     => trim($validated['comment']),
            'photos'      => ! empty($finalPhotos) ? $finalPhotos : null,
        ]);

        $review->refresh()->load('user.businessClient');

        return response()->json($this->formatReview($review));
    }

    public function destroy(Request $request, int $review_id)
    {
        $review = ProductReview::findOrFail($review_id);
        $user = $request->user();

        if ((int) $review->user_id !== (int) $user->user_id && $user->role !== 'admin') {
            return response()->json(['message' => 'You can only delete your own review.'], 403);
        }

        $review->delete();

        return response()->json(['message' => 'Review deleted.']);
    }
}
