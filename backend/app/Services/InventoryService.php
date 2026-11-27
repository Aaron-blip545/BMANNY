<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductType;
use Illuminate\Support\Facades\Log;

class InventoryService
{
    /**
     * Resolve the finished ProductType associated with an order (if any).
     */
    public static function resolveOrderProductType(Order $order): ?ProductType
    {
        $order->loadMissing(['quotation.inquiry.customizations']);

        $inquiry = $order->quotation?->inquiry;

        // Try matching product_code (e.g. FP-0001) or product name from customization notes
        $customizations = $inquiry?->customizations ?? collect();
        foreach ($customizations as $cust) {
            $notes = trim(($cust->client_notes ?? '') . ' ' . ($cust->formulation_notes ?? ''));
            if (preg_match('/\((FP-\d+)\)/i', $notes, $m)) {
                $pt = ProductType::with('recipes.rawMaterial')->where('product_code', strtoupper($m[1]))->first();
                if ($pt) {
                    return $pt;
                }
            }
            if (preg_match('/Finished Product:\s*([^|(]+)/i', $notes, $m)) {
                $name = trim($m[1]);
                if ($name !== '') {
                    $pt = ProductType::with('recipes.rawMaterial')
                        ->whereRaw('LOWER(name) = ?', [strtolower($name)])
                        ->first();
                    if ($pt) {
                        return $pt;
                    }
                }
            }
        }

        // Try quotation product_specification array
        $spec = $order->quotation?->product_specification;
        if (is_array($spec)) {
            $productName = $spec['product_name'] ?? $spec['product'] ?? null;
            if ($productName) {
                $pt = ProductType::with('recipes.rawMaterial')
                    ->whereRaw('LOWER(name) = ?', [strtolower(trim((string) $productName))])
                    ->first();
                if ($pt) {
                    return $pt;
                }
            }
        }

        return null;
    }

    /**
     * Determine total ordered units/pouches for an order.
     */
    public static function parseOrderQuantity(Order $order): int
    {
        $order->loadMissing(['items', 'quotation.inquiry.customizations']);

        $inquiry = $order->quotation?->inquiry;
        if ($inquiry && (int) ($inquiry->reorder_batch_quantity ?? 0) > 0) {
            return (int) $inquiry->reorder_batch_quantity;
        }

        if ($order->items && $order->items->isNotEmpty()) {
            $sum = (int) $order->items->sum('quantity');
            if ($sum > 0) {
                return $sum;
            }
        }

        $customizations = $inquiry?->customizations ?? collect();
        $total = 0;
        foreach ($customizations as $cust) {
            $total += self::parseQuantity($cust->serving_size, $cust->client_notes, $cust->formulation_notes);
        }

        return $total > 0 ? $total : 100;
    }

