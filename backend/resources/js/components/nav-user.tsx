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

    // The dashboard is available without login while its UI is being built.
    // Avoid rendering account controls until a real authenticated user exists.
    if (!auth.user) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton size="lg" className="cursor-default rounded-md px-2 text-sidebar-foreground">
                        <span className="flex size-9 items-center justify-center rounded-full border border-[#d6a72c] bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">A</span>
                        <span className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">Admin preview</span>
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
                        <SidebarMenuButton size="lg" className="group rounded-md px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent">
                            <UserInfo user={auth.user} />
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="end"
                        side={isMobile ? 'bottom' : state === 'collapsed' ? 'left' : 'bottom'}
                    >
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
