import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { roleDashboardHref } from '@/lib/role-dashboard';
import { Link, usePage } from '@inertiajs/react';
import { BarChart3, Bell, Box, CircleHelp, FileText, House, ListTree, PackageCheck, PackageMinus, Settings, SlidersHorizontal, Users as UsersIcon } from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    // Build the nav list based on the logged-in user's role.
    // Each role sees only the pages they are allowed to access.
    const { auth } = usePage().props as any;
    const role: string = auth?.user?.role ?? '';

    const isAdmin        = role === 'admin';
    const isSalesAgent   = role === 'sales_agent';
    const isOrderManager = role === 'order_manager';
    const isProductController = role === 'product_controller';
    const dashboardHref = roleDashboardHref(role);

    const standardNavItems: NavItem[] = [
        // Everyone sees Dashboard and Inventory
        { title: 'Dashboard', url: dashboardHref,      icon: House },
        { title: 'Inventory',  url: '/products',        icon: PackageMinus },

        // Sales Agent + Admin: customer inquiries and quotation workflow
        ...(isSalesAgent || isAdmin
            ? [
                { title: 'Inquiries',   url: '/inquiries',   icon: CircleHelp },
                { title: 'Quotations',  url: '/quotations',  icon: FileText },
              ]
            : []),

        // Order Manager + Admin: production and delivery tracking
        ...(isOrderManager || isAdmin
            ? [{ title: 'Orders', url: '/orders', icon: PackageCheck }]
            : []),

        // Settings — everyone
        { title: 'Settings', url: '/settings/profile', icon: Settings },

        // Admin-only: user management
        ...(isAdmin
            ? [
                { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
                { title: 'Reports', url: '/admin/reports', icon: FileText },
                { title: 'Manage Users', url: '/users', icon: UsersIcon },
            ]
            : []),
    ];

    const productControllerNavItems: NavItem[] = [
        { title: 'Dashboard', url: '/product-controller/dashboard', icon: House },
        { title: 'Product Management', url: '/products', icon: PackageMinus },
        { title: 'Variant Management', url: '/product-controller/variants', icon: ListTree },
        { title: 'Packaging Management', url: '/product-controller/packaging', icon: Box },
        { title: 'MOQ Management', url: '/product-controller/moq', icon: SlidersHorizontal },
        { title: 'Customization Options', url: '/product-controller/customization', icon: CircleHelp },
        { title: 'Notifications', url: '/product-controller/notifications', icon: Bell },
        { title: 'Profile', url: '/settings/profile', icon: Settings },
    ];

    const mainNavItems = isProductController ? productControllerNavItems : standardNavItems;

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
            <SidebarHeader className="border-b border-sidebar-border px-4 py-5 group-data-[collapsible=icon]:px-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="h-14 rounded-md px-1 hover:bg-transparent">
                            <Link href={dashboardHref}>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border px-3 py-4 group-data-[collapsible=icon]:px-2">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
