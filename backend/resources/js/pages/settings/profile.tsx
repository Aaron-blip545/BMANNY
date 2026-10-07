import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: '/settings/profile',
    },
];

export default function Profile() {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const form = useForm({
        full_name: user?.full_name ?? '',
        email: user?.email ?? '',
        phone_number: user?.phone_number ?? '',
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.patch(route('profile.update'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <section className="space-y-6">
                    <div>
                        <h2 className="text-lg font-medium">Profile information</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Update your account contact details.</p>
                    </div>
                    <form onSubmit={submit} className="max-w-xl space-y-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="full_name">Full name</Label>
                            <Input id="full_name" value={form.data.full_name} onChange={(event) => form.setData('full_name', event.target.value)} />
                            {form.errors.full_name && <p className="text-xs text-destructive">{form.errors.full_name}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email address</Label>
                            <Input id="email" type="email" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} />
                            {form.errors.email && <p className="text-xs text-destructive">{form.errors.email}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="phone_number">Phone number</Label>
                            <Input id="phone_number" value={form.data.phone_number} onChange={(event) => form.setData('phone_number', event.target.value)} />
                            {form.errors.phone_number && <p className="text-xs text-destructive">{form.errors.phone_number}</p>}
                        </div>
                        <Button type="submit" disabled={form.processing}>Save profile</Button>
                    </form>
                </section>
            </SettingsLayout>
        </AppLayout>
    );
}
