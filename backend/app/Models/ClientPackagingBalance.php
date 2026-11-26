<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientPackagingBalance extends Model
{
    protected $table = 'client_packaging_balances';

    protected $primaryKey = 'balance_id';

    protected $fillable = [
        'client_id',
        'source_order_id',
        'brand_name',
        'package_slug',
        'total_pouches',
        'used_pouches',
        'remaining_pouches',
        'production_unit_cost',
        'packaging_unit_cost',
        'batch_min_quantity',
        'cylinder_paid',
        'expires_at',
        'status',
    ];

    protected $casts = [
        'total_pouches' => 'integer',
        'used_pouches' => 'integer',
        'remaining_pouches' => 'integer',
        'production_unit_cost' => 'decimal:2',
        'packaging_unit_cost' => 'decimal:2',
        'batch_min_quantity' => 'integer',
        'cylinder_paid' => 'boolean',
        'expires_at' => 'datetime',
    ];

    public const PACKAGE_RULES = [
        'gold' => [
            'total_pouches' => 5000,
            'batch_min_quantity' => 150,
            'production_unit_cost' => 55.00,
            'packaging_unit_cost' => 10.00,
        ],
        'elite' => [
            'total_pouches' => 10000,
            'batch_min_quantity' => 350,
            'production_unit_cost' => 50.00,
            'packaging_unit_cost' => 10.00,
        ],
    ];

    public static function rulesForSlug(?string $slug): ?array
    {
        if (! $slug) {
            return null;
        }

        return self::PACKAGE_RULES[strtolower($slug)] ?? null;
    }

    public function client()
    {
        return $this->belongsTo(BusinessClient::class, 'client_id', 'client_id');
    }

    public function sourceOrder()
    {
        return $this->belongsTo(Order::class, 'source_order_id', 'order_id');
    }

    public function inquiries()
    {
        return $this->hasMany(Inquiry::class, 'packaging_balance_id', 'balance_id');
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function effectiveStatus(): string
    {
        if ($this->isExpired()) {
            return 'expired';
        }
        if ((int) $this->remaining_pouches <= 0) {
            return 'depleted';
        }

        return 'active';
    }

    public function needsReplenishment(): bool
    {
        return $this->isExpired() || (int) $this->remaining_pouches <= 0;
    }

    public function packagingReplenishmentCost(): float
    {
        return round((int) $this->total_pouches * (float) $this->packaging_unit_cost, 2);
    }

    public function deductBatch(int $quantity): void
    {
        $deduct = max(0, min($quantity, (int) $this->remaining_pouches));
        $this->used_pouches = (int) $this->used_pouches + $deduct;
        $this->remaining_pouches = max(0, (int) $this->total_pouches - (int) $this->used_pouches);
        $this->status = $this->effectiveStatus();
        $this->save();
    }

    public function replenish(int $firstBatchQuantity, ?int $sourceOrderId = null): void
    {
        $rules = self::rulesForSlug($this->package_slug);
        $newTotal = $rules ? $rules['total_pouches'] : (int) $this->total_pouches;
        $used = max(0, min($firstBatchQuantity, $newTotal));

        $this->total_pouches = $newTotal;
        $this->used_pouches = $used;
        $this->remaining_pouches = max(0, $newTotal - $used);
        $this->cylinder_paid = true;
        $this->expires_at = now()->addYears(2);
        if ($sourceOrderId) {
            $this->source_order_id = $sourceOrderId;
        }
        $this->status = $this->effectiveStatus();
        $this->save();
    }
}
