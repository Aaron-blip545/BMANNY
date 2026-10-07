import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

type Option = { packaging_id?: number; customization_id?: number; name: string; category?: string; is_available: boolean };
type Variant = { variant_id: number; name: string; sku: string | null; is_available: boolean; current_moq: { min_quantity: number } | null };
type ProductType = { product_type_id: number; name: string; variants: Variant[]; packaging_options: Option[]; customization_options: Option[] };

export default function ProductConfigurations({ productTypes, packagingOptions, customizationOptions }: { productTypes: ProductType[]; packagingOptions: Option[]; customizationOptions: Option[] }) {
    const [selectedId, setSelectedId] = useState<number | null>(productTypes[0]?.product_type_id ?? null);
    const selected = productTypes.find((product) => product.product_type_id === selectedId);
    const [packagingIds, setPackagingIds] = useState<number[]>(selected?.packaging_options.map((option) => option.packaging_id!) ?? []);
    const [customizationIds, setCustomizationIds] = useState<number[]>(selected?.customization_options.map((option) => option.customization_id!) ?? []);

    const choose = (product: ProductType) => {
        setSelectedId(product.product_type_id);
        setPackagingIds(product.packaging_options.map((option) => option.packaging_id!));
        setCustomizationIds(product.customization_options.map((option) => option.customization_id!));
    };
    const toggle = (id: number, values: number[], setValues: (items: number[]) => void) => setValues(values.includes(id) ? values.filter((item) => item !== id) : [...values, id]);
    const save = () => selected && router.put(route('product-controller.configurations.update', selected.product_type_id), { packaging_ids: packagingIds, customization_ids: customizationIds });

    return <AppLayout breadcrumbs={[{ title: 'Product Controller', href: '/product-controller/dashboard' }, { title: 'Product Options', href: '/product-controller/configurations' } satisfies BreadcrumbItem]}>
        <Head title="Product Options" />
        <main className="bmanny-page"><div className="bmanny-page-inner space-y-5">
            <section className="bmanny-page-header"><p className="bmanny-page-eyebrow">Product Controller</p><h1 className="text-2xl font-semibold tracking-tight">Product-specific options</h1><p className="mt-1 text-sm text-muted-foreground">Choose which variants, packaging, labels, and customization options can be offered for each product.</p></section>
            {productTypes.length === 0 ? <Card className="bmanny-workspace"><CardContent className="py-12 text-center text-sm text-muted-foreground">Add a product first, then configure its allowed options.</CardContent></Card> : <div className="grid gap-5 lg:grid-cols-[17rem_1fr]">
                <Card className="bmanny-workspace h-fit"><CardHeader><CardTitle className="text-base">Products</CardTitle></CardHeader><CardContent className="space-y-1">{productTypes.map((product) => <Button key={product.product_type_id} variant={selectedId === product.product_type_id ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => choose(product)}>{product.name}</Button>)}</CardContent></Card>
                {selected && <div className="space-y-5">
                    <Card className="bmanny-workspace"><CardHeader><CardTitle>{selected.name} variants</CardTitle><CardDescription>Variants and their automatically generated SKUs. Set MOQ on the MOQ Management page.</CardDescription></CardHeader><CardContent className="space-y-2">{selected.variants.map((variant) => <div key={variant.variant_id} className="flex justify-between rounded-md border p-3 text-sm"><span>{variant.name} {!variant.is_available && <span className="text-muted-foreground">(unavailable)</span>}</span><span className="font-mono text-xs text-muted-foreground">{variant.sku ?? 'SKU pending'} · MOQ {variant.current_moq?.min_quantity ?? 'not set'}</span></div>)}</CardContent></Card>
                    <Card className="bmanny-workspace"><CardHeader><CardTitle>Allowed packaging, containers, and labels</CardTitle><CardDescription>Only selected options should be offered for this product.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{packagingOptions.map((option) => <label key={option.packaging_id} className="flex items-center gap-3 rounded-md border p-3 text-sm"><Checkbox checked={packagingIds.includes(option.packaging_id!)} onCheckedChange={() => toggle(option.packaging_id!, packagingIds, setPackagingIds)} /><span>{option.name}<span className="ml-2 text-xs text-muted-foreground">{option.category}</span>{!option.is_available && <span className="ml-2 text-xs text-destructive">Unavailable</span>}</span></label>)}</CardContent></Card>
                    <Card className="bmanny-workspace"><CardHeader><CardTitle>Allowed customization options</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{customizationOptions.map((option) => <label key={option.customization_id} className="flex items-center gap-3 rounded-md border p-3 text-sm"><Checkbox checked={customizationIds.includes(option.customization_id!)} onCheckedChange={() => toggle(option.customization_id!, customizationIds, setCustomizationIds)} /><span>{option.name}{!option.is_available && <span className="ml-2 text-xs text-destructive">Unavailable</span>}</span></label>)}</CardContent></Card>
                    <div className="flex justify-end"><Button onClick={save}>Save allowed options</Button></div>
                </div>}
            </div>}
        </div></main>
    </AppLayout>;
}