    /**
     * Calculate and return all required raw materials and their total quantities
     * needed for an order based on direct order items, finished-product BOM recipes,
     * and legacy customization notes.
     *
     * @param Order $order
     * @return array<int, array{product: Product, quantity: float}> Keyed by product_id
     */
    public static function calculateRequiredMaterials(Order $order): array
    {
        $order->loadMissing(['items.product', 'quotation.inquiry.customizations']);

        $required = []; // [product_id => ['product' => Product, 'quantity' => float]]

        $addRequired = function (Product $product, float $qty) use (&$required): void {
            if ($qty <= 0) {
                return;
            }
            $pId = $product->product_id;
            if (! isset($required[$pId])) {
                $required[$pId] = [
                    'product'  => $product,
                    'quantity' => 0.0,
                ];
            }
            $required[$pId]['quantity'] = round($required[$pId]['quantity'] + $qty, 4);
        };

        // 1. Direct Order Items (if any attached to the order)
        if ($order->items && $order->items->isNotEmpty()) {
            foreach ($order->items as $item) {
                if ($item->product_id && $item->quantity > 0) {
                    $product = $item->product ?: Product::find($item->product_id);
                    if ($product) {
                        $addRequired($product, (float) $item->quantity);
                    }
                }
            }
        }

        // 2. Finished Product BOM Recipes (ProductType -> product_recipes -> rawMaterial)
        $productType = self::resolveOrderProductType($order);
        if ($productType && $productType->recipes->isNotEmpty()) {
            $orderQty = self::parseOrderQuantity($order);
            foreach ($productType->recipes as $recipe) {
                $rawMaterial = $recipe->rawMaterial;
                if ($rawMaterial && (float) $recipe->quantity_per_unit > 0) {
                    $addRequired($rawMaterial, (float) $recipe->quantity_per_unit * $orderQty);
                }
            }
        }

        // 3. Customization Requirements from InquiryCustomization (legacy flavor / packaging matching)
        $customizations = $order->quotation?->inquiry?->customizations;
        if ($customizations && $customizations->isNotEmpty()) {
            foreach ($customizations as $cust) {
                $qty = self::parseQuantity($cust->serving_size, $cust->client_notes, $cust->formulation_notes);

                // Identify Flavor material
                $flavorName = self::extractFlavorName($cust->client_notes, $cust->formulation_notes);
                if ($flavorName) {
                    $flavorProduct = self::findProductByName($flavorName, 'Flavors');
                    if ($flavorProduct) {
                        $addRequired($flavorProduct, (float) $qty);
                    }
                }

                // Identify Packaging Type material (only if not already added by BOM)
                if (! empty($cust->packaging_type)) {
                    $packagingProduct = self::findProductByName($cust->packaging_type, 'Packaging Types');
                    if ($packagingProduct && ! isset($required[$packagingProduct->product_id])) {
                        $addRequired($packagingProduct, (float) $qty);
                    }
                }
            }
        }

        return $required;
    }

    /**
     * Check if there is enough inventory (and non-expired stock) for all required raw materials.
     *
     * @param Order $order
     * @return array{can_fulfill: bool, shortages: array, expiry_risks: array, required: array}
     */
    public static function checkInventoryAvailability(Order $order): array
    {
        $requiredMaterials = self::calculateRequiredMaterials($order);
        $shortages = [];
        $expiryRisks = [];

        foreach ($requiredMaterials as $pId => $item) {
            /** @var Product|null $product */
            $product = Product::find($pId);
            $stockAvailable = $product ? (float) $product->stock_quantity : 0.0;
            $needed = (float) $item['quantity'];
            $unit = $product?->unit_of_measure ?? 'pcs';

            if ($stockAvailable < $needed) {
                $shortages[] = [
                    'product_id'        => $pId,
                    'name'              => $product ? $product->name : ($item['product']->name ?? 'Unknown Item'),
                    'unit'              => $unit,
                    'required'          => $needed,
                    'available'         => $stockAvailable,
                    'shortage'          => round($needed - $stockAvailable, 4),
                    'restock_lead_days' => (int) ($product?->restock_lead_days ?? 7),
                ];
            }

            if ($product && in_array($product->expiry_status, ['expired', 'expiring_soon'], true)) {
                $expiryRisks[] = [
                    'product_id'        => $pId,
                    'name'              => $product->name,
                    'expiration_date'   => $product->expiration_date?->format('Y-m-d'),
                    'expiry_status'     => $product->expiry_status,
                    'days_until_expiry' => $product->days_until_expiry,
                ];
            }
        }

        return [
            'can_fulfill'  => empty($shortages),
            'shortages'    => $shortages,
            'expiry_risks' => $expiryRisks,
            'required'     => $requiredMaterials,
        ];
    }

