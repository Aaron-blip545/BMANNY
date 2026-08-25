import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    const currentPath = page.url.split('?')[0];
    const managementItems = items.filter((item) => item.title === 'Settings' || item.title === 'Manage Users' || item.title === 'Profile');
    const primaryItems = items.filter((item) => !managementItems.includes(item));

    const isItemActive = (url: string) => currentPath === url || (url !== '/' && currentPath.startsWith(`${url}/`));

    const renderItems = (navigationItems: NavItem[]) =>
        navigationItems.map((item) => (
            <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                    asChild
                    isActive={isItemActive(item.url)}
                    tooltip={item.title}
                    className="relative h-11 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/70 transition-colors duration-150 hover:bg-white/[0.07] hover:text-white focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[active=true]:bg-[#123b83] data-[active=true]:font-semibold data-[active=true]:text-white data-[active=true]:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] data-[active=true]:before:absolute data-[active=true]:before:inset-y-1.5 data-[active=true]:before:left-0 data-[active=true]:before:w-1 data-[active=true]:before:rounded-r-full data-[active=true]:before:bg-[#d4a72c] data-[active=true]:[&_svg]:text-[#e5b93f] group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:px-2!"
                >
                    <Link href={item.url}>
                        {item.icon && <item.icon className="size-5 shrink-0 stroke-[1.8]" aria-hidden="true" />}
                        <span>{item.title}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        ));

    return (
        <SidebarGroup className="px-3 py-5 group-data-[collapsible=icon]:px-2">
            <SidebarGroupLabel className="h-8 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50">Main</SidebarGroupLabel>
            <SidebarMenu>
                {renderItems(primaryItems)}
            </SidebarMenu>

            {managementItems.length > 0 && (
                <div className="mt-5">
                    <SidebarGroupLabel className="h-8 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50">Management</SidebarGroupLabel>
                    <SidebarMenu>{renderItems(managementItems)}</SidebarMenu>
                </div>
            )}
        </SidebarGroup>
    );
}
