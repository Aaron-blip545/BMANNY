<?php

namespace App\Services;

use App\Models\ClientPackagingBalance;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductPackage;
use App\Models\ProductType;
use Illuminate\Support\Facades\Log;

class InventoryService
{
    /**
     * Resolve the finished ProductType (and its BOM) associated with an Order.
     */
    public static function resolveProductType(Order $order): ?ProductType
    {
        $order->loadMissing([
            'quotation.inquiry.customizations',
            'quotation.inquiry.productRequestReview.suggestedVariant.productType',
        ]);

        // 1. From Product Control review's linked variant
        $fromReview = $order->quotation?->inquiry?->productRequestReview?->suggestedVariant?->productType;
        if ($fromReview) {
            return $fromReview;
        }

        // 2. From quotation product_specification snapshot
        $spec = $order->quotation?->product_specification;
        if (is_array($spec)) {
            if (! empty($spec['product_code'])) {
                $found = ProductType::where('product_code', $spec['product_code'])->first();
                if ($found) {
                    return $found;
                }
            }
            if (! empty($spec['product_name'])) {
                $found = ProductType::whereRaw('LOWER(name) = ?', [strtolower(trim($spec['product_name']))])->first();
                if ($found) {
                    return $found;
                }
            }
        }

        // 3. From Finished Product note in customization client_notes
        $firstCust = $order->quotation?->inquiry?->customizations?->first();
        if ($firstCust && $firstCust->client_notes) {
            if (preg_match('/Finished Product:\s*([^|]+)/i', $firstCust->client_notes, $matches)) {
                $raw = trim($matches[1]);
                if (preg_match('/\(([A-Z0-9-]+)\)\s*$/i', $raw, $codeMatch)) {
                    $found = ProductType::where('product_code', $codeMatch[1])->first();
                    if ($found) {
                        return $found;
                    }
                }
                $cleanName = trim(preg_replace('/\s*\([^)]*\)$/', '', $raw));
                if ($cleanName !== '') {
                    $found = ProductType::whereRaw('LOWER(name) = ?', [strtolower($cleanName)])->first();
                    if ($found) {
                        return $found;
                    }
                }
            }
        }

        // 4. From selected package slug (starter / gold / elite)
        $slug = $firstCust?->selected_package;
        if ($slug) {
            $pkg = ProductPackage::with('productType')
                ->whereRaw('LOWER(slug) = ?', [strtolower(trim($slug))])
                ->where('is_active', true)
                ->first();
            if ($pkg?->productType) {
                return $pkg->productType;
            }
        }

        return null;
    }

    /**
     * Resolve the actual pouch production quantity for an order.
     * - Repeat-batch reorder / packaging replenishment: reorder_batch_quantity
     * - Gold initial order: 150 pouches (initial batch produced; remaining 4,850 stay stored)
     * - Elite initial order: 350 pouches (initial batch produced; remaining 9,650 stay stored)
     * - Starter / custom order: parsed quantity from serving_size / client_notes (e.g. 100–500)
     */
    public static function resolveProductionQuantity(Order $order): int
    {
        $order->loadMissing([
            'quotation.inquiry.customizations',
            'quotation.inquiry.packagingBalance',
        ]);

        $inquiry = $order->quotation?->inquiry;
        if ($inquiry) {
            if (in_array($inquiry->inquiry_type, ['reorder_batch', 'packaging_replenishment'], true)) {
                $batchQty = (int) ($inquiry->reorder_batch_quantity ?: $inquiry->packagingBalance?->batch_min_quantity ?: 0);
                if ($batchQty > 0) {
                    return $batchQty;
                }
            }

            $firstCust = $inquiry->customizations?->first();
            $slug = strtolower((string) ($firstCust?->selected_package ?? ''));
            $rules = ClientPackagingBalance::rulesForSlug($slug);
            if ($rules && ! empty($rules['batch_min_quantity'])) {
                return (int) $rules['batch_min_quantity'];
            }

            if ($firstCust) {
                return self::parseQuantity(
                    $firstCust->serving_size,
                    $firstCust->client_notes,
                    $firstCust->formulation_notes
                );
            }
        }

        return 1;
    }

