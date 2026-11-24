import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { type User } from '@/types';
import { Link, router } from '@inertiajs/react';
import { KeyRound, LogOut, Palette, UserCog } from 'lucide-react';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm">
                    <UserInfo user={user} showEmail={true} showRole={true} variant="popover" />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild className="cursor-pointer rounded-md px-2.5 py-2 text-sm">
                    <Link className="flex w-full items-center gap-2.5" href={route('profile.edit')} prefetch onClick={cleanup}>
                        <UserCog className="size-4 text-muted-foreground" />
                        <span>Profile settings</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-md px-2.5 py-2 text-sm">
                    <Link className="flex w-full items-center gap-2.5" href={route('password.edit')} prefetch onClick={cleanup}>
                        <KeyRound className="size-4 text-muted-foreground" />
                        <span>Password &amp; security</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-md px-2.5 py-2 text-sm">
                    <Link className="flex w-full items-center gap-2.5" href={route('appearance')} prefetch onClick={cleanup}>
                        <Palette className="size-4 text-muted-foreground" />
                        <span>Appearance</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
                asChild
                className="cursor-pointer rounded-md px-2.5 py-2 text-sm text-foreground data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
            >
                <Link
                    className="flex w-full items-center gap-2.5 font-medium"
                    method="post"
                    href={route('logout')}
                    as="button"
                    onClick={cleanup}
                    onSuccess={() => {
                        router.flushAll();
                        window.location.replace('/login');
                    }}
                >
                    <LogOut className="size-4" />
                    <span>Log out</span>
                </Link>
            </DropdownMenuItem>
        </>
    );
}
