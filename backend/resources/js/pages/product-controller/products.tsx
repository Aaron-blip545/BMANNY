import { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    Plus,
    Search,
    Check,
    CheckCircle2,
    ChevronDown,
    Pencil,
    Trash2,
    X,
    Package,
    AlertCircle,
    FlaskConical,
    Layers,
    Info,
    Box,
    Sparkles,
    SlidersHorizontal,
    FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface BomItem {
    recipe_id?: number;
    product_id: number;
    raw_material_name?: string;
    raw_material_sku?: string;
    unit_of_measure?: string;
    product_image?: string | null;
    quantity_per_unit: number | string;
    rate: number | string;
    amount: number;
    notes?: string | null;
}

interface RawMaterialOption {
    product_id: number;
    sku: string;
    name: string;
    rate: number;
    unit_of_measure: string;
    stock_quantity: number;
    reorder_level: number;
    product_image?: string | null;
}

export interface PackagingOption {
    packaging_id: number;
    name: string;
    category: string;
    description: string | null;
    is_available: boolean;
    updated_at?: string;
}

export interface CustomizationOption {
    customization_id: number;
    name: string;
    customization_type: string | null;
    description: string | null;
    is_available: boolean;
    updated_at?: string;
}

interface CatalogProduct {
    product_type_id: number;
    product_code?: string;
    name: string;
    category_code: string;
    suggested_srp: number;
    formatted_price: string;
    description: string | null;
    shelf_life: string | null;
    storage_conditions: string | null;
    lead_time_days: number | null;
    formulation_notes: string | null;
    net_weight?: string | null;
    packaging_specification?: string | null;
    label_specification?: string | null;
    packaging_ids?: number[];
    customization_ids?: number[];
    min_quantity?: number | null;
    moq_notes?: string | null;
    variant_id?: number | null;
    image_url: string | null;
    is_active: boolean;
    created_at?: string;
    recipes?: BomItem[];
    gold_recipes?: BomItem[];
    elite_recipes?: BomItem[];
    total_recipe_cost?: number;
    formatted_recipe_cost?: string;
    materials_count?: number;
    package_tiers?: Array<{
        slug: string;
        name: string;
        minimum_quantity: number;
        max_quantity: number | null;
        packaging_details: string;
        label_details: string;
        lead_time_text: string;
    }>;
}

interface Props {
    products: CatalogProduct[];
    categories: string[];
    rawMaterials?: RawMaterialOption[];
    packagingOptions?: PackagingOption[];
    customizationOptions?: CustomizationOption[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Product Controller', href: '/product-controller/dashboard' },
    { title: 'Product Management', href: '/product-controller/products' },
];

const PACKAGING_CATEGORIES = ['Pouch', 'Sachet', 'Bottle', 'Jar', 'Box', 'Label', 'Other'] as const;
const CUSTOMIZATION_TYPES = ['label', 'print', 'emboss', 'cap', 'sleeve', 'other'] as const;

function getCategoryBadgeClass(category: string) {
    switch (category?.toLowerCase()) {
        case 'health & wellness':
            return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
        case 'supplements & wellbeing':
            return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300';
        case 'detox & nutrition':
            return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
        case 'beauty & personal care':
            return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300';
        default:
            return 'bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300';
    }
}

function getCategoryCodePrefix(category: string): string {
    const clean = (category || '').trim().toLowerCase();
    const map: Record<string, string> = {
        'health & wellness': 'HW',
        'supplements & wellbeing': 'SW',
        'detox & nutrition': 'DN',
        'beauty & personal care': 'BP',
        'beverage': 'BV',
        'supplement': 'SP',
        'cosmetic': 'CS',
    };
    if (map[clean]) return map[clean];

    const words = clean.split(/[^a-zA-Z0-9]+/).filter(Boolean);
    if (words.length > 1) {
        return words.map((w) => w[0].toUpperCase()).join('').slice(0, 4);
    }
    return clean.slice(0, 3).toUpperCase() || 'GEN';
}

function generateItemCode(category: string, productList: CatalogProduct[], excludeId?: number): string {
    const prefix = getCategoryCodePrefix(category);
    const targetPrefix = `FP-${prefix}-`;

    let maxNum = 0;
    for (const p of productList) {
        if (excludeId && p.product_type_id === excludeId) continue;
        const code = p.product_code || '';
        if (code.startsWith(targetPrefix)) {
            const numPart = parseInt(code.slice(targetPrefix.length), 10);
            if (!isNaN(numPart) && numPart > maxNum) {
                maxNum = numPart;
            }
        }
    }

    const nextNum = maxNum + 1;
    return `${targetPrefix}${String(nextNum).padStart(4, '0')}`;
}

function RawMaterialCombobox({
    value,
    options,
    onChange,
}: {
    value: number;
    options: RawMaterialOption[];
    onChange: (productId: number) => void;
}) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const selectedOption = options.find((opt) => opt.product_id === value);

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return options;
        const q = searchQuery.toLowerCase();
        return options.filter(
            (opt) =>
                opt.name.toLowerCase().includes(q) ||
                (opt.sku && opt.sku.toLowerCase().includes(q))
        );
    }, [options, searchQuery]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    className="flex h-9 w-full items-center justify-between rounded-lg border border-input/80 bg-background px-3 py-1.5 text-xs text-foreground shadow-xs hover:bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                    <span className="truncate text-left font-medium">
                        {selectedOption
                            ? `${selectedOption.name} (${selectedOption.sku}) — ₱${Number(selectedOption.rate).toFixed(2)}/${selectedOption.unit_of_measure}`
                            : 'Select raw material...'}
                    </span>
                    <ChevronDown className="ml-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-70" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                sideOffset={4}
                className="z-[80] w-[340px] sm:w-[440px] rounded-xl border border-border/80 bg-card p-2 shadow-2xl"
            >
                <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                    <input
                        type="text"
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search raw material or SKU..."
                        className="h-8 w-full rounded-md border border-input/80 bg-muted/20 pl-8 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>

                <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
                    {filtered.length === 0 ? (
                        <p className="py-4 text-center text-xs text-muted-foreground">No matching raw materials found.</p>
                    ) : (
                        filtered.map((mat) => {
                            const isSelected = mat.product_id === value;
                            return (
                                <button
                                    key={mat.product_id}
                                    type="button"
                                    onClick={() => {
                                        onChange(mat.product_id);
                                        setOpen(false);
                                        setSearchQuery('');
                                    }}
                                    className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                                        isSelected
                                            ? 'bg-primary/10 text-primary font-semibold'
                                            : 'text-foreground hover:bg-muted/40 font-medium'
                                    }`}
                                >
                                    <div className="min-w-0 pr-2">
                                        <p className="truncate text-xs">{mat.name}</p>
                                        <p className="font-mono text-[10px] text-muted-foreground">{mat.sku}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="font-mono text-xs font-semibold text-foreground">
                                            ₱{Number(mat.rate).toFixed(2)}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">/{mat.unit_of_measure}</p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

export default function ProductsPage({
    products = [],
    categories = [],
    rawMaterials = [],
    packagingOptions = [],
    customizationOptions = [],
}: Props) {
    // ── Search & Filter State ──────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    // ── Add / Edit Product Modal state ─────────────────────────────────
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [modalTab, setModalTab] = useState<'general' | 'bom' | 'starter' | 'gold' | 'elite'>('general');

    // ── Delete confirmation state ──────────────────────────────────────
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<CatalogProduct | null>(null);
    const [deleting, setDeleting] = useState(false);

    // ── Global Main BOM + Package MOQ/BOM state (unlimited in Product Management) ──
    const [mainBomRows, setMainBomRows] = useState<BomItem[]>([]);
    const [goldBomRows, setGoldBomRows] = useState<BomItem[]>([]);
    const [eliteBomRows, setEliteBomRows] = useState<BomItem[]>([]);
    const [packageMoqs, setPackageMoqs] = useState<{ starter: string; gold: string; elite: string }>({
        starter: '100',
        gold: '5000',
        elite: '10000',
    });
    const [savingBom, setSavingBom] = useState(false);

    // ── Quick Add Modals (Packaging / Customization) ────────────────────
    const [showQuickPkg, setShowQuickPkg] = useState(false);
    const [quickPkgForm, setQuickPkgForm] = useState({ name: '', category: 'Pouch', description: '', is_available: true });
    const [savingQuickPkg, setSavingQuickPkg] = useState(false);

    const [showQuickCust, setShowQuickCust] = useState(false);
    const [quickCustForm, setQuickCustForm] = useState({ name: '', customization_type: 'label', description: '', is_available: true });
    const [savingQuickCust, setSavingQuickCust] = useState(false);

    // Product Form fields (including Packaging, Customization, and MOQ)
    const [formData, setFormData] = useState({
        name: '',
        category_code: 'Health & Wellness',
        product_code: '',
        suggested_srp: '',
        description: '',
        shelf_life: '',
        storage_conditions: '',
        lead_time_days: '',
        formulation_notes: '',
        net_weight: '',
        packaging_specification: '',
        label_specification: '',
        min_quantity: '',
        moq_notes: '',
        packaging_ids: [] as number[],
        customization_ids: [] as number[],
        image_url: '',
        is_active: true,
    });
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const isProdNameAccepted = formData.name.trim().length >= 2 && formData.name.trim().length <= 150;
    const isProdSrpAccepted =
        formData.suggested_srp.trim() !== '' &&
        !Number.isNaN(Number(formData.suggested_srp)) &&
        Number(formData.suggested_srp) >= 0;
    const isProdMoqAccepted =
        formData.min_quantity.trim() === '' ||
        (Number.isInteger(Number(formData.min_quantity)) && Number(formData.min_quantity) >= 1);
    const isProdLeadAccepted =
        formData.lead_time_days.trim() === '' ||
        (Number.isInteger(Number(formData.lead_time_days)) &&
            Number(formData.lead_time_days) >= 1 &&
            Number(formData.lead_time_days) <= 365);
    const isProductFormValid = isProdNameAccepted && isProdSrpAccepted && isProdMoqAccepted && isProdLeadAccepted;

    // ── Filter products ────────────────────────────────────────────────
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesSearch =
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.product_code && p.product_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                p.category_code.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory =
                selectedCategory === 'all' ||
                p.category_code.toLowerCase() === selectedCategory.toLowerCase();

            const matchesStatus =
                selectedStatus === 'all' ||
                (selectedStatus === 'active' && p.is_active) ||
                (selectedStatus === 'inactive' && !p.is_active);

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [products, searchQuery, selectedCategory, selectedStatus]);

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCategory = e.target.value;
        const nextCode = generateItemCode(newCategory, products, editingProduct?.product_type_id);
        setFormData((prev) => ({
            ...prev,
            category_code: newCategory,
            product_code: nextCode,
        }));
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        const defaultCategory = categories.includes('Health & Wellness') ? 'Health & Wellness' : (categories[0] || 'Health & Wellness');
        const autoCode = generateItemCode(defaultCategory, products);
        setFormData({
            name: '',
            category_code: defaultCategory,
            product_code: autoCode,
            suggested_srp: '',
            description: '',
            shelf_life: '',
            storage_conditions: '',
            lead_time_days: '',
            formulation_notes: '',
            net_weight: '',
            packaging_specification: '',
            label_specification: '',
            min_quantity: '',
            moq_notes: '',
            packaging_ids: [],
            customization_ids: [],
            image_url: '',
            is_active: true,
        });
        setSelectedImageFile(null);
        setImagePreview(null);
        setFormErrors({});
        setModalTab('general');
        setIsFormOpen(true);
    };

    const openEditModal = (product: CatalogProduct) => {
        setEditingProduct(product);
        setFormErrors({});
        const existingCode = product.product_code || generateItemCode(product.category_code || 'Health & Wellness', products, product.product_type_id);
        setFormData({
            name: product.name,
            category_code: product.category_code || 'Health & Wellness',
            product_code: existingCode,
            suggested_srp: product.suggested_srp.toString(),
            description: product.description || '',
            shelf_life: product.shelf_life || '',
            storage_conditions: product.storage_conditions || '',
            lead_time_days: product.lead_time_days ? product.lead_time_days.toString() : '',
            formulation_notes: product.formulation_notes || '',
            net_weight: product.net_weight || '',
            packaging_specification: product.packaging_specification || '',
            label_specification: product.label_specification || '',
            min_quantity: product.min_quantity ? product.min_quantity.toString() : '',
            moq_notes: product.moq_notes || '',
            packaging_ids: product.packaging_ids || [],
            customization_ids: product.customization_ids || [],
            image_url: product.image_url || '',
            is_active: product.is_active,
        });
        setSelectedImageFile(null);
        setImagePreview(product.image_url || null);
        const mapRecipeRows = (list?: BomItem[]) =>
            (list || []).map((r) => ({
                recipe_id: r.recipe_id,
                product_id: r.product_id,
                raw_material_name: r.raw_material_name,
                raw_material_sku: r.raw_material_sku,
                unit_of_measure: r.unit_of_measure ?? 'kg',
                product_image: r.product_image,
                quantity_per_unit: r.quantity_per_unit,
                rate: r.rate,
                amount: Number(r.amount) || 0,
                notes: r.notes ?? '',
            }));
        setMainBomRows(mapRecipeRows(product.recipes));
        setGoldBomRows(mapRecipeRows(product.gold_recipes));
        setEliteBomRows(mapRecipeRows(product.elite_recipes));
        const starterTier = product.package_tiers?.find((t) => t.slug === 'starter');
        const goldTier = product.package_tiers?.find((t) => t.slug === 'gold');
        const eliteTier = product.package_tiers?.find((t) => t.slug === 'elite');
        setPackageMoqs({
            starter: String(starterTier?.minimum_quantity ?? 100),
            gold: String(goldTier?.minimum_quantity ?? 5000),
            elite: String(eliteTier?.minimum_quantity ?? 10000),
        });
        setModalTab('general');
        setIsFormOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isProductFormValid) return;
        setFormErrors({});
        setSubmitting(true);

        const data = new FormData();
        data.append('name', formData.name);
        data.append('category_code', formData.category_code);
        data.append('product_code', formData.product_code);
        data.append('suggested_srp', formData.suggested_srp);
        data.append('description', formData.description);
        if (formData.shelf_life) data.append('shelf_life', formData.shelf_life);
        if (formData.storage_conditions) data.append('storage_conditions', formData.storage_conditions);
        if (formData.lead_time_days) data.append('lead_time_days', formData.lead_time_days);
        data.append('formulation_notes', formData.formulation_notes);
        data.append('net_weight', formData.net_weight);
        data.append('packaging_specification', formData.packaging_specification);
        data.append('label_specification', formData.label_specification);
        if (formData.min_quantity) data.append('min_quantity', formData.min_quantity);
        if (formData.moq_notes) data.append('moq_notes', formData.moq_notes);
        data.append('packaging_ids', JSON.stringify(formData.packaging_ids));
        data.append('customization_ids', JSON.stringify(formData.customization_ids));
        data.append('is_active', formData.is_active ? '1' : '0');

        if (selectedImageFile) {
            data.append('image', selectedImageFile);
        } else if (formData.image_url) {
            data.append('image_url', formData.image_url);
        }

        if (editingProduct) {
            data.append('_method', 'PUT');
            router.post(`/product-controller/products/${editingProduct.product_type_id}`, data, {
                onSuccess: () => {
                    setIsFormOpen(false);
                    setSubmitting(false);
                },
                onError: (errs) => {
                    setFormErrors(errs);
                    setSubmitting(false);
                },
            });
        } else {
            router.post('/product-controller/products', data, {
                onSuccess: () => {
                    setIsFormOpen(false);
                    setSubmitting(false);
                },
                onError: (errs) => {
                    setFormErrors(errs);
                    setSubmitting(false);
                },
            });
        }
    };

    const confirmDelete = (product: CatalogProduct) => {
        setProductToDelete(product);
        setIsDeleteOpen(true);
    };

    const handleDelete = () => {
        if (!productToDelete) return;
        setDeleting(true);
        router.delete(`/product-controller/products/${productToDelete.product_type_id}`, {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setProductToDelete(null);
                setDeleting(false);
            },
            onError: () => setDeleting(false),
        });
    };

    const toggleProductStatus = (product: CatalogProduct) => {
        router.patch(`/product-controller/products/${product.product_type_id}/toggle-status`, {}, {
            preserveScroll: true,
        });
    };

    // ── Global Main BOM + Package BOM/MOQ Handlers (no +6/+8 cap here) ──
    const getBomTarget = (scope: 'main' | 'gold' | 'elite') => {
        if (scope === 'gold') return { rows: goldBomRows, setter: setGoldBomRows };
        if (scope === 'elite') return { rows: eliteBomRows, setter: setEliteBomRows };
        return { rows: mainBomRows, setter: setMainBomRows };
    };

    const handleAddBomRow = (scope: 'main' | 'gold' | 'elite') => {
        const { rows, setter } = getBomTarget(scope);
        const usedIds = new Set(rows.map((r) => r.product_id));
        const available = rawMaterials.find((m) => !usedIds.has(m.product_id)) || rawMaterials[0];
        if (!available) return;

        setter((prev) => [
            ...prev,
            {
                product_id: available.product_id,
                raw_material_name: available.name,
                raw_material_sku: available.sku,
                unit_of_measure: available.unit_of_measure,
                product_image: available.product_image,
                quantity_per_unit: '',
                rate: available.rate,
                amount: 0,
            },
        ]);
    };

    const handleUpdateBomRow = (scope: 'main' | 'gold' | 'elite', index: number, field: string, value: any) => {
        const { setter } = getBomTarget(scope);
        setter((prev) => {
            const updated = [...prev];
            const row = { ...updated[index] };

            if (field === 'product_id') {
                const selectedMat = rawMaterials.find((m) => m.product_id === Number(value));
                if (selectedMat) {
                    row.product_id = selectedMat.product_id;
                    row.raw_material_name = selectedMat.name;
                    row.raw_material_sku = selectedMat.sku;
                    row.unit_of_measure = selectedMat.unit_of_measure;
                    row.product_image = selectedMat.product_image;
                    row.rate = selectedMat.rate;
                }
            } else if (field === 'quantity_per_unit') {
                row.quantity_per_unit = value;
            } else if (field === 'rate') {
                row.rate = value;
            }

            const qty = parseFloat(String(row.quantity_per_unit)) || 0;
            const rate = parseFloat(String(row.rate)) || 0;
            row.amount = Math.round(qty * rate * 100) / 100;

            updated[index] = row;
            return updated;
        });
    };

    const handleRemoveBomRow = (scope: 'main' | 'gold' | 'elite', index: number) => {
        const { setter } = getBomTarget(scope);
        setter((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSavePackageOrBom = (scope: 'main' | 'starter' | 'gold' | 'elite') => {
        if (!editingProduct) return;

        const payload: Record<string, any> = {};
        if (scope !== 'main') {
            payload.package_slug = scope;
            const parsedMoq = parseInt(packageMoqs[scope], 10);
            if (!Number.isNaN(parsedMoq) && parsedMoq >= 1) {
                payload.minimum_quantity = parsedMoq;
            }
        }
        if (scope !== 'starter') {
            const { rows } = getBomTarget(scope);
            payload.items = rows
                .filter((r) => r.product_id && parseFloat(String(r.quantity_per_unit)) > 0)
                .map((r) => ({
                    product_id: r.product_id,
                    quantity_per_unit: parseFloat(String(r.quantity_per_unit)),
                    rate: parseFloat(String(r.rate)) || 0,
                    notes: r.notes || null,
                }));
        }

        setSavingBom(true);
        router.post(`/product-controller/products/${editingProduct.product_type_id}/bom`, payload, {
            preserveScroll: true,
            onSuccess: () => setSavingBom(false),
            onError: () => setSavingBom(false),
        });
    };

    // ── Quick Add Handlers ─────────────────────────────────────────────
    const submitQuickPackaging = (e: React.FormEvent) => {
        e.preventDefault();
        setSavingQuickPkg(true);
        router.post('/product-controller/packaging', quickPkgForm, {
            preserveScroll: true,
            onSuccess: () => {
                setShowQuickPkg(false);
                setSavingQuickPkg(false);
                setQuickPkgForm({ name: '', category: 'Pouch', description: '', is_available: true });
            },
            onError: () => setSavingQuickPkg(false),
        });
    };

    const submitQuickCustomization = (e: React.FormEvent) => {
        e.preventDefault();
        setSavingQuickCust(true);
        router.post('/product-controller/customization', quickCustForm, {
            preserveScroll: true,
            onSuccess: () => {
                setShowQuickCust(false);
                setSavingQuickCust(false);
                setQuickCustForm({ name: '', customization_type: 'label', description: '', is_available: true });
            },
            onError: () => setSavingQuickCust(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Product Management - Product Controller" />

            <div className="bmanny-page">
                {/* Header Banner */}
                <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="border-l-4 border-amber-400 pl-3.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Product Controller Workspace</p>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">PRODUCT MANAGEMENT</h1>
                        <p className="text-xs text-muted-foreground sm:text-sm">Manage finished goods catalog, formulation recipes (BOM), packaging options, and minimum order quantities</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Button
                            id="add-product-btn"
                            onClick={openCreateModal}
                            className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                        >
                            <Plus className="mr-1.5 h-4 w-4" />
                            Add Product
                        </Button>
                    </div>
                </header>

                {/* Metric Summary Cards */}
                <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[
                        {
                            label: 'Total Products',
                            value: products.length,
                            description: 'All catalog items',
                            icon: Package,
                        },
                        {
                            label: 'Active Catalog',
                            value: products.filter((p) => p.is_active).length,
                            description: 'Available for quotation',
                            icon: CheckCircle2,
                        },
                        {
                            label: 'Formulated (BOM)',
                            value: products.filter((p) => (p.materials_count ?? p.recipes?.length ?? 0) > 0).length,
                            description: 'Recipe formulas defined',
                            icon: FlaskConical,
                        },
                        {
                            label: 'Inactive',
                            value: products.filter((p) => !p.is_active).length,
                            description: 'Hidden or archived',
                            icon: AlertCircle,
                        },
                    ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-border/70 bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                                <item.icon className="h-5 w-5 text-muted-foreground/70" />
                            </div>
                            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{item.value}</p>
                            <p className="mt-4 text-xs text-muted-foreground">{item.description}</p>
                        </div>
                    ))}
                </div>

                {/* Filter & Search Bar */}
                <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border/70 bg-card px-5 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-foreground">
                        {filteredProducts.length}/{products.length} Products
                    </p>
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, code (FP-...), description"
                                className="h-9 w-full rounded-lg border border-input/80 bg-muted/20 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-72"
                            />
                        </div>
                        <div className="relative">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="h-9 w-full appearance-none rounded-lg border border-input/80 bg-muted/20 px-3 pr-8 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-auto"
                            >
                                <option value="all">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        </div>
                        <div className="relative">
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="h-9 w-full appearance-none rounded-lg border border-input/80 bg-muted/20 px-3 pr-8 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-auto"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>
                </div>

                {/* Floating card rows table */}
                {filteredProducts.length === 0 ? (
                    <div className="rounded-xl border border-border/70 bg-card py-16 text-center text-muted-foreground shadow-sm">
                        <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                        <h2 className="text-base font-semibold text-foreground">No products found</h2>
                        <p className="mt-1 text-xs">
                            {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                                ? 'Try adjusting your search terms or filters.'
                                : 'Get started by creating your first finished product.'}
                        </p>
                    </div>
                ) : (
                    <div className="w-full overflow-x-auto">
                        <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
                            <thead>
                                <tr>
                                    <th className="px-3 py-2 text-[11px] font-bold text-foreground uppercase tracking-wider whitespace-nowrap">Product &amp; Code</th>
                                    <th className="px-3 py-2 text-[11px] font-bold text-foreground uppercase tracking-wider whitespace-nowrap">Category</th>
                                    <th className="px-3 py-2 text-[11px] font-bold text-foreground uppercase tracking-wider whitespace-nowrap">Formulation (BOM)</th>
                                    <th className="px-3 py-2 text-[11px] font-bold text-foreground uppercase tracking-wider whitespace-nowrap">Suggested SRP</th>
                                    <th className="px-3 py-2 text-[11px] font-bold text-foreground uppercase tracking-wider whitespace-nowrap">MOQ</th>
                                    <th className="px-3 py-2 text-[11px] font-bold text-foreground uppercase tracking-wider whitespace-nowrap">Status</th>
                                    <th className="px-3 py-2 text-right text-[11px] font-bold text-foreground uppercase tracking-wider whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((product) => {
                                    const code = product.product_code || `FP-${String(product.product_type_id).padStart(4, '0')}`;
                                    const recipeCount = product.materials_count ?? product.recipes?.length ?? 0;
                                    const recipeCost = product.total_recipe_cost ?? 0;

                                    return (
                                        <tr
                                            key={product.product_type_id}
                                            className="group bg-card shadow-sm transition-shadow hover:shadow-md"
                                        >
                                            {/* Product & Code */}
                                            <td className="rounded-l-xl border-y border-l border-border/70 py-3 px-3 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-11 rounded-lg bg-muted border border-border flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                        {product.image_url ? (
                                                            <img
                                                                src={product.image_url}
                                                                alt={product.name}
                                                                className="size-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <Package className="size-5 text-muted-foreground stroke-[1.5]" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 max-w-[230px]">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="text-sm font-bold text-foreground truncate">
                                                                {product.name}
                                                            </p>
                                                            <span className="font-mono text-[11px] font-bold text-foreground bg-muted/80 border border-border/80 px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">
                                                                {code}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                            {product.description || `${product.category_code} composite finished good`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td className="border-y border-border/70 py-3 px-3 align-middle whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getCategoryBadgeClass(
                                                        product.category_code
                                                    )}`}
                                                >
                                                    {product.category_code}
                                                </span>
                                            </td>

                                            {/* Formulation (BOM) */}
                                            <td className="border-y border-border/70 py-3 px-3 align-middle whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        openEditModal(product);
                                                        setModalTab('gold');
                                                    }}
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer whitespace-nowrap"
                                                >
                                                    <Layers className="size-3.5 shrink-0" />
                                                    <span>
                                                        {recipeCount > 0 ? (
                                                            `₱${recipeCost.toFixed(2)} / unit (${recipeCount})`
                                                        ) : (
                                                            '+ Set BOM Recipe'
                                                        )}
                                                    </span>
                                                </button>
                                            </td>

                                            {/* Suggested SRP */}
                                            <td className="border-y border-border/70 py-3 px-3 align-middle whitespace-nowrap">
                                                <span className="text-sm font-bold text-foreground whitespace-nowrap">
                                                    {product.formatted_price}
                                                </span>
                                            </td>

                                            {/* MOQ */}
                                            <td className="border-y border-border/70 py-3 px-3 align-middle whitespace-nowrap">
                                                {(() => {
                                                    const starterTier = product.package_tiers?.find((t) => t.slug === 'starter');
                                                    if (starterTier && starterTier.max_quantity) {
                                                        return (
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-foreground bg-muted/80 px-2 py-0.5 rounded-md border border-border/80 whitespace-nowrap w-fit">
                                                                    {starterTier.minimum_quantity}–{starterTier.max_quantity} pcs
                                                                </span>
                                                                <span className="text-[10px] text-muted-foreground">Starter selectable</span>
                                                            </div>
                                                        );
                                                    }
                                                    if (product.min_quantity) {
                                                        return (
                                                            <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-foreground bg-muted/80 px-2 py-0.5 rounded-md border border-border/80 whitespace-nowrap">
                                                                {product.min_quantity} pcs
                                                            </span>
                                                        );
                                                    }
                                                    return (
                                                        <span className="text-xs text-muted-foreground italic whitespace-nowrap">
                                                            Not set
                                                        </span>
                                                    );
                                                })()}
                                            </td>

                                            {/* Status */}
                                            <td className="border-y border-border/70 py-3 px-3 align-middle whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleProductStatus(product)}
                                                    title="Click to toggle status"
                                                    className="transition-opacity hover:opacity-80 cursor-pointer whitespace-nowrap"
                                                >
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${product.is_active
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300'
                                                            }`}
                                                    >
                                                        {product.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td className="rounded-r-xl border-y border-r border-border/70 py-3 px-3 align-middle text-right whitespace-nowrap">
                                                <div className="inline-flex flex-col items-end gap-1.5">
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => openEditModal(product)}
                                                        title="Edit Product & Package BOMs"
                                                        className="h-7 w-[82px] justify-start gap-1.5 rounded-md bg-muted/60 px-2 text-xs font-semibold hover:bg-muted text-foreground whitespace-nowrap shrink-0"
                                                    >
                                                        <Pencil className="size-3.5 text-muted-foreground shrink-0" />
                                                        <span>Edit</span>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => confirmDelete(product)}
                                                        title="Delete Product"
                                                        className="h-7 w-[82px] justify-start gap-1.5 rounded-md bg-muted/60 px-2 text-xs font-semibold hover:bg-muted text-destructive hover:text-destructive whitespace-nowrap shrink-0"
                                                    >
                                                        <Trash2 className="size-3.5 text-destructive shrink-0" />
                                                        <span>Delete</span>
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

            {/* ════════════════════════════════════════════════════════════════
                MODAL: ADD / EDIT FINISHED PRODUCT
                (Tabs: General Info | Starter Package | Gold Package | Elite Package)
               ════════════════════════════════════════════════════════════════ */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col justify-between overflow-hidden rounded-2xl border-border/70 p-0 shadow-2xl bg-card text-card-foreground">
                    <div className="p-7 pb-4 flex-1 overflow-y-auto">
                        <DialogHeader className="space-y-1.5 text-left">
                            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                                {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add Product'}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">
                                {editingProduct
                                    ? 'Update product catalog details and Starter / Gold / Elite package MOQs & BOMs.'
                                    : 'Create a finished product in the catalog.'}
                            </DialogDescription>
                        </DialogHeader>

                        {editingProduct ? (
                            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-muted/40 border border-border/70 rounded-xl mt-5 mb-5">
                                <button
                                    type="button"
                                    onClick={() => setModalTab('general')}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${modalTab === 'general'
                                        ? 'bg-card text-foreground shadow-xs border border-border/80'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                                        }`}
                                >
                                    <Package className="size-3.5" />
                                    <span>General Info</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModalTab('starter')}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${modalTab === 'starter'
                                        ? 'bg-card text-foreground shadow-xs border border-border/80'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                                        }`}
                                >
                                    <Box className="size-3.5" />
                                    <span>Starter</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModalTab('gold')}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${modalTab === 'gold'
                                        ? 'bg-card text-foreground shadow-xs border border-border/80'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                                        }`}
                                >
                                    <FlaskConical className="size-3.5 text-amber-500" />
                                    <span>Gold</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModalTab('elite')}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${modalTab === 'elite'
                                        ? 'bg-card text-foreground shadow-xs border border-border/80'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                                        }`}
                                >
                                    <Sparkles className="size-3.5 text-blue-500" />
                                    <span>Elite</span>
                                </button>
                            </div>
                        ) : (
                            <div className="mt-5" />
                        )}

                        <form id="product-modal-form" onSubmit={handleFormSubmit} className="space-y-4 py-1">
                            {Object.keys(formErrors).length > 0 && (
                                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                                    {Object.values(formErrors).join(' ')}
                                </div>
                            )}
                            {/* ── TAB 1: General Info ── */}
                            {modalTab === 'general' && (
                                <div className="space-y-4 animate-in fade-in-50 duration-150">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="prod-name" className="text-xs font-semibold text-foreground">
                                                    Product Name <span className="text-destructive">*</span>
                                                </Label>
                                                {formData.name.length > 0 && (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground">
                                                        {isProdNameAccepted ? <Check className="size-3 text-emerald-600" /> : <X className="size-3 text-rose-500" />}
                                                        {isProdNameAccepted ? 'Accepted' : 'Min 2 chars'}
                                                    </span>
                                                )}
                                            </div>
                                            <Input
                                                id="prod-name"
                                                maxLength={150}
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="e.g. AshigoPlus Coffee Drink Mix"
                                                required
                                                className="h-10 rounded-lg border border-input/80 bg-background text-sm text-foreground shadow-xs focus:ring-1 focus:ring-primary"
                                            />
                                        </div>

                                        {/* Category comes FIRST */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="prod-cat" className="text-xs font-semibold text-foreground">
                                                    Category <span className="text-destructive">*</span>
                                                </Label>
                                            </div>
                                            <select
                                                id="prod-cat"
                                                value={formData.category_code}
                                                onChange={handleCategoryChange}
                                                className="h-10 w-full rounded-lg border border-input/80 bg-background px-3 text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                            >
                                                {categories.map((c) => (
                                                    <option key={c} value={c}>
                                                        {c}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Item Code comes SECOND */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="prod-code" className="text-xs font-semibold text-foreground">
                                                Item Code
                                            </Label>
                                            <div
                                                id="prod-code"
                                                className="flex h-10 w-full items-center rounded-lg border border-input/80 bg-muted/40 px-3 font-mono text-xs font-semibold text-foreground shadow-xs"
                                            >
                                                {formData.product_code || 'Auto-generated based on category'}
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">Auto-generated based on selected category.</p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="prod-srp" className="text-xs font-semibold text-foreground">
                                                    Suggested SRP (₱) <span className="text-destructive">*</span>
                                                </Label>
                                                {formData.suggested_srp !== '' && (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground">
                                                        {isProdSrpAccepted ? <Check className="size-3 text-emerald-600" /> : <X className="size-3 text-rose-500" />}
                                                        {isProdSrpAccepted ? 'Accepted' : '≥ ₱0.00'}
                                                    </span>
                                                )}
                                            </div>
                                            <Input
                                                id="prod-srp"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.suggested_srp}
                                                onChange={(e) => setFormData({ ...formData, suggested_srp: e.target.value })}
                                                placeholder="450.00"
                                                required
                                                className="h-10 rounded-lg border border-input/80 bg-background text-sm text-foreground shadow-xs focus:ring-1 focus:ring-primary"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-foreground">Product Image</Label>
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="h-10 rounded-lg border border-input/80 bg-background text-xs text-foreground file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary/10 file:text-primary shadow-xs"
                                            />
                                        </div>

                                        {imagePreview && (
                                            <div className="sm:col-span-2 flex items-center gap-3 p-3 border border-border/70 rounded-xl bg-muted/20">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="size-12 object-cover rounded-lg border border-border shadow-xs"
                                                />
                                                <span className="text-xs font-medium text-muted-foreground">Image selected for catalog</span>
                                            </div>
                                        )}

                                        <div className="space-y-1.5 sm:col-span-2">
                                            <Label htmlFor="prod-desc" className="text-xs font-semibold text-foreground">
                                                Catalog Description
                                            </Label>
                                            <Input
                                                id="prod-desc"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Nutritional composite herbal coffee drink mix..."
                                                className="h-10 rounded-lg border border-input/80 bg-background text-sm text-foreground shadow-xs focus:ring-1 focus:ring-primary"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 2: Packaging Management ── */}
                            {modalTab === 'packaging' && (
                                <div className="space-y-4 animate-in fade-in-50 duration-150">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                                                Allowed Packaging &amp; Containers
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                Select which packaging options are approved for this product.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setShowQuickPkg(true)}
                                                className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                                            >
                                                <Plus className="size-3" />
                                                <span>New Packaging Type</span>
                                            </Button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData({
                                                        ...formData,
                                                        packaging_ids: packagingOptions.map((p) => p.packaging_id),
                                                    })
                                                }
                                                className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                                            >
                                                Select all
                                            </button>
                                            <span className="text-border">|</span>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, packaging_ids: [] })}
                                                className="text-[11px] font-semibold text-muted-foreground hover:underline cursor-pointer"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2.5 rounded-lg border border-border bg-muted/30">
                                        {packagingOptions.length === 0 ? (
                                            <div className="col-span-2 py-6 text-center text-muted-foreground">
                                                <p className="text-xs">No packaging options available yet.</p>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setShowQuickPkg(true)}
                                                    className="mt-2 text-xs"
                                                >
                                                    <Plus className="size-3 mr-1" />
                                                    Create First Packaging Type
                                                </Button>
                                            </div>
                                        ) : (
                                            packagingOptions.map((opt) => {
                                                const isChecked = formData.packaging_ids.includes(opt.packaging_id);
                                                return (
                                                    <label
                                                        key={opt.packaging_id}
                                                        className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${isChecked
                                                            ? 'bg-card border-primary text-foreground ring-1 ring-primary/30 font-medium'
                                                            : 'bg-card/60 border-border text-muted-foreground hover:bg-card'
                                                            }`}
                                                    >
                                                        <Checkbox
                                                            checked={isChecked}
                                                            onCheckedChange={() => {
                                                                const next = isChecked
                                                                    ? formData.packaging_ids.filter((id) => id !== opt.packaging_id)
                                                                    : [...formData.packaging_ids, opt.packaging_id];
                                                                setFormData({ ...formData, packaging_ids: next });
                                                            }}
                                                            className="mt-0.5"
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="leading-tight truncate text-foreground">{opt.name}</p>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className="text-[10px] text-muted-foreground bg-muted px-1 py-0.2 rounded border border-border">
                                                                    {opt.category}
                                                                </span>
                                                                {!opt.is_available && (
                                                                    <span className="text-[10px] text-destructive font-medium">(Unavailable)</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="prod-pkg-spec" className="text-xs font-semibold text-foreground">
                                            Packaging Specification &amp; Dimensions
                                        </Label>
                                        <textarea
                                            id="prod-pkg-spec"
                                            rows={3}
                                            value={formData.packaging_specification}
                                            onChange={(e) => setFormData({ ...formData, packaging_specification: e.target.value })}
                                            placeholder="e.g. Stand-up pouch, 12 × 20 cm with zip lock and tear notch; 24 pouches per master carton"
                                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 3: Customization Options ── */}
                            {modalTab === 'customization' && (
                                <div className="space-y-4 animate-in fade-in-50 duration-150">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                                                Allowed Customization &amp; Rebranding
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                Select which customization techniques can be offered for this product.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setShowQuickCust(true)}
                                                className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                                            >
                                                <Plus className="size-3" />
                                                <span>New Customization Type</span>
                                            </Button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData({
                                                        ...formData,
                                                        customization_ids: customizationOptions.map((c) => c.customization_id),
                                                    })
                                                }
                                                className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                                            >
                                                Select all
                                            </button>
                                            <span className="text-border">|</span>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, customization_ids: [] })}
                                                className="text-[11px] font-semibold text-muted-foreground hover:underline cursor-pointer"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2.5 rounded-lg border border-border bg-muted/30">
                                        {customizationOptions.length === 0 ? (
                                            <div className="col-span-2 py-6 text-center text-muted-foreground">
                                                <p className="text-xs">No customization options configured yet.</p>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setShowQuickCust(true)}
                                                    className="mt-2 text-xs"
                                                >
                                                    <Plus className="size-3 mr-1" />
                                                    Create First Option
                                                </Button>
                                            </div>
                                        ) : (
                                            customizationOptions.map((opt) => {
                                                const isChecked = formData.customization_ids.includes(opt.customization_id);
                                                return (
                                                    <label
                                                        key={opt.customization_id}
                                                        className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${isChecked
                                                            ? 'bg-card border-primary text-foreground ring-1 ring-primary/30 font-medium'
                                                            : 'bg-card/60 border-border text-muted-foreground hover:bg-card'
                                                            }`}
                                                    >
                                                        <Checkbox
                                                            checked={isChecked}
                                                            onCheckedChange={() => {
                                                                const next = isChecked
                                                                    ? formData.customization_ids.filter((id) => id !== opt.customization_id)
                                                                    : [...formData.customization_ids, opt.customization_id];
                                                                setFormData({ ...formData, customization_ids: next });
                                                            }}
                                                            className="mt-0.5"
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="leading-tight truncate text-foreground">{opt.name}</p>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                {opt.customization_type && (
                                                                    <span className="text-[10px] text-muted-foreground bg-muted px-1 py-0.2 rounded border border-border capitalize">
                                                                        {opt.customization_type}
                                                                    </span>
                                                                )}
                                                                {!opt.is_available && (
                                                                    <span className="text-[10px] text-destructive font-medium">(Unavailable)</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="prod-label-spec" className="text-xs font-semibold text-foreground">
                                            Label &amp; Printing Specification
                                        </Label>
                                        <textarea
                                            id="prod-label-spec"
                                            rows={3}
                                            value={formData.label_specification}
                                            onChange={(e) => setFormData({ ...formData, label_specification: e.target.value })}
                                            placeholder="e.g. Full-color vinyl sticker label (8x14 cm); client artwork vector file supplied by Sales Agent"
                                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 4: MOQ & Commercial Specs ── */}
                            {modalTab === 'moq' && (
                                <div className="space-y-4 animate-in fade-in-50 duration-150">
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                                            Minimum Order Quantity (MOQ) &amp; Commercial Specifications
                                        </h4>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Enforce production batch minimums, turnaround lead times, and content specifications.
                                        </p>
                                    </div>

                                    {editingProduct?.package_tiers && editingProduct.package_tiers.length > 0 && (
                                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2.5">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                                                Active Package MOQ Tiers
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                                {editingProduct.package_tiers.map((tier) => (
                                                    <div key={tier.slug} className="rounded-lg border border-border/70 bg-card p-2.5">
                                                        <p className="text-xs font-bold text-foreground">{tier.name}</p>
                                                        <p className="mt-0.5 font-mono text-xs font-semibold text-primary">
                                                            {tier.max_quantity
                                                                ? `${tier.minimum_quantity.toLocaleString()} – ${tier.max_quantity.toLocaleString()} pouches`
                                                                : `${tier.minimum_quantity.toLocaleString()} pouches`}
                                                        </p>
                                                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                            {tier.max_quantity
                                                                ? 'Selectable MOQ (Min 100 · Max 500)'
                                                                : tier.slug === 'gold'
                                                                    ? 'Stored MOQ · 150 pouches/batch'
                                                                    : tier.slug === 'elite'
                                                                        ? 'Stored MOQ · 350 pouches/batch'
                                                                        : tier.label_details}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="prod-moq" className="text-xs font-semibold text-foreground">
                                                Minimum Order Quantity (MOQ in units / pcs)
                                            </Label>
                                            <Input
                                                id="prod-moq"
                                                type="number"
                                                min="1"
                                                value={formData.min_quantity}
                                                onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                                                placeholder="e.g. 50"
                                                className="rounded-lg text-xs bg-background border-input text-foreground font-mono"
                                            />
                                            <p className="text-[10px] text-muted-foreground">Sets the active MOQ rule for this product.</p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="prod-lead-time" className="text-xs font-semibold text-foreground">
                                                Production Lead Time (Days)
                                            </Label>
                                            <Input
                                                id="prod-lead-time"
                                                type="number"
                                                min="1"
                                                max="365"
                                                value={formData.lead_time_days}
                                                onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
                                                placeholder="e.g. 14"
                                                className="rounded-lg text-xs bg-background border-input text-foreground"
                                            />
                                            <p className="text-[10px] text-muted-foreground">Standard factory turnaround time.</p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="prod-net-weight" className="text-xs font-semibold text-foreground">
                                                Net Weight / Content Per Unit
                                            </Label>
                                            <Input
                                                id="prod-net-weight"
                                                value={formData.net_weight}
                                                onChange={(e) => setFormData({ ...formData, net_weight: e.target.value })}
                                                placeholder="e.g. 120g or 30 capsules"
                                                className="rounded-lg text-xs bg-background border-input text-foreground"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="prod-moq-notes" className="text-xs font-semibold text-foreground">
                                                MOQ Policy Notes
                                            </Label>
                                            <Input
                                                id="prod-moq-notes"
                                                value={formData.moq_notes}
                                                onChange={(e) => setFormData({ ...formData, moq_notes: e.target.value })}
                                                placeholder="e.g. Standard production run minimum"
                                                className="rounded-lg text-xs bg-background border-input text-foreground"
                                            />
                                        </div>

                                        <div className="space-y-1.5 sm:col-span-2">
                                            <Label htmlFor="prod-notes" className="text-xs font-semibold text-foreground">
                                                Formulation &amp; Ingredients Notes
                                            </Label>
                                            <textarea
                                                id="prod-notes"
                                                rows={3}
                                                value={formData.formulation_notes}
                                                onChange={(e) => setFormData({ ...formData, formulation_notes: e.target.value })}
                                                placeholder="e.g. Corn coffee with malunggay and mangosteen extracts..."
                                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 2: Global Main BOM (Unlimited Master Formula) ── */}
                            {modalTab === 'bom' && editingProduct && (() => {
                                const totalMainBomCost = mainBomRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
                                return (
                                    <div className="space-y-4 animate-in fade-in-50 duration-150">
                                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/70 bg-muted/20 p-4">
                                            <div className="flex items-center gap-3.5">
                                                <div className="size-14 rounded-lg bg-card border border-border/80 p-1 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                                                    {editingProduct.image_url ? (
                                                        <img
                                                            src={editingProduct.image_url}
                                                            alt={editingProduct.name}
                                                            className="size-full object-cover rounded"
                                                        />
                                                    ) : (
                                                        <Package className="size-7 text-muted-foreground stroke-[1.5]" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-foreground text-base leading-tight">
                                                        {editingProduct.name}
                                                    </h4>
                                                    <p className="font-mono text-xs font-semibold text-primary mt-0.5">
                                                        {editingProduct.product_code || `FP-${String(editingProduct.product_type_id).padStart(4, '0')}`}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        Global Master Bill of Materials (applies to all Starter, Gold, and Elite orders)
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground font-medium">Calculated Formulation Cost</p>
                                                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                                    ₱{totalMainBomCost.toFixed(2)}
                                                    <span className="text-xs font-normal text-muted-foreground ml-1">/ unit</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto rounded-xl border border-border/70 bg-card">
                                            <table className="w-full text-left text-xs border-collapse">
                                                <thead>
                                                    <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[11px] font-semibold bg-muted/40">
                                                        <th className="py-3 px-3 w-10 text-center">#</th>
                                                        <th className="py-3 px-3 w-[45%]">Item (Raw Material)</th>
                                                        <th className="py-3 px-3 w-[22%]">
                                                            <span className="inline-flex items-center gap-1">
                                                                Quantity (per unit)
                                                                <Info className="size-3 text-muted-foreground" />
                                                            </span>
                                                        </th>
                                                        <th className="py-3 px-3 w-[15%]">Rate (₱)</th>
                                                        <th className="py-3 px-3 w-[15%]">Amount (₱)</th>
                                                        <th className="py-3 px-3 w-10 text-center"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/60">
                                                    {mainBomRows.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={6} className="text-center py-8 text-muted-foreground">
                                                                No raw materials in the global recipe yet. Click &ldquo;Add Raw Material&rdquo; below.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        mainBomRows.map((row, idx) => (
                                                            <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                                                <td className="py-2.5 px-3 text-center text-muted-foreground font-mono text-xs">
                                                                    {idx + 1}
                                                                </td>
                                                                <td className="py-2.5 px-3">
                                                                    <RawMaterialCombobox
                                                                        value={row.product_id}
                                                                        options={rawMaterials}
                                                                        onChange={(newId) => handleUpdateBomRow('main', idx, 'product_id', newId)}
                                                                    />
                                                                </td>
                                                                <td className="py-2.5 px-3">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Input
                                                                            type="number"
                                                                            step="0.0001"
                                                                            min="0"
                                                                            value={row.quantity_per_unit}
                                                                            onChange={(e) => handleUpdateBomRow('main', idx, 'quantity_per_unit', e.target.value)}
                                                                            placeholder="0.00"
                                                                            className="h-9 text-xs font-mono bg-background border-input/80 text-foreground shadow-xs"
                                                                        />
                                                                        <span className="text-muted-foreground font-medium text-xs whitespace-nowrap">
                                                                            {row.unit_of_measure}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-2.5 px-3">
                                                                    <span className="text-xs font-mono text-muted-foreground">
                                                                        ₱{Number(row.rate).toFixed(2)}
                                                                    </span>
                                                                </td>
                                                                <td className="py-2.5 px-3">
                                                                    <span className="text-xs font-mono font-bold text-foreground">
                                                                        ₱{Number(row.amount).toFixed(2)}
                                                                    </span>
                                                                </td>
                                                                <td className="py-2.5 px-3 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveBomRow('main', idx)}
                                                                        className="text-muted-foreground hover:text-destructive rounded-full p-1 transition-colors"
                                                                        title="Remove material"
                                                                    >
                                                                        <X className="size-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAddBomRow('main')}
                                                className="h-9 rounded-lg border-primary/30 text-primary hover:bg-primary/10 text-xs font-semibold gap-1.5 shadow-xs"
                                            >
                                                <Plus className="size-3.5" />
                                                <span>Add Raw Material</span>
                                            </Button>
                                            <span className="text-[11px] text-muted-foreground">
                                                Per-client Gold (+6) and Elite (+8) herbal limits are enforced in Product Requests.
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* ── TAB 3: Starter Package (Adjustable MOQ, no custom BOM) ── */}
                            {modalTab === 'starter' && editingProduct && (
                                <div className="space-y-4 animate-in fade-in-50 duration-150">
                                    <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <h4 className="text-sm font-bold text-foreground">Starter Package Settings</h4>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Stand-up pouch, 12 × 20 cm · Sticker label · 120 g · Lead time: 10–15 business days
                                                </p>
                                            </div>
                                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                                Selectable MOQ (Min {packageMoqs.starter || '100'} – Max 500)
                                            </span>
                                        </div>

                                        <div className="max-w-xs space-y-1.5 pt-1">
                                            <Label htmlFor="starter-moq-input" className="text-xs font-semibold text-foreground">
                                                Starter Base MOQ (pouches)
                                            </Label>
                                            <Input
                                                id="starter-moq-input"
                                                type="number"
                                                min="1"
                                                max="500"
                                                value={packageMoqs.starter}
                                                onChange={(e) => setPackageMoqs((prev) => ({ ...prev, starter: e.target.value }))}
                                                className="h-9 font-mono text-xs bg-background"
                                            />
                                            <p className="text-[11px] text-muted-foreground">
                                                Default is 100 pouches (clients can select up to 500 pouches on mobile).
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-200">
                                        <span className="font-bold">Starter Package has no custom BOM.</span> It uses the global Main BOM untouched. Use <span className="font-bold">Gold</span> or <span className="font-bold">Elite</span> tabs to configure package-level BOMs.
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 4 & 5: Gold & Elite Packages (Adjustable MOQ + Unlimited Package BOM) ── */}
                            {(modalTab === 'gold' || modalTab === 'elite') && editingProduct && (() => {
                                const pkg = modalTab;
                                const rows = pkg === 'gold' ? goldBomRows : eliteBomRows;
                                const baseCost = mainBomRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
                                const addonCost = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
                                const totalCost = baseCost + addonCost;
                                return (
                                    <div className="space-y-4 animate-in fade-in-50 duration-150">
                                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/70 bg-muted/20 p-4">
                                            <div className="space-y-2 flex-1 min-w-[240px]">
                                                <div>
                                                    <h4 className="font-bold text-foreground text-base leading-tight">
                                                        {editingProduct.name} — {pkg === 'gold' ? 'Gold Package' : 'Elite Package'}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        Adjust package base MOQ and global {pkg === 'gold' ? 'Gold' : 'Elite'} BOM (no +6/+8 limit here; client herbal limits apply in Product Requests).
                                                    </p>
                                                </div>
                                                <div className="max-w-xs space-y-1">
                                                    <Label htmlFor={`${pkg}-moq-input`} className="text-xs font-semibold text-foreground">
                                                        {pkg === 'gold' ? 'Gold' : 'Elite'} Base MOQ (pouches)
                                                    </Label>
                                                    <Input
                                                        id={`${pkg}-moq-input`}
                                                        type="number"
                                                        min="1"
                                                        value={packageMoqs[pkg]}
                                                        onChange={(e) => setPackageMoqs((prev) => ({ ...prev, [pkg]: e.target.value }))}
                                                        className="h-9 font-mono text-xs bg-background"
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground font-medium">Calculated Formulation Cost</p>
                                                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                                    ₱{totalCost.toFixed(2)}
                                                    <span className="text-xs font-normal text-muted-foreground ml-1">/ unit</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto rounded-xl border border-border/70 bg-card">
                                            <table className="w-full text-left text-xs border-collapse">
                                                <thead>
                                                    <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[11px] font-semibold bg-muted/40">
                                                        <th className="py-3 px-3 w-10 text-center">#</th>
                                                        <th className="py-3 px-3 w-[45%]">Item (Raw Material)</th>
                                                        <th className="py-3 px-3 w-[22%]">Quantity (per unit)</th>
                                                        <th className="py-3 px-3 w-[15%]">Rate (₱)</th>
                                                        <th className="py-3 px-3 w-[15%]">Amount (₱)</th>
                                                        <th className="py-3 px-3 w-10 text-center"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/60">
                                                    {mainBomRows.map((row, bIdx) => (
                                                        <tr key={`base-${bIdx}`} className="bg-muted/15">
                                                            <td className="py-2.5 px-3 text-center text-muted-foreground font-mono text-xs">{bIdx + 1}</td>
                                                            <td className="py-2.5 px-3">
                                                                <div className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-xs text-foreground">
                                                                    <span className="truncate font-medium">
                                                                        {row.raw_material_name} {row.raw_material_sku ? `(${row.raw_material_sku})` : ''} — ₱{Number(row.rate).toFixed(2)}/{row.unit_of_measure || 'kg'}
                                                                    </span>
                                                                    <span className="shrink-0 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground border border-border/60">
                                                                        Base
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="py-2.5 px-3">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="h-9 flex-1 flex items-center rounded-md border border-border/60 bg-muted/40 px-3 font-mono text-xs text-foreground">
                                                                        {row.quantity_per_unit}
                                                                    </div>
                                                                    <span className="text-muted-foreground font-medium text-xs whitespace-nowrap">{row.unit_of_measure || 'kg'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-2.5 px-3 font-mono text-muted-foreground">₱{Number(row.rate).toFixed(2)}</td>
                                                            <td className="py-2.5 px-3 font-mono font-bold text-foreground">₱{Number(row.amount).toFixed(2)}</td>
                                                            <td className="py-2.5 px-3 text-center text-muted-foreground">—</td>
                                                        </tr>
                                                    ))}

                                                    {rows.map((row, idx) => (
                                                        <tr key={`pkg-${idx}`} className="hover:bg-muted/20 transition-colors">
                                                            <td className="py-2.5 px-3 text-center text-primary font-mono font-bold text-xs">
                                                                {mainBomRows.length + idx + 1}
                                                            </td>
                                                            <td className="py-2.5 px-3">
                                                                <RawMaterialCombobox
                                                                    value={row.product_id}
                                                                    options={rawMaterials}
                                                                    onChange={(newId) => handleUpdateBomRow(pkg, idx, 'product_id', newId)}
                                                                />
                                                            </td>
                                                            <td className="py-2.5 px-3">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Input
                                                                        type="number"
                                                                        step="0.0001"
                                                                        min="0"
                                                                        value={row.quantity_per_unit}
                                                                        onChange={(e) => handleUpdateBomRow(pkg, idx, 'quantity_per_unit', e.target.value)}
                                                                        placeholder="0.00"
                                                                        className="h-9 text-xs font-mono bg-background border-input/80 text-foreground shadow-xs"
                                                                    />
                                                                    <span className="text-muted-foreground font-medium text-xs whitespace-nowrap">{row.unit_of_measure}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-2.5 px-3 font-mono text-muted-foreground">₱{Number(row.rate).toFixed(2)}</td>
                                                            <td className="py-2.5 px-3 font-mono font-bold text-foreground">₱{Number(row.amount).toFixed(2)}</td>
                                                            <td className="py-2.5 px-3 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveBomRow(pkg, idx)}
                                                                    className="text-muted-foreground hover:text-destructive rounded-full p-1 transition-colors"
                                                                    title="Remove material"
                                                                >
                                                                    <X className="size-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAddBomRow(pkg)}
                                                className="h-9 rounded-lg border-primary/30 text-primary hover:bg-primary/10 text-xs font-semibold gap-1.5 shadow-xs"
                                            >
                                                <Plus className="size-3.5" />
                                                <span>Add Raw Material</span>
                                            </Button>
                                            <span className="text-[11px] text-muted-foreground">
                                                Unlimited global {pkg === 'gold' ? 'Gold' : 'Elite'} BOM items. Per-client herbal caps (+6 / +8) apply in Product Requests.
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}

                        </form>
                    </div>

                    <div className="flex items-center justify-end border-t border-border/60 bg-muted/20 px-7 py-4 rounded-b-2xl">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsFormOpen(false)}
                                className="h-10 rounded-lg border-border/80 bg-background px-5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
                            >
                                Cancel
                            </Button>
                            {modalTab === 'general' ? (
                                <Button
                                    type="submit"
                                    form="product-modal-form"
                                    disabled={submitting || !isProductFormValid}
                                    className="h-10 rounded-lg bg-blue-600 hover:bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : editingProduct ? 'Save All Changes' : 'Create Product'}
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    disabled={savingBom}
                                    onClick={() => handleSavePackageOrBom(modalTab === 'bom' ? 'main' : modalTab)}
                                    className="h-10 rounded-lg bg-blue-600 hover:bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
                                >
                                    {savingBom
                                        ? 'Saving...'
                                        : modalTab === 'bom'
                                            ? 'Save Main BOM'
                                            : modalTab === 'starter'
                                                ? 'Save Starter MOQ'
                                                : modalTab === 'gold'
                                                    ? 'Save Gold Settings'
                                                    : 'Save Elite Settings'}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Quick Add Packaging Modal ── */}
            <Dialog open={showQuickPkg} onOpenChange={setShowQuickPkg}>
                <DialogContent className="max-w-md rounded-xl p-5 bg-card text-card-foreground border border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-foreground">
                            Create New Packaging Type
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Add a packaging choice to the catalog.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitQuickPackaging} className="space-y-3.5 py-2">
                        <div className="space-y-1">
                            <Label htmlFor="q-pkg-name" className="text-xs">Packaging Name</Label>
                            <Input
                                id="q-pkg-name"
                                value={quickPkgForm.name}
                                onChange={(e) => setQuickPkgForm({ ...quickPkgForm, name: e.target.value })}
                                placeholder="e.g. Amber Glass Dropper 30ml"
                                required
                                className="text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="q-pkg-cat" className="text-xs">Category</Label>
                            <select
                                id="q-pkg-cat"
                                value={quickPkgForm.category}
                                onChange={(e) => setQuickPkgForm({ ...quickPkgForm, category: e.target.value })}
                                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground"
                            >
                                {PACKAGING_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="q-pkg-desc" className="text-xs">Description (Optional)</Label>
                            <Input
                                id="q-pkg-desc"
                                value={quickPkgForm.description}
                                onChange={(e) => setQuickPkgForm({ ...quickPkgForm, description: e.target.value })}
                                placeholder="Brief specification or dimensions"
                                className="text-xs"
                            />
                        </div>
                        <DialogFooter className="pt-2 gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setShowQuickPkg(false)}>Cancel</Button>
                            <Button type="submit" size="sm" disabled={savingQuickPkg}>
                                {savingQuickPkg ? 'Adding...' : 'Add to Catalog'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Quick Add Customization Modal ── */}
            <Dialog open={showQuickCust} onOpenChange={setShowQuickCust}>
                <DialogContent className="max-w-md rounded-xl p-5 bg-card text-card-foreground border border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-foreground">
                            Create New Customization Option
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Add a rebranding or finishing technique.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitQuickCustomization} className="space-y-3.5 py-2">
                        <div className="space-y-1">
                            <Label htmlFor="q-cust-name" className="text-xs">Option Name</Label>
                            <Input
                                id="q-cust-name"
                                value={quickCustForm.name}
                                onChange={(e) => setQuickCustForm({ ...quickCustForm, name: e.target.value })}
                                placeholder="e.g. Metallic Gold Foil Emboss"
                                required
                                className="text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="q-cust-type" className="text-xs">Customization Type</Label>
                            <select
                                id="q-cust-type"
                                value={quickCustForm.customization_type}
                                onChange={(e) => setQuickCustForm({ ...quickCustForm, customization_type: e.target.value })}
                                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground capitalize"
                            >
                                {CUSTOMIZATION_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="q-cust-desc" className="text-xs">Description (Optional)</Label>
                            <Input
                                id="q-cust-desc"
                                value={quickCustForm.description}
                                onChange={(e) => setQuickCustForm({ ...quickCustForm, description: e.target.value })}
                                placeholder="Details about this method"
                                className="text-xs"
                            />
                        </div>
                        <DialogFooter className="pt-2 gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setShowQuickCust(false)}>Cancel</Button>
                            <Button type="submit" size="sm" disabled={savingQuickCust}>
                                {savingQuickCust ? 'Adding...' : 'Add to Catalog'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ════════════════════════════════════════════════════════════════
                MODAL: DELETE PRODUCT CONFIRMATION
               ════════════════════════════════════════════════════════════════ */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="max-w-sm rounded-xl p-6 bg-card text-card-foreground border border-border shadow-xl">
                    <DialogHeader>
                        <div className="size-11 rounded-full bg-destructive/15 flex items-center justify-center text-destructive mb-3">
                            <AlertCircle className="size-5" />
                        </div>
                        <DialogTitle className="text-base font-bold text-foreground">
                            Delete Product
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Are you sure you want to delete{' '}
                            <span className="font-semibold text-foreground">{productToDelete?.name}</span>?
                            Its Bill of Materials recipe links will also be removed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-3 gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteOpen(false)}
                            className="rounded-lg text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={deleting}
                            variant="destructive"
                            className="rounded-lg text-xs font-semibold"
                        >
                            {deleting ? 'Deleting...' : 'Delete Product'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
