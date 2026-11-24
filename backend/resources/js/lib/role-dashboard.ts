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

export function roleLabel(role?: string): string {
    switch (role) {
        case 'admin':
            return 'Administrator';
        case 'sales_agent':
            return 'Sales Agent';
        case 'order_manager':
            return 'Order Manager';
        case 'product_controller':
            return 'Product Controller';
        case 'customer':
            return 'Customer';
        default:
            return 'Staff Member';
    }
}

export function roleDescription(role?: string): string {
    switch (role) {
        case 'admin':
            return 'Full system administration, analytics, reports, moderation, and user management.';
        case 'sales_agent':
            return 'Manage client inquiries, real-time chat, quotations, and payment verifications.';
        case 'order_manager':
            return 'Oversee production milestones, quality checks, tracking numbers, and deliveries.';
        case 'product_controller':
            return 'Maintain product catalog, raw materials inventory, BOM recipes, MOQ, and packaging.';
        default:
            return 'Access your assigned BMANNY workspace modules.';
    }
}

export function roleBadgeClasses(role?: string): string {
    switch (role) {
        case 'admin':
        case 'sales_agent':
        case 'order_manager':
        case 'product_controller':
            return 'border-border bg-muted/70 text-foreground';
        default:
            return 'border-border bg-muted/50 text-muted-foreground';
    }
}
