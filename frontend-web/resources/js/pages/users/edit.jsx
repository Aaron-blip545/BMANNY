import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

const ROLES = ['customer', 'sales_agent', 'product_controller', 'order_manager', 'admin'];

export default function EditUser({ user }) {
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
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Account</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-5">
                            <div className="grid gap-2">
                                <Label htmlFor="full_name">Full Name</Label>
                                <Input id="full_name" value={data.full_name} onChange={(e) => setData('full_name', e.target.value)} />
                                {errors.full_name && <p className="text-sm text-red-600">{errors.full_name}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone_number">Phone Number</Label>
                                <Input id="phone_number" value={data.phone_number} onChange={(e) => setData('phone_number', e.target.value)} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Role</Label>
                                <Select value={data.role} onValueChange={(value) => setData('role', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROLES.map((r) => (
                                            <SelectItem key={r} value={r} className="capitalize">
                                                {r.replace('_', ' ')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.role && <p className="text-sm text-red-600">{errors.role}</p>}
                            </div>

                            <div className="grid gap-2 border-t pt-4">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Leave blank to keep current password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                />
                            </div>

                            <Button type="submit" disabled={processing} className="w-full">
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}