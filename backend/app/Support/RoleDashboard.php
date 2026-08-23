<?php

namespace App\Support;

final class RoleDashboard
{
    public static function routeNameFor(?string $role): string
    {
        return match ($role) {
            'admin' => 'admin.dashboard',
            'sales_agent' => 'sales.dashboard',
            'order_manager' => 'order-manager.dashboard',
            'product_controller' => 'product-controller.dashboard',
            default => 'dashboard',
        };
    }
}
