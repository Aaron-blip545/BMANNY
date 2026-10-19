<?php

namespace App\Services;

use App\Models\Inquiry;

class QuotationSpecificationService
{
    /**
     * Creates the customer-safe snapshot from Product Control's approved
     * recommendation. Raw-material stock, BOM costs, and internal notes are
     * deliberately excluded.
     */
    public static function forInquiry(Inquiry $inquiry): ?array
    {
        $inquiry->loadMissing([
            'productRequestReview.suggestedVariant.currentMoq',
            'productRequestReview.suggestedVariant.productType',
            'productRequestReview.suggestedPackaging',
        ]);

        $review = $inquiry->productRequestReview;
        $variant = $review?->suggestedVariant;
        $product = $variant?->productType;

        if (! $product) {
            return null;
        }

        return [
            'product_name' => $product->name,
            'product_code' => $product->product_code,
            'variant_name' => $variant->name,
            'sku' => $variant->sku,
            'net_weight' => $product->net_weight,
            'packaging_details' => $product->packaging_specification,
            'selected_packaging' => $review?->suggestedPackaging?->name,
            'label_details' => $product->label_specification,
            'ingredients' => $product->formulation_notes,
            'minimum_order_quantity' => $variant->currentMoq?->min_quantity,
            'suggested_unit_price' => $product->suggested_srp,
            'lead_time_days' => $product->lead_time_days,
            'presentation_image' => $product->image_url,
        ];
    }
}
