import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Calendar,
    ChevronDown,
    ChevronRight,
    ChevronsUpDown,
    History,
    Pencil,
    Plus,
    Search,
    SlidersHorizontal,
    Trash2,
    User,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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
    product_type: ProductType | null;
    moq_rules: MoqRule[];
}

interface Props {
    variants: Variant[];
    variantsWithoutMoq: number[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Product Controller', href: '/product-controller/dashboard' },
    { title: 'MOQ Management', href: '/product-controller/moq' },
];

export default function MoqPage({ variants = [], variantsWithoutMoq = [] }: Props) {
    const [expandedVariants, setExpandedVariants] = useState<Record<number, boolean>>({});
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState<MoqRule | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'configured' | 'missing'>('all');

    const form = useForm({
        variant_id: 0,
        min_quantity: '',
        effective_date: new Date().toISOString().slice(0, 10),
        notes: '',
    });

    const openSetMoq = (variantId?: number) => {
        form.reset();
        form.setData({
            variant_id: variantId ?? (variants[0]?.variant_id || 0),
            min_quantity: '',
            effective_date: new Date().toISOString().slice(0, 10),
            notes: '',
        });
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
        if (confirm('Remove this MOQ rule? The record will be soft-deleted from active rules.')) {
            router.delete(route('product-controller.moq.destroy', id));
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedVariants((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleExpandAll = () => {
        const allExpanded = Object.keys(expandedVariants).length === variants.length && Object.values(expandedVariants).every(Boolean);
        if (allExpanded) {
            setExpandedVariants({});
        } else {
            const next: Record<number, boolean> = {};
            variants.forEach((v) => {
                next[v.variant_id] = true;
            });
            setExpandedVariants(next);
        }
    };

    const getActiveRules = (variant: Variant): MoqRule[] => {
        const rules: MoqRule[] = variant.moq_rules || (variant as any).moqRules || [];
        return rules.filter((r) => !r.deleted_at);
    };

    const currentMoq = (variant: Variant): MoqRule | undefined => {
        const active = getActiveRules(variant);
        if (active.length === 0) return undefined;
        return active.sort((a, b) => {
            const dateCmp = (b.effective_date || '').localeCompare(a.effective_date || '');
            return dateCmp !== 0 ? dateCmp : (b.moq_rule_id || 0) - (a.moq_rule_id || 0);
        })[0];
    };

    // Calculate metrics based on current rules
    const totalVariants = variants.length;
    const configuredVariants = useMemo(() => {
        return variants.filter((v) => Boolean(currentMoq(v)));
    }, [variants]);

    const configuredCount = configuredVariants.length;
    const missingCount = totalVariants - configuredCount;

    // Filtered list
    const filteredVariants = useMemo(() => {
        return variants.filter((variant) => {
            const hasMoq = Boolean(currentMoq(variant));
            if (statusFilter === 'configured' && !hasMoq) return false;
            if (statusFilter === 'missing' && hasMoq) return false;

            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const nameMatch = variant.name.toLowerCase().includes(query);
                const typeMatch = variant.product_type?.name.toLowerCase().includes(query) ?? false;
                const sizeMatch = `${variant.size_value}${variant.size_unit}`.toLowerCase().includes(query);
                if (!nameMatch && !typeMatch && !sizeMatch) return false;
            }

            return true;
        });
    }, [variants, statusFilter, searchQuery]);

    const allExpandedState = Object.keys(expandedVariants).length === variants.length && variants.length > 0 && Object.values(expandedVariants).every(Boolean);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="MOQ Management" />

            <main className="bmanny-page">
                <div className="bmanny-page-inner space-y-6">
                    {/* Header with BMANNY Accent Line & Styling */}
                    <section className="bmanny-page-header">
                        <p className="bmanny-page-eyebrow">Product Controller</p>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-foreground">MOQ Management</h1>
                                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Configure, review, and track minimum order quantities across all catalog product variants.
                                </p>
                            </div>
                            <Button id="set-new-moq-btn" onClick={() => openSetMoq()} className="shrink-0 font-medium shadow-sm">
                                <Plus className="mr-1.5 size-4" />
                                Set New MOQ
                            </Button>
                        </div>
                    </section>

                    {/* Filter & Search Bar */}
                    <Card className="bmanny-workspace overflow-hidden border-border/80 shadow-xs">
                        <CardHeader className="border-b border-border/60 bg-muted/20 p-4 sm:p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                                    {/* Search Input */}
                                    <div className="relative flex-1 min-w-[200px] max-w-md">
                                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            placeholder="Search by variant, type, or size..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 h-9 text-sm"
                                        />
                                    </div>

                                    {/* Status Filter Dropdown */}
                                    <div className="w-full sm:w-48">
                                        <Select value={statusFilter} onValueChange={(v: 'all' | 'configured' | 'missing') => setStatusFilter(v)}>
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue placeholder="All" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All ({totalVariants})</SelectItem>
                                                <SelectItem value="configured">Configured ({configuredCount})</SelectItem>
                                                <SelectItem value="missing">Unset ({missingCount})</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Expand / Collapse All Button */}
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={toggleExpandAll}
                                        className="h-9 text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        <ChevronsUpDown className="mr-1.5 size-3.5" />
                                        {allExpandedState ? 'Collapse All' : 'Expand All'}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        {/* Variants List / Table */}
                        {filteredVariants.length === 0 ? (
                            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                                <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                    <Search className="size-6" />
                                </div>
                                <h3 className="mt-4 text-base font-semibold">No matching variants found</h3>
                                <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                                    {searchQuery || selectedType !== 'all' || statusFilter !== 'all'
                                        ? 'Try adjusting your search criteria or clear active filters.'
                                        : 'No variants are currently available in the catalog.'}
                                </p>
                                {(searchQuery || selectedType !== 'all' || statusFilter !== 'all') && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-4"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSelectedType('all');
                                            setStatusFilter('all');
                                        }}
                                    >
                                        Reset Filters
                                    </Button>
                                )}
                            </CardContent>
                        ) : (
                            <div className="divide-y divide-border/60">
                                {filteredVariants.map((variant) => {
                                    const active = currentMoq(variant);
                                    const isExpanded = expandedVariants[variant.variant_id] ?? false;
                                    const activeRules = getActiveRules(variant);

                                    return (
                                        <div
                                            key={variant.variant_id}
                                            className="transition-colors hover:bg-muted/15"
                                        >
                                            {/* Variant Summary Item */}
                                            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                                {/* Left: Info */}
                                                <div className="flex items-start gap-3">
                                                    <button
                                                        id={`toggle-moq-${variant.variant_id}`}
                                                        onClick={() => toggleExpand(variant.variant_id)}
                                                        className="mt-0.5 flex size-7 items-center justify-center rounded-md border border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                                        title="Toggle History"
                                                    >
                                                        {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                                                    </button>

                                                    <div className="space-y-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {variant.product_type && (
                                                                <span className="inline-flex items-center rounded-md bg-[#eef4ff] text-[#1547c0] dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 text-xs font-semibold">
                                                                    {variant.product_type.name}
                                                                </span>
                                                            )}
                                                            <h3 className="text-sm font-semibold text-foreground">
                                                                {variant.name}
                                                            </h3>
                                                            {variant.size_value != null && (
                                                                <span className="inline-flex items-center rounded-md border border-border/80 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                                                    {variant.size_value} {variant.size_unit ?? ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                            <span>{activeRules.length} rule{activeRules.length !== 1 ? 's' : ''} recorded</span>
                                                            {active?.notes && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="italic truncate max-w-xs">{active.notes}</span>
                                                                </>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Right: MOQ Value & Actions */}
                                                <div className="flex items-center justify-between sm:justify-end gap-4 pl-10 sm:pl-0">
                                                    <div className="text-left sm:text-right">
                                                        {active ? (
                                                            <div>
                                                                <div className="flex items-baseline sm:justify-end gap-1.5">
                                                                    <span className="text-base font-bold tracking-tight text-[#1547c0] dark:text-blue-300">
                                                                        {active.min_quantity.toLocaleString()}
                                                                    </span>
                                                                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                                                                        units
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px] text-muted-foreground flex items-center sm:justify-end gap-1">
                                                                    <Calendar className="size-3" />
                                                                    <span>Effective {active.effective_date ? active.effective_date.slice(0, 10) : '—'}</span>
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50/70 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300">
                                                                Unset
                                                            </span>
                                                        )}
                                                    </div>

                                                    <Button
                                                        id={`set-moq-${variant.variant_id}`}
                                                        size="sm"
                                                        variant={active ? "outline" : "default"}
                                                        onClick={() => openSetMoq(variant.variant_id)}
                                                        className="h-8 gap-1.5 text-xs font-medium shadow-2xs"
                                                    >
                                                        {active ? (
                                                            <>
                                                                <Pencil className="size-3" />
                                                                Update MOQ
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Plus className="size-3" />
                                                                Set MOQ
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Collapsible History Section */}
                                            {isExpanded && (
                                                <div className="border-t border-border/60 bg-muted/30 px-6 py-4">
                                                    <div className="flex items-center justify-between pb-3">
                                                        <div className="flex items-center gap-2">
                                                            <History className="size-4 text-[#1547c0] dark:text-blue-300" />
                                                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                                MOQ Rule Change History
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">
                                                            {activeRules.length} recorded version{activeRules.length !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>

                                                    {activeRules.length === 0 ? (
                                                        <div className="rounded-lg border border-dashed border-border/80 p-4 text-center text-xs text-muted-foreground">
                                                            No MOQ history recorded for this variant yet.
                                                        </div>
                                                    ) : (
                                                        <div className="overflow-x-auto rounded-lg border border-border/70 bg-card shadow-2xs">
                                                            <table className="w-full text-left text-xs">
                                                                <thead className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                                    <tr>
                                                                        <th className="px-4 py-2.5">Min Quantity</th>
                                                                        <th className="px-4 py-2.5">Effective Date</th>
                                                                        <th className="px-4 py-2.5">Configured By</th>
                                                                        <th className="px-4 py-2.5">Notes</th>
                                                                        <th className="px-4 py-2.5 text-right">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-border/60">
                                                                    {activeRules.map((rule) => {
                                                                        const isCurrentActive = active?.moq_rule_id === rule.moq_rule_id;
                                                                        return (
                                                                            <tr
                                                                                key={rule.moq_rule_id}
                                                                                className={`transition-colors hover:bg-muted/30 ${
                                                                                    isCurrentActive ? 'bg-blue-50/40 dark:bg-blue-950/20 font-medium' : ''
                                                                                }`}
                                                                            >
                                                                                <td className="px-4 py-3">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-semibold text-foreground">
                                                                                            {rule.min_quantity.toLocaleString()} units
                                                                                        </span>
                                                                                        {isCurrentActive && (
                                                                                            <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                                                                                                Active
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-4 py-3 text-muted-foreground">
                                                                                    {rule.effective_date ? rule.effective_date.slice(0, 10) : '—'}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-muted-foreground">
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        <User className="size-3 opacity-70" />
                                                                                        <span>{rule.creator?.full_name ?? 'System'}</span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-4 py-3 text-muted-foreground">
                                                                                    {rule.notes ? (
                                                                                        <span className="italic">{rule.notes}</span>
                                                                                    ) : (
                                                                                        <span className="text-muted-foreground/40">—</span>
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-right">
                                                                                    <div className="flex items-center justify-end">
                                                                                        <Button
                                                                                            id={`delete-moq-rule-${rule.moq_rule_id}`}
                                                                                            size="sm"
                                                                                            variant="ghost"
                                                                                            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                                            onClick={() => destroyRule(rule.moq_rule_id)}
                                                                                            title="Delete Rule"
                                                                                        >
                                                                                            <Trash2 className="size-3 mr-1" />
                                                                                            Delete
                                                                                        </Button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
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

            {/* Set / Edit MOQ Modal Dialog */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                            <SlidersHorizontal className="size-5 text-primary" />
                            {editingRule ? 'Edit MOQ Rule' : 'Set Minimum Order Quantity'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingRule
                                ? 'Update this MOQ configuration rule. The change will update the active audit record.'
                                : 'Define the minimum production order quantity required for quotation and order creation.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-3">
                        {!editingRule && (
                            <div className="space-y-1.5">
                                <Label htmlFor="moq-variant" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Target Product Variant
                                </Label>
                                <Select
                                    value={form.data.variant_id ? form.data.variant_id.toString() : ''}
                                    onValueChange={(v) => form.setData('variant_id', parseInt(v))}
                                >
                                    <SelectTrigger id="moq-variant" className="h-10">
                                        <SelectValue placeholder="Select target variant" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {variants.map((v) => (
                                            <SelectItem key={v.variant_id} value={v.variant_id.toString()}>
                                                <span className="font-semibold">{v.product_type?.name}</span> — {v.name} {v.size_value ? `(${v.size_value}${v.size_unit ?? ''})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.variant_id && (
                                    <p className="text-xs font-medium text-destructive">{form.errors.variant_id}</p>
                                )}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="moq-quantity" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Minimum Quantity (Units / Pieces)
                            </Label>
                            <div className="relative">
                                <Input
                                    id="moq-quantity"
                                    type="number"
                                    min={1}
                                    value={form.data.min_quantity}
                                    onChange={(e) => form.setData('min_quantity', e.target.value)}
                                    placeholder="e.g. 500"
                                    className="h-10 pr-14"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase text-muted-foreground">
                                    units
                                </span>
                            </div>
                            {form.errors.min_quantity && (
                                <p className="text-xs font-medium text-destructive">{form.errors.min_quantity}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="moq-date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Effective Date
                            </Label>
                            <Input
                                id="moq-date"
                                type="date"
                                value={form.data.effective_date}
                                onChange={(e) => form.setData('effective_date', e.target.value)}
                                className="h-10"
                            />
                            {form.errors.effective_date && (
                                <p className="text-xs font-medium text-destructive">{form.errors.effective_date}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="moq-notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Revision Notes / Context (Optional)
                            </Label>
                            <Input
                                id="moq-notes"
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                placeholder="e.g. Updated for 2026 bulk production requirements"
                                className="h-10"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button id="submit-moq-btn" onClick={submit} disabled={form.processing}>
                            {editingRule ? 'Save Changes' : 'Set MOQ Rule'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
