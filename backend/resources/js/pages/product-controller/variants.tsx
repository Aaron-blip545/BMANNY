import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ChevronDown, ChevronRight, Eye, EyeOff, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface MoqRule {
    moq_rule_id: number;
    min_quantity: number;
    effective_date: string;
    creator: { full_name: string } | null;
}

interface ProductVariant {
    variant_id: number;
    name: string;
    size_value: number | null;
    size_unit: string | null;
    container_type: string | null;
    is_available: boolean;
    is_published: boolean;
    notes: string | null;
    deleted_at: string | null;
    current_moq: MoqRule | null;
}

interface ProductType {
    product_type_id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    variants: ProductVariant[];
}

interface Props {
    productTypes: ProductType[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Product Controller', href: '/product-controller/dashboard' },
    { title: 'Variant Management', href: '/product-controller/variants' },
];

function AvailabilityBadge({ value }: { value: boolean }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                value ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
        >
            {value ? 'Available' : 'Unavailable'}
        </span>
    );
}

function PublishedBadge({ value }: { value: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                value ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
            }`}
        >
            {value ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
            {value ? 'Published' : 'Unpublished'}
        </span>
    );
}

export default function VariantsPage({ productTypes }: Props) {
    const [expandedTypes, setExpandedTypes] = useState<Record<number, boolean>>({});
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [editingType, setEditingType] = useState<ProductType | null>(null);
    const [showVariantModal, setShowVariantModal] = useState(false);
    const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
    const [variantTypeId, setVariantTypeId] = useState<number | null>(null);

    // ── Type form ─────────────────────────────────────────────────────────────
    const typeForm = useForm({ name: '', description: '' });

    const openAddType = () => {
        typeForm.reset();
        setEditingType(null);
        setShowTypeModal(true);
    };

    const openEditType = (type: ProductType) => {
        typeForm.setData({ name: type.name, description: type.description ?? '' });
        setEditingType(type);
        setShowTypeModal(true);
    };

    const submitType = () => {
        if (editingType) {
            typeForm.put(route('product-controller.variants.types.update', editingType.product_type_id), {
                onSuccess: () => setShowTypeModal(false),
            });
        } else {
            typeForm.post(route('product-controller.variants.types.store'), {
                onSuccess: () => setShowTypeModal(false),
            });
        }
    };

    // ── Variant form ──────────────────────────────────────────────────────────
    const variantForm = useForm({
        product_type_id: 0,
        name: '',
        size_value: '',
        size_unit: '',
        container_type: '',
        is_available: true,
        is_published: false,
        notes: '',
    });

    const openAddVariant = (typeId: number) => {
        variantForm.reset();
        variantForm.setData('product_type_id', typeId);
        setVariantTypeId(typeId);
        setEditingVariant(null);
        setShowVariantModal(true);
    };

    const openEditVariant = (variant: ProductVariant, typeId: number) => {
        variantForm.setData({
            product_type_id: typeId,
            name: variant.name,
            size_value: variant.size_value?.toString() ?? '',
            size_unit: variant.size_unit ?? '',
            container_type: variant.container_type ?? '',
            is_available: variant.is_available,
            is_published: variant.is_published,
            notes: variant.notes ?? '',
        });
        setVariantTypeId(typeId);
        setEditingVariant(variant);
        setShowVariantModal(true);
    };

    const submitVariant = () => {
        if (editingVariant) {
            variantForm.put(route('product-controller.variants.update', editingVariant.variant_id), {
                onSuccess: () => setShowVariantModal(false),
            });
        } else {
            variantForm.post(route('product-controller.variants.store'), {
                onSuccess: () => setShowVariantModal(false),
            });
        }
    };

    const deleteVariant = (id: number) => {
        if (confirm('Remove this variant? It will be soft-deleted and can be restored.')) {
            router.delete(route('product-controller.variants.destroy', id));
        }
    };

    const restoreVariant = (id: number) => {
        router.patch(route('product-controller.variants.restore', id));
    };

    const toggleExpand = (id: number) => {
        setExpandedTypes((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Variant Management" />

            <main className="bmanny-page">
                <div className="bmanny-page-inner space-y-5">
                    <section className="bmanny-page-header">
                        <p className="bmanny-page-eyebrow">Product Controller</p>
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-foreground">Variant Management</h1>
                                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Manage product types and their variants. Variants marked <strong>Published</strong> appear in the customer catalog.
                                </p>
                            </div>
                            <Button id="add-product-type-btn" onClick={openAddType} className="shrink-0">
                                <Plus className="mr-2 size-4" />
                                New Product Type
                            </Button>
                        </div>
                    </section>

                    {productTypes.length === 0 ? (
                        <Card className="bmanny-workspace">
                            <CardContent className="bmanny-empty-state min-h-64">
                                <p className="text-sm text-muted-foreground">No product types yet. Add one to get started.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {productTypes.map((type) => {
                                const isExpanded = expandedTypes[type.product_type_id] ?? true;
                                const activeVariants = type.variants.filter((v) => !v.deleted_at);
                                const deletedVariants = type.variants.filter((v) => v.deleted_at);

                                return (
                                    <Card key={type.product_type_id} className="bmanny-workspace overflow-hidden">
                                        {/* Product Type header row */}
                                        <CardHeader className="border-b border-border p-0">
                                            <div className="flex items-center gap-3 px-5 py-4">
                                                <button
                                                    id={`toggle-type-${type.product_type_id}`}
                                                    onClick={() => toggleExpand(type.product_type_id)}
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                                                </button>
                                                <div className="flex-1">
                                                    <CardTitle className="text-base">{type.name}</CardTitle>
                                                    {type.description && <CardDescription className="mt-0.5">{type.description}</CardDescription>}
                                                </div>
                                                <span className="text-xs text-muted-foreground">{activeVariants.length} variant{activeVariants.length !== 1 ? 's' : ''}</span>
                                                <Button
                                                    id={`add-variant-${type.product_type_id}`}
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openAddVariant(type.product_type_id)}
                                                >
                                                    <Plus className="mr-1.5 size-3.5" />
                                                    Add Variant
                                                </Button>
                                                <Button
                                                    id={`edit-type-${type.product_type_id}`}
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => openEditType(type)}
                                                >
                                                    <Pencil className="size-3.5" />
                                                </Button>
                                            </div>
                                        </CardHeader>

                                        {/* Variants table */}
                                        {isExpanded && (
                                            <div className="overflow-x-auto">
                                                {activeVariants.length === 0 && deletedVariants.length === 0 ? (
                                                    <p className="px-5 py-4 text-sm text-muted-foreground">No variants yet.</p>
                                                ) : (
                                                    <table className="w-full min-w-[50rem] text-left text-sm">
                                                        <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                                                            <tr>
                                                                <th className="px-5 py-3 font-medium">Variant</th>
                                                                <th className="px-5 py-3 font-medium">Size</th>
                                                                <th className="px-5 py-3 font-medium">Container</th>
                                                                <th className="px-5 py-3 font-medium">MOQ</th>
                                                                <th className="px-5 py-3 font-medium">Availability</th>
                                                                <th className="px-5 py-3 font-medium">Catalog</th>
                                                                <th className="px-5 py-3 font-medium"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {activeVariants.map((variant) => (
                                                                <tr key={variant.variant_id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                                                                    <td className="px-5 py-4 font-medium">{variant.name}</td>
                                                                    <td className="px-5 py-4 text-muted-foreground">
                                                                        {variant.size_value != null ? `${variant.size_value}${variant.size_unit ?? ''}` : '—'}
                                                                    </td>
                                                                    <td className="px-5 py-4 text-muted-foreground">{variant.container_type ?? '—'}</td>
                                                                    <td className="px-5 py-4">
                                                                        {variant.current_moq ? (
                                                                            <span className="font-medium">{variant.current_moq.min_quantity.toLocaleString()} units</span>
                                                                        ) : (
                                                                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                                                                No MOQ set
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-5 py-4">
                                                                        <AvailabilityBadge value={variant.is_available} />
                                                                    </td>
                                                                    <td className="px-5 py-4">
                                                                        <PublishedBadge value={variant.is_published} />
                                                                    </td>
                                                                    <td className="px-5 py-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <Button
                                                                                id={`edit-variant-${variant.variant_id}`}
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                onClick={() => openEditVariant(variant, type.product_type_id)}
                                                                            >
                                                                                <Pencil className="size-3.5" />
                                                                            </Button>
                                                                            <Button
                                                                                id={`delete-variant-${variant.variant_id}`}
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                className="text-destructive hover:text-destructive"
                                                                                onClick={() => deleteVariant(variant.variant_id)}
                                                                            >
                                                                                <Trash2 className="size-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {/* Soft-deleted variants (grayed out) */}
                                                            {deletedVariants.map((variant) => (
                                                                <tr key={`del-${variant.variant_id}`} className="border-b border-border/40 last:border-0 opacity-50">
                                                                    <td className="px-5 py-3 font-medium line-through">{variant.name}</td>
                                                                    <td className="px-5 py-3 text-muted-foreground">
                                                                        {variant.size_value != null ? `${variant.size_value}${variant.size_unit ?? ''}` : '—'}
                                                                    </td>
                                                                    <td className="px-5 py-3 text-muted-foreground">{variant.container_type ?? '—'}</td>
                                                                    <td className="px-5 py-3 text-muted-foreground">—</td>
                                                                    <td className="px-5 py-3"><span className="text-xs text-muted-foreground">Removed</span></td>
                                                                    <td className="px-5 py-3"></td>
                                                                    <td className="px-5 py-3">
                                                                        <Button
                                                                            id={`restore-variant-${variant.variant_id}`}
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => restoreVariant(variant.variant_id)}
                                                                        >
                                                                            <RotateCcw className="size-3.5" />
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* ── Add / Edit Product Type Modal ──────────────────────────────── */}
            <Dialog open={showTypeModal} onOpenChange={setShowTypeModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingType ? 'Edit Product Type' : 'New Product Type'}</DialogTitle>
                        <DialogDescription>
                            {editingType ? 'Update the product type details.' : 'Add a new top-level product category (e.g. Mineral Water).'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="type-name">Name</Label>
                            <Input
                                id="type-name"
                                value={typeForm.data.name}
                                onChange={(e) => typeForm.setData('name', e.target.value)}
                                placeholder="e.g. Mineral Water"
                            />
                            {typeForm.errors.name && <p className="text-xs text-destructive">{typeForm.errors.name}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="type-description">Description (optional)</Label>
                            <Input
                                id="type-description"
                                value={typeForm.data.description}
                                onChange={(e) => typeForm.setData('description', e.target.value)}
                                placeholder="Brief description"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTypeModal(false)}>Cancel</Button>
                        <Button id="submit-type-btn" onClick={submitType} disabled={typeForm.processing}>
                            {editingType ? 'Save Changes' : 'Create Type'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Add / Edit Variant Modal ───────────────────────────────────── */}
            <Dialog open={showVariantModal} onOpenChange={setShowVariantModal}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingVariant ? 'Edit Variant' : 'Add Variant'}</DialogTitle>
                        <DialogDescription>
                            {editingVariant ? 'Update the variant details.' : 'Add a specific orderable form to this product type.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 py-2">
                        <div className="col-span-2 space-y-1.5">
                            <Label htmlFor="variant-name">Variant Name</Label>
                            <Input
                                id="variant-name"
                                value={variantForm.data.name}
                                onChange={(e) => variantForm.setData('name', e.target.value)}
                                placeholder="e.g. 500ml"
                            />
                            {variantForm.errors.name && <p className="text-xs text-destructive">{variantForm.errors.name}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="variant-size-value">Size Value</Label>
                            <Input
                                id="variant-size-value"
                                type="number"
                                value={variantForm.data.size_value}
                                onChange={(e) => variantForm.setData('size_value', e.target.value)}
                                placeholder="e.g. 500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="variant-size-unit">Unit</Label>
                            <Select value={variantForm.data.size_unit} onValueChange={(v) => variantForm.setData('size_unit', v)}>
                                <SelectTrigger id="variant-size-unit">
                                    <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ml">ml</SelectItem>
                                    <SelectItem value="L">L</SelectItem>
                                    <SelectItem value="g">g</SelectItem>
                                    <SelectItem value="kg">kg</SelectItem>
                                    <SelectItem value="oz">oz</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <Label htmlFor="variant-container">Container Type</Label>
                            <Input
                                id="variant-container"
                                value={variantForm.data.container_type}
                                onChange={(e) => variantForm.setData('container_type', e.target.value)}
                                placeholder="e.g. PET Bottle"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Availability</Label>
                            <Select
                                value={variantForm.data.is_available ? 'true' : 'false'}
                                onValueChange={(v) => variantForm.setData('is_available', v === 'true')}
                            >
                                <SelectTrigger id="variant-available">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Available</SelectItem>
                                    <SelectItem value="false">Unavailable</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Catalog Visibility</Label>
                            <Select
                                value={variantForm.data.is_published ? 'true' : 'false'}
                                onValueChange={(v) => variantForm.setData('is_published', v === 'true')}
                            >
                                <SelectTrigger id="variant-published">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="false">Unpublished (internal only)</SelectItem>
                                    <SelectItem value="true">Published (visible to customers)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <Label htmlFor="variant-notes">Notes (optional)</Label>
                            <Input
                                id="variant-notes"
                                value={variantForm.data.notes}
                                onChange={(e) => variantForm.setData('notes', e.target.value)}
                                placeholder="Any additional notes"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowVariantModal(false)}>Cancel</Button>
                        <Button id="submit-variant-btn" onClick={submitVariant} disabled={variantForm.processing}>
                            {editingVariant ? 'Save Changes' : 'Add Variant'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
