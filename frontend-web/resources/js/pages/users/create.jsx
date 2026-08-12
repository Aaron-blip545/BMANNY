import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';

// useForm is Inertia's helper for "form with a backend to submit to".
// It gives you: data (the current values), setData (update a field),
// post/put (send the request), processing (true while submitting),
// and errors (validation messages from the server).

const ROLES = ['customer', 'sales_agent', 'product_controller', 'order_manager', 'admin'];

export default function CreateUser() {
    const { data, setData, post, processing, errors } = useForm({
        full_name: '',
        email: '',
        phone_number: '',
        role: '',
        password: '',
        password_confirmation: '',
    });

    function submit(e) {
        e.preventDefault(); // stops the browser's default full-page form submit
        post(route('users.store'));
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Manage Users', href: '/users' }, { title: 'Add Account', href: '/users/create' }]}>
            <Head title="Add Account" />

            <div className="mx-auto max-w-lg p-4 sm:p-6 lg:p-8">
                <h1 className="mb-4 text-xl font-semibold">Add New Account</h1>

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
                            <option value="">-- Select role --</option>
                            {ROLES.map((r) => (
                                <option key={r} value={r}>
                                    {r.replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                        {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Password</label>
                        <input
                            type="password"
                            className="w-full rounded border px-3 py-2"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Confirm Password</label>
                        <input
                            type="password"
                            className="w-full rounded border px-3 py-2"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                        />
                    </div>

                    <button type="submit" disabled={processing} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                        {processing ? 'Saving...' : 'Create Account'}
                    </button>
                </form>
            </div>
        </AppLayout>
    );
}