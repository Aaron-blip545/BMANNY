import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { useNotifications } from '@/hooks/use-notifications';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    const currentPath = page.url.split('?')[0];
    const { notifications, markAsRead } = useNotifications();
    const managementItems = items.filter((item) => item.title === 'Settings' || item.title === 'Manage Users' || item.title === 'Profile');
    const primaryItems = items.filter((item) => !managementItems.includes(item));

    const isItemActive = (url: string) => currentPath === url || (url !== '/' && currentPath.startsWith(`${url}/`));

    // Keep attention tied to the section where the staff member can act.
    // The number is deliberately plain text rather than a decorative badge.
    const matchesSection = (title: string, notification: (typeof notifications)[number]) => {
        if (notification.is_read) return false;

        switch (title) {
            case 'Inquiries':
                return ['inquiry', 'message', 'follow_up'].includes(notification.type);
            case 'Quotations':
                return notification.type === 'quotation';
            case 'Orders':
                return notification.type === 'order';
            case 'Product Requests':
                return ['product_request', 'inquiry'].includes(notification.type);
            case 'Inventory':
            case 'Product Management':
                return notification.type === 'product';
            case 'Notifications':
                return true;
            default:
                return false;
        }
    };

    const attentionCount = (title: string) => notifications.filter((notification) => matchesSection(title, notification)).length;

    const markSectionAsRead = (title: string) => {
        notifications
            .filter((notification) => matchesSection(title, notification))
            .forEach((notification) => void markAsRead(notification.notification_id));
    };

    const renderItems = (navigationItems: NavItem[]) =>
        navigationItems.map((item) => {
            const count = attentionCount(item.title);
            const isActive = isItemActive(item.url);

            return (
            <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                    className={`relative h-11 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/70 transition-colors duration-150 hover:bg-white/[0.07] hover:text-white focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[active=true]:bg-[#123b83] data-[active=true]:font-semibold data-[active=true]:text-white data-[active=true]:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] data-[active=true]:before:absolute data-[active=true]:before:inset-y-1.5 data-[active=true]:before:left-0 data-[active=true]:before:w-1 data-[active=true]:before:rounded-r-full data-[active=true]:before:bg-[#d4a72c] data-[active=true]:[&_svg]:text-[#e5b93f] group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:px-2! ${count > 0 && !isActive ? 'text-white before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-r-full before:bg-sky-400 [&_svg]:text-sky-300' : ''}`}
                >
                    <Link href={item.url} onClick={() => markSectionAsRead(item.title)} className="flex min-w-0 flex-1 items-center gap-2">
                        {item.icon && <item.icon className="size-5 shrink-0 stroke-[1.8]" aria-hidden="true" />}
                        <span>{item.title}</span>
                        {count > 0 && (
                            <span className="ml-auto pr-1 text-xs font-semibold tabular-nums text-sky-300 group-data-[collapsible=icon]:hidden">
                                {count > 99 ? '99+' : count}
                            </span>
                        )}
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            );
        });

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
