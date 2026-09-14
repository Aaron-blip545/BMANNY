import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { AlertTriangle, ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface MoqRule {
    moq_rule_id: number;
    min_quantity: number;
    effective_date: string;
    notes: string | null;
    deleted_at: string | null;
    creator: { full_name: string } | null;
}

interface ProductType {
    product_type_id: number;
    name: string;
}

interface Variant {
    variant_id: number;
    name: string;
    size_value: number | null;
    size_unit: string | null;
    container_type: string | null;
    product_type: ProductType | null;
    moq_rules: MoqRule[];
}

interface Props {
    variants: Variant[];
    variantsWithoutMoq: number[]; // variant_id list
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Product Controller', href: '/product-controller/dashboard' },
    { title: 'MOQ Management', href: '/product-controller/moq' },
];

export default function MoqPage({ variants, variantsWithoutMoq }: Props) {
    const [expandedVariants, setExpandedVariants] = useState<Record<number, boolean>>({});
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState<MoqRule | null>(null);

    const form = useForm({
        variant_id: 0,
        min_quantity: '',
        effective_date: new Date().toISOString().slice(0, 10),
        notes: '',
    });

    const openSetMoq = (variantId: number) => {
        form.reset();
        form.setData({ variant_id: variantId, min_quantity: '', effective_date: new Date().toISOString().slice(0, 10), notes: '' });
        setEditingRule(null);
        setShowModal(true);
    };

    const openEditRule = (rule: MoqRule, variantId: number) => {
        form.setData({
            variant_id: variantId,
            min_quantity: rule.min_quantity.toString(),
            effective_date: rule.effective_date,
            notes: rule.notes ?? '',
        });
        setEditingRule(rule);
        setShowModal(true);
    };

    const submit = () => {
        if (editingRule) {
            form.put(route('product-controller.moq.update', editingRule.moq_rule_id), {
                onSuccess: () => setShowModal(false),
            });
        } else {
            form.post(route('product-controller.moq.store'), {
                onSuccess: () => setShowModal(false),
            });
        }
    };

    const destroyRule = (id: number) => {
        if (confirm('Remove this MOQ rule? The audit record will be soft-deleted.')) {
            router.delete(route('product-controller.moq.destroy', id));
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedVariants((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const currentMoq = (variant: Variant): MoqRule | undefined => {
        const today = new Date().toISOString().slice(0, 10);
        return variant.moq_rules
            .filter((r) => !r.deleted_at && r.effective_date <= today)
            .sort((a, b) => b.effective_date.localeCompare(a.effective_date))[0];
    };

    const noMoq = variantsWithoutMoq.length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="MOQ Management" />

            <main className="bmanny-page">
                <div className="bmanny-page-inner space-y-5">
                    <section className="bmanny-page-header">
                        <p className="bmanny-page-eyebrow">Product Controller</p>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-foreground">MOQ Management</h1>
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                            Set and review minimum order quantities per variant. Expand a row to see the full MOQ history.
                        </p>
                    </section>

                    {/* Alert bar for variants missing MOQ */}
                    {noMoq > 0 && (
                        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400">
                            <AlertTriangle className="size-4 shrink-0" />
                            <span>
                                <strong>{noMoq} variant{noMoq !== 1 ? 's' : ''}</strong> {noMoq !== 1 ? 'have' : 'has'} no MOQ rule set. Sales Agents cannot quote these.
                            </span>
                        </div>
                    )}

                    <Card className="bmanny-workspace overflow-hidden">
                        <CardHeader className="border-b border-border p-5">
                            <CardTitle className="text-base">Variant MOQ Rules</CardTitle>
                            <CardDescription>Expand any row to view or edit the full MOQ history for that variant.</CardDescription>
                        </CardHeader>

                        {variants.length === 0 ? (
                            <CardContent className="bmanny-empty-state min-h-64">
                                <p className="text-sm text-muted-foreground">No variants in the catalog yet. Add variants first.</p>
                            </CardContent>
                        ) : (
                            <div className="divide-y divide-border">
                                {variants.map((variant) => {
                                    const active = currentMoq(variant);
                                    const isMissing = variantsWithoutMoq.includes(variant.variant_id);
                                    const isExpanded = expandedVariants[variant.variant_id] ?? false;
                                    const activeRules = variant.moq_rules.filter((r) => !r.deleted_at);

                                    return (
                                        <div key={variant.variant_id}>
                                            {/* Variant summary row */}
                                            <div className={`flex items-center gap-4 px-5 py-4 ${isMissing ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                                                <button
                                                    id={`toggle-moq-${variant.variant_id}`}
                                                    onClick={() => toggleExpand(variant.variant_id)}
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                                                </button>

                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">
                                                        {variant.product_type?.name} — {variant.name}
                                                        {variant.container_type ? ` (${variant.container_type})` : ''}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {variant.size_value != null ? `${variant.size_value}${variant.size_unit ?? ''}` : ''}
                                                    </p>
                                                </div>

                                                <div className="text-right">
                                                    {active ? (
                                                        <div>
                                                            <p className="text-sm font-semibold">{active.min_quantity.toLocaleString()} units</p>
                                                            <p className="text-xs text-muted-foreground">Since {active.effective_date}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                                            No MOQ set
                                                        </span>
                                                    )}
                                                </div>

                                                <Button
                                                    id={`set-moq-${variant.variant_id}`}
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openSetMoq(variant.variant_id)}
                                                >
                                                    <Plus className="mr-1.5 size-3.5" />
                                                    Set MOQ
                                                </Button>
                                            </div>

                                            {/* MOQ History (expanded) */}
                                            {isExpanded && (
                                                <div className="border-t border-border/50 bg-muted/30 px-5 py-3">
                                                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">MOQ History</p>
                                                    {activeRules.length === 0 ? (
                                                        <p className="text-xs text-muted-foreground">No rules recorded.</p>
                                                    ) : (
                                                        <table className="w-full text-left text-xs">
                                                            <thead>
                                                                <tr className="text-muted-foreground">
                                                                    <th className="pb-2 pr-8 font-medium">Min Quantity</th>
                                                                    <th className="pb-2 pr-8 font-medium">Effective Date</th>
                                                                    <th className="pb-2 pr-8 font-medium">Set By</th>
                                                                    <th className="pb-2 font-medium">Notes</th>
                                                                    <th className="pb-2"></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {activeRules.map((rule) => (
                                                                    <tr key={rule.moq_rule_id} className="border-t border-border/40">
                                                                        <td className="py-2 pr-8 font-medium">{rule.min_quantity.toLocaleString()} units</td>
                                                                        <td className="py-2 pr-8 text-muted-foreground">{rule.effective_date}</td>
                                                                        <td className="py-2 pr-8 text-muted-foreground">{rule.creator?.full_name ?? '—'}</td>
                                                                        <td className="py-2 text-muted-foreground">{rule.notes ?? '—'}</td>
                                                                        <td className="py-2">
                                                                            <div className="flex items-center gap-1">
                                                                                <Button
                                                                                    id={`edit-moq-rule-${rule.moq_rule_id}`}
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    className="h-6 w-6 p-0"
                                                                                    onClick={() => openEditRule(rule, variant.variant_id)}
                                                                                >
                                                                                    <Pencil className="size-3" />
                                                                                </Button>
                                                                                <Button
                                                                                    id={`delete-moq-rule-${rule.moq_rule_id}`}
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                                                                    onClick={() => destroyRule(rule.moq_rule_id)}
                                                                                >
                                                                                    <Trash2 className="size-3" />
                                                                                </Button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>
            </main>

            {/* ── Set / Edit MOQ Modal ────────────────────────────────────────── */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingRule ? 'Edit MOQ Rule' : 'Set MOQ'}</DialogTitle>
                        <DialogDescription>
                            {editingRule
                                ? 'Update this MOQ rule. The change is logged in history.'
                                : 'Set the minimum order quantity for this variant. A history record will be created.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {!editingRule && (
                            <div className="space-y-1.5">
                                <Label htmlFor="moq-variant">Variant</Label>
                                <Select
                                    value={form.data.variant_id ? form.data.variant_id.toString() : ''}
                                    onValueChange={(v) => form.setData('variant_id', parseInt(v))}
                                >
                                    <SelectTrigger id="moq-variant">
                                        <SelectValue placeholder="Select variant" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {variants.map((v) => (
                                            <SelectItem key={v.variant_id} value={v.variant_id.toString()}>
                                                {v.product_type?.name} — {v.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.variant_id && <p className="text-xs text-destructive">{form.errors.variant_id}</p>}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="moq-quantity">Minimum Quantity (units)</Label>
                            <Input
                                id="moq-quantity"
                                type="number"
                                min={1}
                                value={form.data.min_quantity}
                                onChange={(e) => form.setData('min_quantity', e.target.value)}
                                placeholder="e.g. 1000"
                            />
                            {form.errors.min_quantity && <p className="text-xs text-destructive">{form.errors.min_quantity}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="moq-date">Effective Date</Label>
                            <Input
                                id="moq-date"
                                type="date"
                                value={form.data.effective_date}
                                onChange={(e) => form.setData('effective_date', e.target.value)}
                            />
                            {form.errors.effective_date && <p className="text-xs text-destructive">{form.errors.effective_date}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="moq-notes">Notes (optional)</Label>
                            <Input
                                id="moq-notes"
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                placeholder="Reason for this MOQ"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button id="submit-moq-btn" onClick={submit} disabled={form.processing}>
                            {editingRule ? 'Save Changes' : 'Set MOQ'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
