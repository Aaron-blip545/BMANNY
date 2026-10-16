import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

type Option = { packaging_id?: number; customization_id?: number; name: string; category?: string; is_available: boolean };
type Variant = { variant_id: number; name: string; sku: string | null; is_available: boolean; current_moq: { min_quantity: number } | null };
type ProductType = {
    product_type_id: number;
    name: string;
    suggested_srp?: number | null;
    lead_time_days?: number | null;
    net_weight?: string | null;
    packaging_specification?: string | null;
    label_specification?: string | null;
    formulation_notes?: string | null;
    variants: Variant[];
    packaging_options: Option[];
    customization_options: Option[];
};

export default function ProductConfigurations({ productTypes, packagingOptions, customizationOptions }: { productTypes: ProductType[]; packagingOptions: Option[]; customizationOptions: Option[] }) {
    const [selectedId, setSelectedId] = useState<number | null>(productTypes[0]?.product_type_id ?? null);
    const selected = productTypes.find((product) => product.product_type_id === selectedId);
    const [packagingIds, setPackagingIds] = useState<number[]>(selected?.packaging_options.map((option) => option.packaging_id!) ?? []);
    const [customizationIds, setCustomizationIds] = useState<number[]>(selected?.customization_options.map((option) => option.customization_id!) ?? []);
    const [netWeight, setNetWeight] = useState(selected?.net_weight ?? '');
    const [packagingSpecification, setPackagingSpecification] = useState(selected?.packaging_specification ?? '');
    const [labelSpecification, setLabelSpecification] = useState(selected?.label_specification ?? '');
    const [formulationNotes, setFormulationNotes] = useState(selected?.formulation_notes ?? '');

    const choose = (product: ProductType) => {
        setSelectedId(product.product_type_id);
        setPackagingIds(product.packaging_options.map((option) => option.packaging_id!));
        setCustomizationIds(product.customization_options.map((option) => option.customization_id!));
        setNetWeight(product.net_weight ?? '');
        setPackagingSpecification(product.packaging_specification ?? '');
        setLabelSpecification(product.label_specification ?? '');
        setFormulationNotes(product.formulation_notes ?? '');
    };
    const toggle = (id: number, values: number[], setValues: (items: number[]) => void) => setValues(values.includes(id) ? values.filter((item) => item !== id) : [...values, id]);
    const save = () => selected && router.put(route('product-controller.configurations.update', selected.product_type_id), {
        packaging_ids: packagingIds,
        customization_ids: customizationIds,
        net_weight: netWeight,
        packaging_specification: packagingSpecification,
        label_specification: labelSpecification,
        formulation_notes: formulationNotes,
    });

    return <AppLayout breadcrumbs={[{ title: 'Product Controller', href: '/product-controller/dashboard' }, { title: 'Product Options', href: '/product-controller/configurations' } satisfies BreadcrumbItem]}>
        <Head title="Product Options" />
        <main className="bmanny-page"><div className="bmanny-page-inner space-y-5">
            <section className="bmanny-page-header"><p className="bmanny-page-eyebrow">Product Controller</p><h1 className="text-2xl font-semibold tracking-tight">Product-specific options</h1><p className="mt-1 text-sm text-muted-foreground">Choose which variants, packaging, labels, and customization options can be offered for each product.</p><Button className="mt-3" variant="outline" asChild><Link href={route('product-controller.variants.index')}>Manage variants</Link></Button></section>
            {productTypes.length === 0 ? <Card className="bmanny-workspace"><CardContent className="py-12 text-center text-sm text-muted-foreground">Add a product first, then configure its allowed options.</CardContent></Card> : <div className="grid gap-5 lg:grid-cols-[17rem_1fr]">
                <Card className="bmanny-workspace h-fit"><CardHeader><CardTitle className="text-base">Products</CardTitle></CardHeader><CardContent className="space-y-1">{productTypes.map((product) => <Button key={product.product_type_id} variant={selectedId === product.product_type_id ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => choose(product)}>{product.name}</Button>)}</CardContent></Card>
                {selected && <div className="space-y-5">
                    <Card className="bmanny-workspace">
                        <CardHeader>
                            <CardTitle>Client-ready product specification</CardTitle>
                            <CardDescription>Reusable product facts for Sales quotations. Customer details, final quoted price, and payment terms remain in the Sales workflow.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label htmlFor="net_weight" className="mb-1 block text-sm font-medium">Net weight / content</label>
                                <input id="net_weight" value={netWeight} onChange={(event) => setNetWeight(event.target.value)} placeholder="e.g. 120g or 30 capsules" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                            </div>
                            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                                <p className="font-medium">Standard product details</p>
                                <p className="mt-1 text-muted-foreground">Price: ₱{Number(selected.suggested_srp ?? 0).toFixed(2)} · Lead time: {selected.lead_time_days ?? 'Not set'} days</p>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="packaging_specification" className="mb-1 block text-sm font-medium">Packaging details</label>
                                <textarea id="packaging_specification" value={packagingSpecification} onChange={(event) => setPackagingSpecification(event.target.value)} placeholder="e.g. Stand-up pouch, 12 × 20 cm" rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="label_specification" className="mb-1 block text-sm font-medium">Label / printing details</label>
                                <textarea id="label_specification" value={labelSpecification} onChange={(event) => setLabelSpecification(event.target.value)} placeholder="e.g. Full-color sticker label; client branding supplied by Sales" rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="formulation_notes" className="mb-1 block text-sm font-medium">Ingredients / formulation notes</label>
                                <textarea id="formulation_notes" value={formulationNotes} onChange={(event) => setFormulationNotes(event.target.value)} placeholder="e.g. Corn coffee with malunggay and mangosteen" rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bmanny-workspace"><CardHeader><CardTitle>{selected.name} variants</CardTitle><CardDescription>Variants and their automatically generated SKUs. Set MOQ on the MOQ Management page.</CardDescription></CardHeader><CardContent className="space-y-2">{selected.variants.map((variant) => <div key={variant.variant_id} className="flex justify-between rounded-md border p-3 text-sm"><span>{variant.name} {!variant.is_available && <span className="text-muted-foreground">(unavailable)</span>}</span><span className="font-mono text-xs text-muted-foreground">{variant.sku ?? 'SKU pending'} · MOQ {variant.current_moq?.min_quantity ?? 'not set'}</span></div>)}</CardContent></Card>
                    <Card className="bmanny-workspace"><CardHeader><CardTitle>Allowed packaging, containers, and labels</CardTitle><CardDescription>Only selected options should be offered for this product.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{packagingOptions.map((option) => <label key={option.packaging_id} className="flex items-center gap-3 rounded-md border p-3 text-sm"><Checkbox checked={packagingIds.includes(option.packaging_id!)} onCheckedChange={() => toggle(option.packaging_id!, packagingIds, setPackagingIds)} /><span>{option.name}<span className="ml-2 text-xs text-muted-foreground">{option.category}</span>{!option.is_available && <span className="ml-2 text-xs text-destructive">Unavailable</span>}</span></label>)}</CardContent></Card>
                    <Card className="bmanny-workspace"><CardHeader><CardTitle>Allowed customization options</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{customizationOptions.map((option) => <label key={option.customization_id} className="flex items-center gap-3 rounded-md border p-3 text-sm"><Checkbox checked={customizationIds.includes(option.customization_id!)} onCheckedChange={() => toggle(option.customization_id!, customizationIds, setCustomizationIds)} /><span>{option.name}{!option.is_available && <span className="ml-2 text-xs text-destructive">Unavailable</span>}</span></label>)}</CardContent></Card>
                    <div className="flex justify-end"><Button onClick={save}>Save allowed options</Button></div>
                </div>}
            </div>}
        </div></main>
    </AppLayout>;
}
