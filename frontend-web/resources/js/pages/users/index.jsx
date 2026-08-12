import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';

// This is a plain .jsx file - no "interface Props", no ": string" type
// annotations anywhere. Everything else about React (props, JSX, hooks)
// works exactly the same as in the .tsx files - TypeScript was never a
// different language, just JS with optional extra type-checking on top.

const ROLES = [
    { value: 'all', label: 'All' },
    { value: 'customer', label: 'Customers' },
    { value: 'sales_agent', label: 'Sales Agents' },
    { value: 'product_controller', label: 'Product Controllers' },
    { value: 'order_manager', label: 'Order Managers' },
    { value: 'admin', label: 'Admins' },
];

export default function UsersIndex({ users, activeRole }) {
    // usePage() gives access to whatever HandleInertiaRequests shares on
    // every page - we use it here just to read a flash "success" message.
    const { flash } = usePage().props;

    function toggleActive(user) {
        if (!confirm(`${user.is_active ? 'Deactivate' : 'Reactivate'} ${user.full_name}?`)) {
            return;
        }
        // router.patch sends a PATCH request without needing a <form> -
        // handy for a single button that isn't part of a bigger form.
        router.patch(route('users.toggle-active', user.user_id));
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Manage Users', href: '/users' }]}>
            <Head title="Manage Users" />

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Manage Users</h1>
                    <Link href={route('users.create')} className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                        + Add Account
                    </Link>
                </div>

                {flash?.success && <div className="mb-4 rounded bg-green-100 px-4 py-2 text-sm text-green-800">{flash.success}</div>}

                {/* Role filter tabs - each is just a link with a different ?role= value */}
                <div className="mb-4 flex gap-2 text-sm">
                    {ROLES.map((r) => (
                        <Link
                            key={r.value}
                            href={route('users.index', r.value === 'all' ? {} : { role: r.value })}
                            className={`rounded px-3 py-1.5 ${activeRole === r.value ? 'bg-blue-600 text-white' : 'border bg-white text-gray-600'}`}
                        >
                            {r.label}
                        </Link>
                    ))}
                </div>

                <div className="overflow-hidden rounded border bg-white">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b bg-gray-50 text-xs text-gray-500">
                            <tr>
                                <th className="p-3">Name</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Role</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-gray-400">
                                        No accounts found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.user_id} className="border-t">
                                        <td className="p-3 font-medium">{user.full_name}</td>
                                        <td className="p-3 text-gray-600">{user.email}</td>
                                        <td className="p-3 text-gray-600 capitalize">{user.role.replace('_', ' ')}</td>
                                        <td className="p-3">
                                            {user.is_active ? (
                                                <span className="text-green-600">Active</span>
                                            ) : (
                                                <span className="text-red-500">Deactivated</span>
                                            )}
                                        </td>
                                        <td className="space-x-3 p-3">
                                            <Link href={route('users.edit', user.user_id)} className="text-blue-600 hover:underline">
                                                Edit
                                            </Link>
                                            <button onClick={() => toggleActive(user)} className="text-amber-600 hover:underline">
                                                {user.is_active ? 'Deactivate' : 'Reactivate'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}