import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { type User } from '@/types';
import { Link, router } from '@inertiajs/react';
import { LogOut } from 'lucide-react';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-800 dark:data-[highlighted]:bg-rose-950/40 dark:data-[highlighted]:text-rose-300">
                <Link
                    className="block w-full rounded-sm px-2 py-1.5 transition-colors hover:bg-rose-50 hover:text-rose-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                    method="post"
                    href={route('logout')}
                    as="button"
                    onClick={cleanup}
                    onSuccess={() => {
                        router.flushAll();
                        window.location.replace('/login');
                    }}
                >
                    <LogOut className="mr-2" />
                    Log out
                </Link>
            </DropdownMenuItem>
        </>
    );
}
