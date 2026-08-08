import Heading from '@/components/heading';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { User, Lock, Palette, type LucideIcon } from 'lucide-react';

interface SettingsNavItem extends NavItem {
    icon: LucideIcon;
}

const sidebarNavItems: SettingsNavItem[] = [
    {
        title: 'Profile',
        url: '/settings/profile',
        icon: User,
    },
    {
        title: 'Password',
        url: '/settings/password',
        icon: Lock,
    },
    {
        title: 'Appearance',
        url: '/settings/appearance',
        icon: Palette,
    },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const currentPath = window.location.pathname;

    return (
        <div className="px-4 py-6">
            <Heading title="Settings" description="Manage your profile and account settings" />

            <div className="mt-8">
                <div className="flex-1">
                    <section className="max-w-2xl space-y-12">{children}</section>
                </div>
            </div>
        </div>
    );
}
