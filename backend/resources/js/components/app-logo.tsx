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
            <img className="size-11 object-contain" src="/images/bmanny-logo-transparent.png" alt="BMANNY Partners Inc." />
            <span className="grid text-left leading-tight">
                <span className="text-base font-bold tracking-wide text-sidebar-foreground">BMANNY</span>
                <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-[#e5b93f]">{roleLabel[role] ?? 'BMANNY Portal'}</span>
            </span>
        </div>
    );
}
