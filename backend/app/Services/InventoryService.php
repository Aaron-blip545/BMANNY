<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InventoryService
{
    /**
     * Calculate and return all required raw materials and their total quantities
     * needed for an order based on its ordered items and product customizations.
     *
     * @param Order $order
     * @return array<int, array{product: Product, quantity: int}> Keyed by product_id
     */
    public static function calculateRequiredMaterials(Order $order): array
    {
        // Ensure relationships are loaded
        $order->loadMissing(['items.product', 'quotation.inquiry.customizations']);

        $required = []; // [product_id => ['product' => Product, 'quantity' => int]]

        // 1. Direct Order Items (if any attached to the order)
        if ($order->items && $order->items->isNotEmpty()) {
            foreach ($order->items as $item) {
                if ($item->product_id && $item->quantity > 0) {
                    $product = $item->product ?: Product::find($item->product_id);
                    if ($product) {
                        $pId = $product->product_id;
                        if (!isset($required[$pId])) {
                            $required[$pId] = [
                                'product'  => $product,
                                'quantity' => 0,
                            ];
                        }
                        $required[$pId]['quantity'] += (int) $item->quantity;
                    }
                }
            }
        }

        // 2. Customization Requirements from InquiryCustomization
        $customizations = $order->quotation?->inquiry?->customizations;
        if ($customizations && $customizations->isNotEmpty()) {
            foreach ($customizations as $cust) {
                $qty = self::parseQuantity($cust->serving_size, $cust->client_notes, $cust->formulation_notes);

                // Identify Flavor material
                $flavorName = self::extractFlavorName($cust->client_notes, $cust->formulation_notes);
                if ($flavorName) {
                    $flavorProduct = self::findProductByName($flavorName, 'Flavors');
                    if ($flavorProduct) {
                        $pId = $flavorProduct->product_id;
                        if (!isset($required[$pId])) {
                            $required[$pId] = [
                                'product'  => $flavorProduct,
                                'quantity' => 0,
                            ];
                        }
                        $required[$pId]['quantity'] += $qty;
                    }
                }

                // Identify Packaging Type material
                if (!empty($cust->packaging_type)) {
                    $packagingProduct = self::findProductByName($cust->packaging_type, 'Packaging Types');
                    if ($packagingProduct) {
                        $pId = $packagingProduct->product_id;
                        if (!isset($required[$pId])) {
                            $required[$pId] = [
                                'product'  => $packagingProduct,
                                'quantity' => 0,
                            ];
                        }
                        $required[$pId]['quantity'] += $qty;
                    }
                }

                // Identify Container Material
                if (!empty($cust->packaging_finish)) {
                    $containerProduct = self::findProductByName($cust->packaging_finish, 'Container Materials');
                    if ($containerProduct) {
                        $pId = $containerProduct->product_id;
                        if (!isset($required[$pId])) {
                            $required[$pId] = [
                                'product'  => $containerProduct,
                                'quantity' => 0,
                            ];
                        }
                        $required[$pId]['quantity'] += $qty;
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
            /** @var Product $product */
            $product = Product::find($pId);
            $stockAvailable = $product ? (int) $product->stock_quantity : 0;
            $needed = $item['quantity'];

            if ($stockAvailable < $needed) {
                $shortages[] = [
                    'product_id' => $pId,
                    'name'       => $product ? $product->name : ($item['product']->name ?? 'Unknown Item'),
                    'required'   => $needed,
                    'available'  => $stockAvailable,
                    'shortage'   => $needed - $stockAvailable,
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
     * Deduct raw materials required for an order.
     * Throws an exception if inventory is insufficient.
     *
     * @param Order $order
     * @return array Summary of deducted items
     * @throws \Exception
     */
    public static function deductOrderMaterials(Order $order): array
    {
        $availability = self::checkInventoryAvailability($order);

        if (!$availability['can_fulfill']) {
            $shortageDescriptions = array_map(function ($s) {
                return "{$s['name']} (Required: {$s['required']}, Available: {$s['available']})";
            }, $availability['shortages']);

            $msg = "Insufficient raw materials in inventory to start production: " . implode(', ', $shortageDescriptions);
            throw new \Exception($msg);
        }

        $deducted = [];

        foreach ($availability['required'] as $pId => $item) {
            $needed = (int) $item['quantity'];
            $product = Product::lockForUpdate()->find($pId);

            if (!$product) {
                throw new \Exception("Product #{$pId} not found in inventory.");
            }

            if ($product->stock_quantity < $needed) {
                throw new \Exception("Insufficient stock for {$product->name} (Required: {$needed}, Available: {$product->stock_quantity}).");
            }

            $product->decrement('stock_quantity', $needed);

            $deducted[] = [
                'product_id'   => $product->product_id,
                'name'         => $product->name,
                'deducted_qty' => $needed,
                'remaining'    => $product->stock_quantity,
            ];

            Log::info("Inventory deducted for Order #{$order->order_id}: {$needed} units of {$product->name} (Remaining: {$product->stock_quantity})");
        }

        return $deducted;
    }

    /**
     * Parse ordered units quantity from serving size or notes.
     */
    public static function parseQuantity(?string $servingSize, ?string $clientNotes = null, ?string $formulationNotes = null): int
    {
        if ($servingSize) {
            // E.g. "500g × 100 units" or "500g x 200"
            if (preg_match('/[×x]\s*(\d+)/iu', $servingSize, $matches)) {
                return max(1, (int) $matches[1]);
            }
            // E.g. "100 units"
            if (preg_match('/(\d+)\s*units?/iu', $servingSize, $matches)) {
                return max(1, (int) $matches[1]);
            }
            // Pure number
            if (preg_match('/^\s*(\d+)\s*$/', $servingSize, $matches)) {
                return max(1, (int) $matches[1]);
            }
        }

        $notes = trim(($clientNotes ?? '') . ' ' . ($formulationNotes ?? ''));
        if ($notes) {
            if (preg_match('/(?:qty|quantity):\s*(\d+)/iu', $notes, $matches)) {
                return max(1, (int) $matches[1]);
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
