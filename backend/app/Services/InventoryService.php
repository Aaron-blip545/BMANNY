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

    /** Alias used by ProductionPlanningService. */
    public static function resolveOrderProductType(Order $order): ?ProductType
    {
        return self::resolveProductType($order);
    }

    /**
     * Resolve the actual pouch production quantity for an order.
     */
    public static function resolveProductionQuantity(Order $order): int
    {
        $order->loadMissing([
            'items',
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

        if ($order->items && $order->items->isNotEmpty()) {
            $sum = (int) $order->items->sum('quantity');
            if ($sum > 0) {
                return $sum;
            }
        }

        return 1;
    }

    /** Alias used by ProductionPlanningService. */
    public static function parseOrderQuantity(Order $order): int
    {
        return self::resolveProductionQuantity($order);
    }

    /**
     * Calculate and return all required raw materials and their total quantities
     * needed for an order based on its product BOM (product_recipes), custom herbal BOM,
     * ordered items, and legacy customization fallbacks.
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

        $required = [];

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
            $required[$pId]['quantity'] = round($required[$pId]['quantity'] + $qty, 6);
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

        // 2. Product Bill of Materials (BOM / product_recipes)
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
                    if ($needed > 0) {
                        $addRequired($rawMaterial, $needed);
                    }
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
                if ($needed > 0) {
                    $addRequired($rawMaterial, $needed);
                }
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
                            $addRequired($flavorProduct, $qty);
                        }
                    }

                    if (! empty($cust->packaging_type)) {
                        $packagingProduct = self::findProductByName($cust->packaging_type, 'Packaging Types');
                        if ($packagingProduct) {
                            $addRequired($packagingProduct, $qty);
                        }
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
            $uom = $product?->unit_of_measure ?: ($item['product']->unit_of_measure ?? 'units');

            if ($stockAvailable + 1e-6 < $needed) {
                $shortages[] = [
                    'product_id'        => $pId,
                    'name'              => $product ? $product->name : ($item['product']->name ?? 'Unknown Item'),
                    'unit'              => $uom,
                    'unit_of_measure'   => $uom,
                    'required'          => $needed,
                    'available'         => $stockAvailable,
                    'shortage'          => round($needed - $stockAvailable, 6),
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
     * Deduct raw materials required for an order based on its product BOM.
     * Idempotent: skips cleanly if inventory was already deducted for this order.
     * Throws an exception if inventory is insufficient or a required material is expired.
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

            throw new \Exception('Insufficient raw materials in inventory: ' . implode(', ', $shortageDescriptions));
        }

        $expired = array_filter($availability['expiry_risks'], fn ($r) => $r['expiry_status'] === 'expired');
        if (! empty($expired)) {
            $names = array_map(fn ($r) => "{$r['name']} (expired {$r['expiration_date']})", $expired);
            throw new \Exception('Cannot start production using expired raw materials: ' . implode(', ', $names));
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
            if (preg_match('/([\d,]+)\s*(?:units?|pouches?|pcs|pieces?)/iu', $servingSize, $matches)) {
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

    /**
     * Read-only pre-check for Sales Agents to indicate whether a quotation can be
     * accepted & converted into an Order right now (payment submitted, not expired,
     * and sufficient BOM raw-material stock in inventory).
     */
    public static function checkQuotationAcceptability(\App\Models\Quotation $quotation): array
    {
        if ($quotation->is_expired || $quotation->status === 'expired') {
            return [
                'can_accept' => false,
                'status'     => 'expired',
                'reason'     => 'Quotation has expired',
                'shortages'  => [],
            ];
        }

        if ($quotation->status !== 'sent') {
            return [
                'can_accept' => false,
                'status'     => $quotation->status,
                'reason'     => 'Quotation is already ' . $quotation->status,
                'shortages'  => [],
            ];
        }

        if (! $quotation->payment_submitted_at) {
            return [
                'can_accept' => false,
                'status'     => 'awaiting_payment',
                'reason'     => 'Awaiting client payment proof',
                'shortages'  => [],
            ];
        }

        $virtualOrder = new Order([
            'quotation_id' => $quotation->quotation_id,
            'total_amount' => $quotation->total_amount,
            'status'       => 'approved',
        ]);
        $virtualOrder->setRelation('quotation', $quotation);
        $virtualOrder->setRelation('items', collect());

        $requiredMaterials = self::calculateRequiredMaterials($virtualOrder);
        $shortages = [];

        foreach ($requiredMaterials as $item) {
            /** @var Product $product */
            $product = $item['product'];
            $needed = round((float) $item['quantity'], 4);
            $available = round((float) $product->stock_quantity, 4);
            if ($available < $needed) {
                $shortages[] = [
                    'sku'       => $product->sku ?? $product->name,
                    'name'      => $product->name,
                    'required'  => $needed,
                    'available' => $available,
                    'unit'      => $product->unit_of_measure ?? 'units',
                ];
            }
        }

        if (! empty($shortages)) {
            $count = count($shortages);
            return [
                'can_accept' => false,
                'status'     => 'insufficient_stock',
                'reason'     => "Insufficient raw material stock ({$count} " . ($count === 1 ? 'item' : 'items') . ' short)',
                'shortages'  => $shortages,
            ];
        }

        return [
            'can_accept' => true,
            'status'     => 'ready',
            'reason'     => 'Stock verified & ready to create order',
            'shortages'  => [],
        ];
    }
}