    /**
     * Deduct raw materials required for an order.
     * Throws an exception if inventory is insufficient or a required material is expired.
     *
     * @param Order $order
     * @return array Summary of deducted items
     * @throws \Exception
     */
    public static function deductOrderMaterials(Order $order): array
    {
        $availability = self::checkInventoryAvailability($order);

        if (! $availability['can_fulfill']) {
            $shortageDescriptions = array_map(function ($s) {
                return "{$s['name']} (Required: {$s['required']} {$s['unit']}, Available: {$s['available']} {$s['unit']})";
            }, $availability['shortages']);

            $msg = 'Insufficient raw materials in inventory to start production: ' . implode(', ', $shortageDescriptions);
            throw new \Exception($msg);
        }

        $expired = array_filter($availability['expiry_risks'], fn ($r) => $r['expiry_status'] === 'expired');
        if (! empty($expired)) {
            $names = array_map(fn ($r) => "{$r['name']} (expired {$r['expiration_date']})", $expired);
            throw new \Exception('Cannot start production using expired raw materials: ' . implode(', ', $names));
        }

        $deducted = [];

        foreach ($availability['required'] as $pId => $item) {
            $needed = (float) $item['quantity'];
            $product = Product::lockForUpdate()->find($pId);

            if (! $product) {
                throw new \Exception("Product #{$pId} not found in inventory.");
            }

            if ((float) $product->stock_quantity < $needed) {
                throw new \Exception("Insufficient stock for {$product->name} (Required: {$needed}, Available: {$product->stock_quantity}).");
            }

            $product->stock_quantity = round((float) $product->stock_quantity - $needed, 4);
            $product->save();

            $deducted[] = [
                'product_id'   => $product->product_id,
                'name'         => $product->name,
                'deducted_qty' => $needed,
                'remaining'    => $product->stock_quantity,
            ];

            Log::info("Inventory deducted for Order #{$order->order_id}: {$needed} {$product->unit_of_measure} of {$product->name} (Remaining: {$product->stock_quantity})");
        }

        return $deducted;
    }

    /**
     * Parse ordered units quantity from serving size or notes.
     */
    public static function parseQuantity(?string $servingSize, ?string $clientNotes = null, ?string $formulationNotes = null): int
    {
        if ($servingSize) {
            // E.g. "500g × 100 units" or "120 g × 100 pouches"
            if (preg_match('/[×x]\s*([\d,]+)/iu', $servingSize, $matches)) {
                return max(1, (int) str_replace(',', '', $matches[1]));
            }
            // E.g. "100 units" or "100 pouches"
            if (preg_match('/([\d,]+)\s*(?:units?|pouches?|pcs|pieces?)/iu', $servingSize, $matches)) {
                return max(1, (int) str_replace(',', '', $matches[1]));
            }
            // Pure number
            if (preg_match('/^\s*([\d,]+)\s*$/', $servingSize, $matches)) {
                return max(1, (int) str_replace(',', '', $matches[1]));
            }
        }

        $notes = trim(($clientNotes ?? '') . ' ' . ($formulationNotes ?? ''));
        if ($notes) {
            if (preg_match('/(?:qty|quantity|moq):\s*([\d,]+)/iu', $notes, $matches)) {
                return max(1, (int) str_replace(',', '', $matches[1]));
            }
        }

        return 1;
    }

    /**
     * Extract flavor name from client notes or formulation notes.
     */
    public static function extractFlavorName(?string $clientNotes, ?string $formulationNotes = null): ?string
    {
        $combined = ($clientNotes ?? '') . ' ' . ($formulationNotes ?? '');
        if (preg_match('/Flavor:\s*([^|,\n]+)/iu', $combined, $matches)) {
            return trim($matches[1]);
        }
        return null;
    }

    /**
     * Helper to find a product by name with optional category preference.
     */
    public static function findProductByName(string $name, ?string $categoryName = null): ?Product
    {
        $cleanName = trim($name);
        if ($cleanName === '') {
            return null;
        }

        $query = Product::whereRaw('LOWER(name) = ?', [strtolower($cleanName)]);

        if ($categoryName) {
            $productWithCategory = (clone $query)->whereHas('category', function ($q) use ($categoryName) {
                $q->whereRaw('LOWER(name) = ?', [strtolower($categoryName)]);
            })->first();

            if ($productWithCategory) {
                return $productWithCategory;
            }
        }

        return $query->first();
    }
}