    /**
     * Calculate and return all required raw materials and their total quantities
     * needed for an order based on its product BOM (product_recipes), ordered items,
     * and legacy customization fallbacks.
     *
     * @param Order $order
     * @return array<int, array{product: Product, quantity: float}> Keyed by product_id
     */
    public static function calculateRequiredMaterials(Order $order): array
    {
        $order->loadMissing([
            'items.product',
            'quotation.inquiry.customizations',
            'quotation.inquiry.packagingBalance',
            'quotation.inquiry.productRequestReview.suggestedVariant.productType',
        ]);

        $required = []; // [product_id => ['product' => Product, 'quantity' => float]]

        // 1. Direct Order Items (if any attached to the order)
        if ($order->items && $order->items->isNotEmpty()) {
            foreach ($order->items as $item) {
                if ($item->product_id && $item->quantity > 0) {
                    $product = $item->product ?: Product::find($item->product_id);
                    if ($product) {
                        $pId = $product->product_id;
                        if (! isset($required[$pId])) {
                            $required[$pId] = [
                                'product'  => $product,
                                'quantity' => 0.0,
                            ];
                        }
                        $required[$pId]['quantity'] = round($required[$pId]['quantity'] + (float) $item->quantity, 6);
                    }
                }
            }
        }

        // 2. Product Bill of Materials (BOM / product_recipes)
        // Global Main BOM (package_slug IS NULL) + Per-Client Inquiry Custom Herbal BOM (Gold +6 / Elite +8)
        $productType = self::resolveProductType($order);
        $productionQty = self::resolveProductionQuantity($order);
        $hasBom = false;

        if ($productType) {
            $selectedSlug = strtolower((string) ($order->quotation?->inquiry?->customizations?->first()?->selected_package ?? ''));
            $recipesQuery = $productType->recipes()->with('rawMaterial');
            if (in_array($selectedSlug, ['gold', 'elite'], true)) {
                $recipesQuery->where(function ($q) use ($selectedSlug) {
                    $q->whereNull('package_slug')->orWhere('package_slug', $selectedSlug);
                });
            } else {
                $recipesQuery->whereNull('package_slug');
            }

            $recipes = $recipesQuery->get();

            if ($recipes->isNotEmpty()) {
                $hasBom = true;

                foreach ($recipes as $recipe) {
                    $rawMaterial = $recipe->rawMaterial;
                    if (! $rawMaterial) {
                        continue;
                    }

                    $needed = round((float) $recipe->quantity_per_unit * (float) $productionQty, 6);
                    if ($needed <= 0) {
                        continue;
                    }

                    $pId = $rawMaterial->product_id;
                    if (! isset($required[$pId])) {
                        $required[$pId] = [
                            'product'  => $rawMaterial,
                            'quantity' => 0.0,
                        ];
                    }
                    $required[$pId]['quantity'] = round($required[$pId]['quantity'] + $needed, 6);
                }
            }
        }

        // 2b. Per-Client Inquiry Custom Herbal BOM (stored on product_request_reviews.custom_bom_items)
        $order->loadMissing([
            'quotation.inquiry.productRequestReview',
            'quotation.inquiry.packagingBalance.sourceOrder.quotation.inquiry.productRequestReview',
        ]);
        $customBomItems = $order->quotation?->inquiry?->productRequestReview?->custom_bom_items;
        if (empty($customBomItems) && in_array($order->quotation?->inquiry?->inquiry_type, ['reorder_batch', 'packaging_replenishment'], true)) {
            $customBomItems = $order->quotation?->inquiry?->packagingBalance?->sourceOrder?->quotation?->inquiry?->productRequestReview?->custom_bom_items;
        }

        if (is_array($customBomItems) && ! empty($customBomItems)) {
            $hasBom = true;
            foreach ($customBomItems as $customItem) {
                $pId = isset($customItem['product_id']) ? (int) $customItem['product_id'] : 0;
                $qtyPerUnit = isset($customItem['quantity_per_unit']) ? (float) $customItem['quantity_per_unit'] : 0.0;
                if ($pId <= 0 || $qtyPerUnit <= 0) {
                    continue;
                }
                $rawMaterial = Product::find($pId);
                if (! $rawMaterial) {
                    continue;
                }
                $needed = round($qtyPerUnit * (float) $productionQty, 6);
                if ($needed <= 0) {
                    continue;
                }
                if (! isset($required[$pId])) {
                    $required[$pId] = [
                        'product'  => $rawMaterial,
                        'quantity' => 0.0,
                    ];
                }
                $required[$pId]['quantity'] = round($required[$pId]['quantity'] + $needed, 6);
            }
        }

        // 3. Legacy fallback (only when no BOM recipes exist on the product)
        if (! $hasBom) {
            $customizations = $order->quotation?->inquiry?->customizations;
            if ($customizations && $customizations->isNotEmpty()) {
                foreach ($customizations as $cust) {
                    $qty = (float) self::parseQuantity($cust->serving_size, $cust->client_notes, $cust->formulation_notes);

                    $flavorName = self::extractFlavorName($cust->client_notes, $cust->formulation_notes);
                    if ($flavorName) {
                        $flavorProduct = self::findProductByName($flavorName, 'Flavors');
                        if ($flavorProduct) {
                            $pId = $flavorProduct->product_id;
                            if (! isset($required[$pId])) {
                                $required[$pId] = [
                                    'product'  => $flavorProduct,
                                    'quantity' => 0.0,
                                ];
                            }
                            $required[$pId]['quantity'] = round($required[$pId]['quantity'] + $qty, 6);
                        }
                    }

                    if (! empty($cust->packaging_type)) {
                        $packagingProduct = self::findProductByName($cust->packaging_type, 'Packaging Types');
                        if ($packagingProduct) {
                            $pId = $packagingProduct->product_id;
                            if (! isset($required[$pId])) {
                                $required[$pId] = [
                                    'product'  => $packagingProduct,
                                    'quantity' => 0.0,
                                ];
                            }
                            $required[$pId]['quantity'] = round($required[$pId]['quantity'] + $qty, 6);
                        }
                    }
                }
            }
        }

        return $required;
    }

