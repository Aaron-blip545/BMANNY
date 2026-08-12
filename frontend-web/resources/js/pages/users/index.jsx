import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';

const ROLES = [
    { value: 'all', label: 'All' },
    { value: 'customer', label: 'Customers' },
    { value: 'sales_agent', label: 'Sales Agents' },
    { value: 'product_controller', label: 'Product Controllers' },
    { value: 'order_manager', label: 'Order Managers' },
    { value: 'admin', label: 'Admins' },
];

export default function UsersIndex({ users, activeRole }) {
    const { flash } = usePage().props;

    function toggleActive(user) {
        if (!confirm(`${user.is_active ? 'Deactivate' : 'Reactivate'} ${user.full_name}?`)) {
            return;
        }
        router.patch(route('users.toggle-active', user.user_id));
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Manage Users', href: '/users' }]}>
            <Head title="Manage Users" />

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Manage Users</h1>
                        <p className="text-sm text-muted-foreground">Create and manage staff and customer accounts.</p>
                    </div>
                    <Button asChild>
                        <Link href={route('users.create')}>+ Add Account</Link>
                    </Button>
                </div>

                {flash?.success && (
                    <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
                        {flash.success}
                    </div>
                )}

                <div className="mb-4 flex flex-wrap gap-2">
                    {ROLES.map((r) => (
                        <Button key={r.value} variant={activeRole === r.value ? 'default' : 'outline'} size="sm" asChild>
                            <Link href={route('users.index', r.value === 'all' ? {} : { role: r.value })}>{r.label}</Link>
                        </Button>
                    ))}
                </div>

                <Card>
                    <CardContent className="p-0">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b text-xs text-muted-foreground">
                                <tr>
                                    <th className="p-4 font-medium">Name</th>
                                    <th className="p-4 font-medium">Email</th>
                                    <th className="p-4 font-medium">Role</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            No accounts found.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.user_id} className="border-b last:border-0">
                                            <td className="p-4 font-medium">{user.full_name}</td>
                                            <td className="p-4 text-muted-foreground">{user.email}</td>
                                            <td className="p-4">
                                                <Badge variant="secondary" className="capitalize">
                                                    {user.role.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={user.is_active ? 'default' : 'destructive'}>
                                                    {user.is_active ? 'Active' : 'Deactivated'}
                                                </Badge>
                                            </td>
                                            <td className="space-x-2 p-4">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={route('users.edit', user.user_id)}>Edit</Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => toggleActive(user)}>
                                                    {user.is_active ? 'Deactivate' : 'Reactivate'}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}