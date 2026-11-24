import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { useIsMobile } from '@/hooks/use-mobile';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { ChevronsUpDown } from 'lucide-react';

export function NavUser() {
    const { auth } = usePage<SharedData>().props;
    const { state } = useSidebar();
    const isMobile = useIsMobile();

    if (!auth.user) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton size="lg" className="cursor-default rounded-lg px-2 text-sidebar-foreground">
                        <span className="flex size-9 items-center justify-center rounded-full border border-[#d6a72c] bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
                            A
                        </span>
                        <span className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold text-white">Admin preview</span>
                            <span className="truncate text-xs text-sidebar-foreground/60">Local development</span>
                        </span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        );
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="group h-13 rounded-lg border border-transparent bg-white/[0.04] px-2.5 text-sidebar-foreground transition-colors hover:border-white/10 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:border-[#d4a72c]/40 data-[state=open]:bg-sidebar-accent group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
                        >
                            <UserInfo user={auth.user} showRole={true} variant="sidebar" />
                            <ChevronsUpDown className="ml-auto size-4 shrink-0 text-sidebar-foreground/65 transition-colors group-hover:text-white group-data-[collapsible=icon]:hidden" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-xl border border-border bg-popover p-1.5 shadow-lg"
                        align="end"
                        sideOffset={8}
                        side={isMobile ? 'bottom' : state === 'collapsed' ? 'right' : 'top'}
                    >
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
