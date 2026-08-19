import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { auth } = usePage().props as any;
    const role = auth?.user?.role ?? 'admin';
    const roleLabel: Record<string, string> = {
        admin: 'Admin Portal',
        customer: 'Customer Portal',
        sales_agent: 'Sales Agent',
        product_controller: 'Product Controller',
        order_manager: 'Order Manager',
    };

    return (
        <div className="flex items-center gap-3">
            <img className="size-10 object-contain" src="/logo.jpg" alt="BMANNY Partners Inc." />
            <span className="grid text-left text-sm leading-tight">
                <span className="font-bold">BMANNY</span>
                <span className="text-sidebar-foreground/60 text-xs">{roleLabel[role] ?? 'BMANNY Portal'}</span>
            </span>
        </div>
    );
}
