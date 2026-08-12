import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';

const ROLES = ['customer', 'sales_agent', 'product_controller', 'order_manager', 'admin'];

export default function EditUser({ user }) {
    // Same useForm hook as create.jsx, just started with the existing
    // user's values instead of blanks. Password fields start empty on
    // purpose - leaving them blank means "don't change the password".
    const { data, setData, put, processing, errors } = useForm({
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number || '',
        role: user.role,
        password: '',
        password_confirmation: '',
    });

    function submit(e) {
        e.preventDefault();
        put(route('users.update', user.user_id));
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Manage Users', href: '/users' }, { title: 'Edit Account', href: '#' }]}>
            <Head title="Edit Account" />

            <div className="mx-auto max-w-lg p-4 sm:p-6 lg:p-8">
                <h1 className="mb-4 text-xl font-semibold">Edit Account</h1>

                <form onSubmit={submit} className="space-y-4 rounded border bg-white p-6">
                    <div>
                        <label className="mb-1 block text-sm font-medium">Full Name</label>
                        <input
                            type="text"
                            className="w-full rounded border px-3 py-2"
                            value={data.full_name}
                            onChange={(e) => setData('full_name', e.target.value)}
                        />
                        {errors.full_name && <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Email</label>
                        <input
                            type="email"
                            className="w-full rounded border px-3 py-2"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Phone Number</label>
                        <input
                            type="text"
                            className="w-full rounded border px-3 py-2"
                            value={data.phone_number}
                            onChange={(e) => setData('phone_number', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Role</label>
                        <select className="w-full rounded border px-3 py-2" value={data.role} onChange={(e) => setData('role', e.target.value)}>
                            {ROLES.map((r) => (
                                <option key={r} value={r}>
                                    {r.replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                        {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
                    </div>

                    <div className="border-t pt-4">
                        <label className="mb-1 block text-sm font-medium">New Password</label>
                        <input
                            type="password"
                            className="w-full rounded border px-3 py-2"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Leave blank to keep current password"
                        />
                        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Confirm New Password</label>
                        <input
                            type="password"
                            className="w-full rounded border px-3 py-2"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                        />
                    </div>

                    <button type="submit" disabled={processing} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                        {processing ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </AppLayout>
    );
}