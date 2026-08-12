import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeftRight, BookOpen, CircleHelp, Folder, House, PackageCheck, PackageMinus, Settings, Users as UsersIcon, UserRound } from 'lucide-react';
import AppLogo from './app-logo';

const baseNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: House,
    },
    {
        title: 'Orders',
        url: '/orders',
        icon: PackageCheck,
    },
    {
        title: 'Inventory',
        url: '/products',
        icon: PackageMinus,
    },
    {
        title: 'Transfer',
        url: '/transfer',
        icon: ArrowLeftRight,
    },
    {
        title: 'Reports',
        url: '/reports',
        icon: UserRound,
    },
    {
        title: 'Inquiries',
        url: '/inquiries',
        icon: CircleHelp,
    },
    {
        title: 'Settings',
        url: '/settings/profile',
        icon: Settings,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        url: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        url: 'https://laravel.com/docs/starter-kits',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    // CHANGED: mainNavItems used to be a fixed list outside the component.
    // It's now built here so we can check who's logged in (from the
    // shared 'auth' prop - see HandleInertiaRequests) and only show
    // "Manage Users" to admins. Sales agents, product controllers, etc.
    // won't see this link at all.
    const { auth } = usePage().props as any;
    const isAdmin = auth?.user?.role === 'admin';

    const mainNavItems: NavItem[] = isAdmin
        ? [...baseNavItems, { title: 'Manage Users', url: '/users', icon: UsersIcon }]
        : baseNavItems;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}