import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface PackagingOption {
    packaging_id: number;
    name: string;
    description: string | null;
    is_available: boolean;
    updated_at: string;
}

interface Props {
    packagingOptions: PackagingOption[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Product Controller', href: '/product-controller/dashboard' },
    { title: 'Packaging Management', href: '/product-controller/packaging' },
];

export default function PackagingPage({ packagingOptions }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editingOption, setEditingOption] = useState<PackagingOption | null>(null);

    const form = useForm({
        name: '',
        description: '',
        is_available: true,
    });

    const openAdd = () => {
        form.reset();
        setEditingOption(null);
        setShowModal(true);
    };

    const openEdit = (option: PackagingOption) => {
        form.setData({
            name: option.name,
            description: option.description ?? '',
            is_available: option.is_available,
        });
        setEditingOption(option);
        setShowModal(true);
    };

    const submit = () => {
        if (editingOption) {
            form.put(route('product-controller.packaging.update', editingOption.packaging_id), {
                onSuccess: () => setShowModal(false),
            });
        } else {
            form.post(route('product-controller.packaging.store'), {
                onSuccess: () => setShowModal(false),
            });
        }
    };

    const destroy = (id: number) => {
        if (confirm('Remove this packaging option? This cannot be undone.')) {
            router.delete(route('product-controller.packaging.destroy', id));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Packaging Management" />

            <main className="bmanny-page">
                <div className="bmanny-page-inner space-y-5">
                    <section className="bmanny-page-header">
                        <p className="bmanny-page-eyebrow">Product Controller</p>
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-foreground">Packaging Management</h1>
                                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Manage the packaging options available for product orders.
                                </p>
                            </div>
                            <Button id="add-packaging-btn" onClick={openAdd} className="shrink-0">
                                <Plus className="mr-2 size-4" />
                                Add Packaging Option
                            </Button>
                        </div>
                    </section>

                    <Card className="bmanny-workspace overflow-hidden">
                        <CardHeader className="border-b border-border p-5">
                            <CardTitle className="text-base">Packaging Options</CardTitle>
                            <CardDescription>All available packaging types for customer orders.</CardDescription>
                        </CardHeader>

                        {packagingOptions.length === 0 ? (
                            <CardContent className="bmanny-empty-state min-h-64">
                                <p className="text-sm text-muted-foreground">No packaging options yet. Add one to get started.</p>
                            </CardContent>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[36rem] text-left text-sm">
                                    <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                                        <tr>
                                            <th className="px-5 py-3 font-medium">Name</th>
                                            <th className="px-5 py-3 font-medium">Description</th>
                                            <th className="px-5 py-3 font-medium">Status</th>
                                            <th className="px-5 py-3 font-medium"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {packagingOptions.map((opt) => (
                                            <tr key={opt.packaging_id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                                                <td className="px-5 py-4 font-medium">{opt.name}</td>
                                                <td className="px-5 py-4 text-muted-foreground">{opt.description ?? '—'}</td>
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                            opt.is_available
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}
                                                    >
                                                        {opt.is_available ? 'Available' : 'Unavailable'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            id={`edit-packaging-${opt.packaging_id}`}
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => openEdit(opt)}
                                                        >
                                                            <Pencil className="size-3.5" />
                                                        </Button>
                                                        <Button
                                                            id={`delete-packaging-${opt.packaging_id}`}
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => destroy(opt.packaging_id)}
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            </main>

            {/* ── Add / Edit Modal ────────────────────────────────────────────── */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingOption ? 'Edit Packaging Option' : 'Add Packaging Option'}</DialogTitle>
                        <DialogDescription>
                            {editingOption ? 'Update the packaging option details.' : 'Add a new packaging option available for orders.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="pkg-name">Name</Label>
                            <Input
                                id="pkg-name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                placeholder="e.g. Shrink Wrap 6-pack"
                            />
                            {form.errors.name && <p className="text-xs text-destructive">{form.errors.name}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="pkg-description">Description (optional)</Label>
                            <Input
                                id="pkg-description"
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                                placeholder="Brief description"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Status</Label>
                            <Select
                                value={form.data.is_available ? 'true' : 'false'}
                                onValueChange={(v) => form.setData('is_available', v === 'true')}
                            >
                                <SelectTrigger id="pkg-status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Available</SelectItem>
                                    <SelectItem value="false">Unavailable</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button id="submit-packaging-btn" onClick={submit} disabled={form.processing}>
                            {editingOption ? 'Save Changes' : 'Add Option'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
