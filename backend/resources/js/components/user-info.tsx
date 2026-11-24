import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { roleBadgeClasses, roleLabel } from '@/lib/role-dashboard';
import { cn } from '@/lib/utils';
import { type User } from '@/types';

interface UserInfoProps {
    user: User;
    showEmail?: boolean;
    showRole?: boolean;
    variant?: 'sidebar' | 'popover';
}

export function getUserDisplayName(user: Pick<User, 'full_name' | 'name' | 'email'>): string {
    const raw = user.full_name?.trim() || user.name?.trim();
    if (raw) return raw;
    if (user.email) return user.email.split('@')[0];
    return 'Staff User';
}

export function UserInfo({ user, showEmail = false, showRole = false, variant = 'popover' }: UserInfoProps) {
    const getInitials = useInitials();
    const displayName = getUserDisplayName(user);
    const initials = getInitials(displayName);
    const isSidebar = variant === 'sidebar';

    return (
        <>
            <Avatar
                className={cn(
                    'size-9 shrink-0 overflow-hidden rounded-full',
                    isSidebar
                        ? 'border border-[#d4a72c]/70 shadow-xs'
                        : 'border border-border bg-muted',
                )}
            >
                <AvatarImage src={user.avatar} alt={displayName} />
                <AvatarFallback
                    className={cn(
                        'rounded-full text-xs font-semibold tracking-wide',
                        isSidebar
                            ? 'bg-[#123b83] text-white'
                            : 'bg-muted text-foreground',
                    )}
                >
                    {initials}
                </AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span
                    className={cn(
                        'truncate font-semibold',
                        isSidebar ? 'text-white' : 'text-foreground',
                    )}
                >
                    {displayName}
                </span>
                {showEmail && (
                    <span
                        className={cn(
                            'truncate text-xs',
                            isSidebar ? 'text-sidebar-foreground/70' : 'text-muted-foreground',
                        )}
                    >
                        {user.email}
                    </span>
                )}
                {showRole && !isSidebar && (
                    <span className="mt-1 inline-flex">
                        <span
                            className={cn(
                                'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                                roleBadgeClasses(user.role),
                            )}
                        >
                            {roleLabel(user.role)}
                        </span>
                    </span>
                )}
                {showRole && isSidebar && (
                    <span className="truncate text-[11px] font-medium text-sidebar-foreground/70">
                        {roleLabel(user.role)}
                    </span>
                )}
            </div>
        </>
    );
}
