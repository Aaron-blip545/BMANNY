import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    const managementItems = items.filter((item) => item.title === 'Settings' || item.title === 'Manage Users' || item.title === 'Profile');
    const primaryItems = items.filter((item) => !managementItems.includes(item));

    const renderItems = (navigationItems: NavItem[]) =>
        navigationItems.map((item) => (
            <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                    asChild
                    isActive={item.url === page.url}
                    tooltip={item.title}
                    className="relative h-10 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-red-700 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:before:absolute data-[active=true]:before:inset-y-2 data-[active=true]:before:left-0 data-[active=true]:before:w-0.5 data-[active=true]:before:rounded-r data-[active=true]:before:bg-red-700 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:px-2!"
                >
                    <Link href={item.url}>
                        {item.icon && <item.icon className="size-4" />}
                        <span>{item.title}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        ));

    return (
        <SidebarGroup className="px-3 py-4 group-data-[collapsible=icon]:px-2">
            <SidebarGroupLabel className="h-7 px-3 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/50">Main</SidebarGroupLabel>
            <SidebarMenu>
                {renderItems(primaryItems)}
            </SidebarMenu>

            {managementItems.length > 0 && (
                <div className="mt-5">
                    <SidebarGroupLabel className="h-7 px-3 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/50">Management</SidebarGroupLabel>
                    <SidebarMenu>{renderItems(managementItems)}</SidebarMenu>
                </div>
            )}
        </SidebarGroup>
    );
}
