export function roleDashboardHref(role?: string): string {
    switch (role) {
        case 'admin':
            return '/admin/dashboard';
        case 'sales_agent':
            return '/sales/dashboard';
        case 'order_manager':
            return '/order-manager/dashboard';
        case 'product_controller':
            return '/product-controller/dashboard';
        default:
            return '/dashboard';
    }
}