    /**
     * Check if there is enough inventory for all required raw materials.
     *
     * @param Order $order
     * @return array{can_fulfill: bool, shortages: array, required: array}
     */
    public static function checkInventoryAvailability(Order $order): array
    {
        $requiredMaterials = self::calculateRequiredMaterials($order);
        $shortages = [];

        foreach ($requiredMaterials as $pId => $item) {
            /** @var Product|null $product */
            $product = Product::find($pId);
            $stockAvailable = $product ? (float) $product->stock_quantity : 0.0;
            $needed = (float) $item['quantity'];
            $uom = $product?->unit_of_measure ?: ($item['product']->unit_of_measure ?? 'units');

            if ($stockAvailable + 1e-6 < $needed) {
                $shortages[] = [
                    'product_id'      => $pId,
                    'name'            => $product ? $product->name : ($item['product']->name ?? 'Unknown Item'),
                    'unit_of_measure' => $uom,
                    'required'        => $needed,
                    'available'       => $stockAvailable,
                    'shortage'        => round($needed - $stockAvailable, 6),
                ];
            }
        }

        return [
            'can_fulfill' => empty($shortages),
            'shortages'   => $shortages,
            'required'    => $requiredMaterials,
        ];
    }

    /**
     * Deduct raw materials required for an order based on its product BOM.
     * Idempotent: skips cleanly if inventory was already deducted for this order.
     * Throws an exception if inventory is insufficient.
     *
     * @param Order $order
     * @return array Summary of deducted items
     * @throws \Exception
     */
    public static function deductOrderMaterials(Order $order): array
    {
        if ($order->inventory_deducted_at !== null) {
            return [];
        }

        $availability = self::checkInventoryAvailability($order);

        if (! $availability['can_fulfill']) {
            $shortageDescriptions = array_map(function ($s) {
                $req = rtrim(rtrim(number_format((float) $s['required'], 4, '.', ''), '0'), '.');
                $avail = rtrim(rtrim(number_format((float) $s['available'], 4, '.', ''), '0'), '.');
                return "{$s['name']} (Required: {$req} {$s['unit_of_measure']}, Available: {$avail} {$s['unit_of_measure']})";
            }, $availability['shortages']);

            $msg = 'Insufficient raw materials in inventory: ' . implode(', ', $shortageDescriptions);
            throw new \Exception($msg);
        }

        $deducted = [];
        $lowStockAlerts = [];

        foreach ($availability['required'] as $pId => $item) {
            $needed = round((float) $item['quantity'], 6);
            $product = Product::lockForUpdate()->find($pId);

            if (! $product) {
                throw new \Exception("Raw material #{$pId} not found in inventory.");
            }

            $currentStock = (float) $product->stock_quantity;
            $uom = $product->unit_of_measure ?: 'units';

            if ($currentStock + 1e-6 < $needed) {
                $req = rtrim(rtrim(number_format($needed, 4, '.', ''), '0'), '.');
                $avail = rtrim(rtrim(number_format($currentStock, 4, '.', ''), '0'), '.');
                throw new \Exception("Insufficient stock for {$product->name} (Required: {$req} {$uom}, Available: {$avail} {$uom}).");
            }

            $newStock = max(0.0, round($currentStock - $needed, 6));
            $product->stock_quantity = $newStock;
            $product->save();

            $deducted[] = [
                'product_id'      => $product->product_id,
                'name'            => $product->name,
                'unit_of_measure' => $uom,
                'deducted_qty'    => $needed,
                'remaining'       => $newStock,
            ];

            Log::info("BOM inventory deducted for Order #{$order->order_id}: {$needed} {$uom} of {$product->name} (Remaining: {$newStock} {$uom})");

            $reorderLevel = (float) ($product->reorder_level ?? 0);
            if ($newStock <= 0 || ($reorderLevel > 0 && $newStock <= $reorderLevel)) {
                $lowStockAlerts[] = "{$product->name} ({$newStock} {$uom} remaining)";
            }
        }

        $order->inventory_deducted_at = now();
        $order->save();

        if (! empty($lowStockAlerts)) {
            try {
                NotificationService::sendToRoles(
                    ['product_controller', 'admin'],
                    'inventory',
                    'Low Raw Material Stock Alert',
                    "After Order #{$order->order_id} BOM deduction, low stock detected: " . implode(', ', $lowStockAlerts),
                    ['order_id' => $order->order_id]
                );
            } catch (\Throwable $e) {
                Log::warning('Low stock notification failed: ' . $e->getMessage());
            }
        }

        return $deducted;
    }

    /**
     * Parse ordered units quantity from serving size or notes.
     */
    public static function parseQuantity(?string $servingSize, ?string $clientNotes = null, ?string $formulationNotes = null): int
    {
        if ($servingSize) {
            if (preg_match('/[×x]\s*([\d,]+)/iu', $servingSize, $matches)) {
                return max(1, (int) str_replace(',', '', $matches[1]));
            }
            if (preg_match('/([\d,]+)\s*(?:units?|pouches?)/iu', $servingSize, $matches)) {
                return max(1, (int) str_replace(',', '', $matches[1]));
            }
            if (preg_match('/^\s*([\d,]+)\s*$/', $servingSize, $matches)) {
                return max(1, (int) str_replace(',', '', $matches[1]));
            }
        }

        $notes = trim(($clientNotes ?? '') . ' ' . ($formulationNotes ?? ''));
        if ($notes) {
            if (preg_match('/(?:qty|quantity|moq|batch quantity):\s*([\d,]+)/iu', $notes, $matches)) {
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
