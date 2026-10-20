import { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    Plus,
    Search,
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
    total_recipe_cost?: number;
    formatted_recipe_cost?: string;
    materials_count?: number;
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
            return 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50';
        case 'supplements & wellbeing':
            return 'bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50';
        case 'detox & nutrition':
            return 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50';
        case 'beauty & personal care':
            return 'bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50';
        default:
            return 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/50';
    }
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
    const [modalTab, setModalTab] = useState<'general' | 'packaging' | 'customization' | 'moq'>('general');

    // ── Delete confirmation state ──────────────────────────────────────
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<CatalogProduct | null>(null);
    const [deleting, setDeleting] = useState(false);

    // ── Bill of Materials (BOM) Modal state ────────────────────────────
    const [isBomOpen, setIsBomOpen] = useState(false);
    const [bomProduct, setBomProduct] = useState<CatalogProduct | null>(null);
    const [bomRows, setBomRows] = useState<BomItem[]>([]);
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

    const openCreateModal = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            category_code: categories.includes('Health & Wellness') ? 'Health & Wellness' : (categories[0] || ''),
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
        setModalTab('general');
        setIsFormOpen(true);
    };

    const openEditModal = (product: CatalogProduct) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            category_code: product.category_code || 'Health & Wellness',
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
        setSubmitting(true);

        const data = new FormData();
        data.append('name', formData.name);
        data.append('category_code', formData.category_code);
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
                onError: () => setSubmitting(false),
            });
        } else {
            router.post('/product-controller/products', data, {
                onSuccess: () => {
                    setIsFormOpen(false);
                    setSubmitting(false);
                },
                onError: () => setSubmitting(false),
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

    // ── Open BOM Modal (Edit Composite Item) ───────────────────────────
    const openBomModal = (product: CatalogProduct) => {
        setBomProduct(product);
        const existing = product.recipes?.map((r) => ({
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
        })) || [];

        if (existing.length === 0 && rawMaterials.length > 0) {
            const first = rawMaterials[0];
            setBomRows([
                {
                    product_id: first.product_id,
                    raw_material_name: first.name,
                    raw_material_sku: first.sku,
                    unit_of_measure: first.unit_of_measure,
                    product_image: first.product_image,
                    quantity_per_unit: '',
                    rate: first.rate,
                    amount: 0,
                },
            ]);
        } else {
            setBomRows(existing);
        }

        setIsBomOpen(true);
    };

    const handleAddBomRow = () => {
        const usedIds = new Set(bomRows.map((r) => r.product_id));
        const available = rawMaterials.find((m) => !usedIds.has(m.product_id)) || rawMaterials[0];

        if (!available) return;

        setBomRows((prev) => [
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

    const handleUpdateBomRow = (index: number, field: string, value: any) => {
        setBomRows((prev) => {
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

    const handleRemoveBomRow = (index: number) => {
        setBomRows((prev) => prev.filter((_, i) => i !== index));
    };

    const totalBomCost = useMemo(() => {
        return bomRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    }, [bomRows]);

    const handleSaveBom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!bomProduct) return;

        const validItems = bomRows
            .filter((r) => r.product_id && parseFloat(String(r.quantity_per_unit)) > 0)
            .map((r) => ({
                product_id: r.product_id,
                quantity_per_unit: parseFloat(String(r.quantity_per_unit)),
                rate: parseFloat(String(r.rate)) || 0,
                notes: r.notes || null,
            }));

        setSavingBom(true);
        router.post(
            `/product-controller/products/${bomProduct.product_type_id}/bom`,
            { items: validItems },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsBomOpen(false);
                    setSavingBom(false);
                },
                onError: () => setSavingBom(false),
            }
        );
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

            <main className="bmanny-page">
                <div className="bmanny-page-inner space-y-6">
                    {/* ── BMANNY Page Header with gold accent line ── */}
                    <section className="bmanny-page-header">
                        <p className="bmanny-page-eyebrow">Product Controller</p>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-foreground">
                                    Product Management
                                </h1>
                                <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                                    Manage finished goods catalog, formulation recipes (BOM), packaging options, customization choices, and minimum order quantities.
                                </p>
                            </div>

                            <Button
                                id="add-product-btn"
                                onClick={openCreateModal}
                                className="shrink-0 font-medium shadow-sm"
                            >
                                <Plus className="mr-1.5 size-4" />
                                Add Finished Product
                            </Button>
                        </div>
                    </section>

                    {/* ── Search & Filter Controls ── */}
                    <Card className="bmanny-workspace overflow-hidden border-border/80 shadow-xs">
                        <CardContent className="p-4 sm:p-5">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Search by product name, code (FP-...), or description..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 text-sm bg-background border-input text-foreground"
                                    />
                                </div>

                                {/* Category Filter */}
                                <div className="relative min-w-[180px]">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full appearance-none pl-3.5 pr-10 py-2 text-sm bg-background border border-input rounded-md text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-all cursor-pointer"
                                    >
                                        <option value="all">All categories</option>
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                                </div>

                                {/* Status Filter */}
                                <div className="relative min-w-[140px]">
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="w-full appearance-none pl-3.5 pr-10 py-2 text-sm bg-background border border-input rounded-md text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-all cursor-pointer"
                                    >
                                        <option value="all">All statuses</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Products Catalog Table ── */}
                    <Card className="bmanny-workspace overflow-hidden border-border/80 shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[55rem] text-left text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        <th className="py-3.5 px-5">Product &amp; Code</th>
                                        <th className="py-3.5 px-5">Category</th>
                                        <th className="py-3.5 px-5">Formulation (BOM)</th>
                                        <th className="py-3.5 px-5">Suggested SRP</th>
                                        <th className="py-3.5 px-5">MOQ</th>
                                        <th className="py-3.5 px-5">Status</th>
                                        <th className="py-3.5 px-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {filteredProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-16 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Package className="size-10 text-muted-foreground/50 stroke-[1.5]" />
                                                    <p className="text-sm font-medium text-foreground">No products found</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                                                            ? 'Try adjusting your search terms or filters.'
                                                            : 'Get started by creating your first finished product.'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredProducts.map((product) => {
                                            const code = product.product_code || `FP-${String(product.product_type_id).padStart(4, '0')}`;
                                            const recipeCount = product.materials_count ?? product.recipes?.length ?? 0;
                                            const recipeCost = product.total_recipe_cost ?? 0;

                                            return (
                                                <tr
                                                    key={product.product_type_id}
                                                    className="hover:bg-muted/40 transition-colors"
                                                >
                                                    {/* Product thumbnail & description */}
                                                    <td className="py-4 px-5">
                                                        <div className="flex items-center gap-3.5">
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
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-semibold text-foreground truncate">
                                                                        {product.name}
                                                                    </p>
                                                                    <span className="font-mono text-[11px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                                                        {code}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-sm">
                                                                    {product.description || `${product.category_code} composite finished good`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Category */}
                                                    <td className="py-4 px-5">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeClass(
                                                                product.category_code
                                                            )}`}
                                                        >
                                                            {product.category_code}
                                                        </span>
                                                    </td>

                                                    {/* Recipe / BOM Cost */}
                                                    <td className="py-4 px-5">
                                                        <div>
                                                            <button
                                                                type="button"
                                                                onClick={() => openBomModal(product)}
                                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                                                            >
                                                                <Layers className="size-3.5" />
                                                                {recipeCount > 0 ? (
                                                                    <span>₱{recipeCost.toFixed(2)} / unit ({recipeCount} materials)</span>
                                                                ) : (
                                                                    <span className="text-muted-foreground hover:text-foreground">+ Set BOM Recipe</span>
                                                                )}
                                                            </button>
                                                            <p className="text-[11px] text-muted-foreground">Bill of Materials cost</p>
                                                        </div>
                                                    </td>

                                                    {/* Base SRP */}
                                                    <td className="py-4 px-5">
                                                        <span className="text-sm font-semibold text-foreground">
                                                            {product.formatted_price}
                                                        </span>
                                                    </td>

                                                    {/* MOQ */}
                                                    <td className="py-4 px-5">
                                                        {product.min_quantity ? (
                                                            <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-foreground bg-muted/80 px-2.5 py-1 rounded-md border border-border">
                                                                {product.min_quantity} pcs
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">
                                                                Not set
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Status */}
                                                    <td className="py-4 px-5">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleProductStatus(product)}
                                                            title="Click to toggle status"
                                                            className="inline-flex items-center gap-2 text-xs font-medium transition-opacity hover:opacity-80 cursor-pointer"
                                                        >
                                                            <span
                                                                className={`size-2 rounded-full ${
                                                                    product.is_active ? 'bg-emerald-500' : 'bg-amber-500'
                                                                }`}
                                                            />
                                                            <span
                                                                className={
                                                                    product.is_active
                                                                        ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                                                                        : 'text-amber-600 dark:text-amber-400 font-medium'
                                                                }
                                                            >
                                                                {product.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </button>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-4 px-5 text-right">
                                                        <div className="inline-flex items-center justify-end gap-1.5">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => openBomModal(product)}
                                                                title="Edit BOM Recipe"
                                                                className="h-8 gap-1 text-xs border-primary/30 text-primary hover:bg-primary/10"
                                                            >
                                                                <FlaskConical className="size-3.5" />
                                                                <span>BOM</span>
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => openEditModal(product)}
                                                                title="Edit Product, Options & MOQ"
                                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                                            >
                                                                <Pencil className="size-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => confirmDelete(product)}
                                                                title="Delete Product"
                                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </main>

            {/* ════════════════════════════════════════════════════════════════
                MODAL: EDIT COMPOSITE ITEM / BILL OF MATERIALS (BOM)
               ════════════════════════════════════════════════════════════════ */}
            <Dialog open={isBomOpen} onOpenChange={setIsBomOpen}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-xl bg-card text-card-foreground border border-border shadow-2xl">
                    <DialogHeader className="p-6 pb-4 border-b border-border flex flex-row items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl font-bold text-foreground tracking-tight">
                                Edit Composite Item
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                Define the formulation recipe and per-unit raw material quantities for this finished product.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    {/* Product Summary Header inside modal */}
                    <div className="bg-muted/40 px-6 py-4 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="size-14 rounded-lg bg-card border border-border p-1 flex items-center justify-center overflow-hidden shadow-xs">
                                {bomProduct?.image_url ? (
                                    <img
                                        src={bomProduct.image_url}
                                        alt={bomProduct.name}
                                        className="size-full object-cover rounded"
                                    />
                                ) : (
                                    <Package className="size-7 text-muted-foreground stroke-[1.5]" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground text-base leading-tight">
                                    {bomProduct?.name}
                                </h3>
                                <p className="font-mono text-xs font-semibold text-primary mt-0.5">
                                    {bomProduct?.product_code || `FP-${String(bomProduct?.product_type_id).padStart(4, '0')}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Composite Item / Bill of Materials (Strictly Raw Materials)
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-xs text-muted-foreground font-medium">Calculated Formulation Cost</p>
                            <p className="text-2xl font-extrabold text-primary">
                                ₱{totalBomCost.toFixed(2)}
                                <span className="text-xs font-normal text-muted-foreground ml-1">/ unit</span>
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveBom}>
                        {/* BOM Table */}
                        <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[11px] font-semibold bg-muted/20">
                                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                                        <th className="py-2.5 px-3 w-[45%]">Item (Raw Material)</th>
                                        <th className="py-2.5 px-3 w-[22%]">
                                            <span className="inline-flex items-center gap-1">
                                                Quantity (per unit)
                                                <Info className="size-3 text-muted-foreground" />
                                            </span>
                                        </th>
                                        <th className="py-2.5 px-3 w-[15%]">Rate (₱)</th>
                                        <th className="py-2.5 px-3 w-[15%]">Amount (₱)</th>
                                        <th className="py-2.5 px-3 w-10 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {bomRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No raw materials in this recipe yet. Click "Add Raw Material" below.
                                            </td>
                                        </tr>
                                    ) : (
                                        bomRows.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-3 px-3 text-center text-muted-foreground font-mono text-xs">
                                                    {idx + 1}
                                                </td>

                                                {/* Raw Material Select */}
                                                <td className="py-3 px-3">
                                                    <select
                                                        value={row.product_id}
                                                        onChange={(e) =>
                                                            handleUpdateBomRow(idx, 'product_id', e.target.value)
                                                        }
                                                        className="w-full rounded-md border border-input bg-background py-1.5 px-2.5 text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-ring"
                                                    >
                                                        {rawMaterials.map((mat) => (
                                                            <option key={mat.product_id} value={mat.product_id}>
                                                                {mat.name} ({mat.sku}) — ₱{Number(mat.rate).toFixed(2)}/{mat.unit_of_measure}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>

                                                {/* Quantity */}
                                                <td className="py-3 px-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <Input
                                                            type="number"
                                                            step="0.0001"
                                                            min="0"
                                                            value={row.quantity_per_unit}
                                                            onChange={(e) =>
                                                                handleUpdateBomRow(
                                                                    idx,
                                                                    'quantity_per_unit',
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="0.00"
                                                            required
                                                            className="h-8 text-xs font-mono bg-background border-input text-foreground"
                                                        />
                                                        <span className="text-muted-foreground font-medium text-xs whitespace-nowrap">
                                                            {row.unit_of_measure}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Rate */}
                                                <td className="py-3 px-3">
                                                    <span className="text-xs font-mono text-muted-foreground">
                                                        ₱{Number(row.rate).toFixed(2)}
                                                    </span>
                                                </td>

                                                {/* Amount */}
                                                <td className="py-3 px-3">
                                                    <span className="text-xs font-mono font-bold text-foreground">
                                                        ₱{Number(row.amount).toFixed(2)}
                                                    </span>
                                                </td>

                                                {/* Remove */}
                                                <td className="py-3 px-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveBomRow(idx)}
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

                            <div className="mt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddBomRow}
                                    className="text-xs border-primary/30 text-primary hover:bg-primary/10"
                                >
                                    <Plus className="size-3.5 mr-1" />
                                    Add Raw Material
                                </Button>
                            </div>
                        </div>

                        <DialogFooter className="p-4 px-6 border-t border-border bg-muted/20 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsBomOpen(false)}
                                className="rounded-lg text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={savingBom}
                                className="rounded-lg font-semibold px-4 text-xs"
                            >
                                {savingBom ? 'Saving BOM...' : 'Save changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ════════════════════════════════════════════════════════════════
                MODAL: ADD / EDIT FINISHED PRODUCT
                (Consolidated Tabs: General | Packaging | Customization | MOQ)
               ════════════════════════════════════════════════════════════════ */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl p-6 bg-card text-card-foreground border border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-foreground">
                            {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Finished Product'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            {editingProduct
                                ? 'Update catalog details, packaging options, customization options, and Minimum Order Quantity (MOQ).'
                                : 'Create a finished product and configure its packaging, customization, and MOQ rules.'}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Inner Modal Tabs: General | Packaging | Customization | MOQ */}
                    <div className="flex items-center gap-1.5 p-1 bg-muted/50 border border-border rounded-lg mt-1 mb-2">
                        <button
                            type="button"
                            onClick={() => setModalTab('general')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                modalTab === 'general'
                                    ? 'bg-card text-foreground shadow-xs border border-border/80'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                            }`}
                        >
                            <Package className="size-3.5" />
                            <span>General Info</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setModalTab('packaging')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                modalTab === 'packaging'
                                    ? 'bg-card text-foreground shadow-xs border border-border/80'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                            }`}
                        >
                            <Box className="size-3.5" />
                            <span>Packaging</span>
                            {formData.packaging_ids.length > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary/20 text-primary">
                                    {formData.packaging_ids.length}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setModalTab('customization')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                modalTab === 'customization'
                                    ? 'bg-card text-foreground shadow-xs border border-border/80'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                            }`}
                        >
                            <Sparkles className="size-3.5" />
                            <span>Customization</span>
                            {formData.customization_ids.length > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary/20 text-primary">
                                    {formData.customization_ids.length}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setModalTab('moq')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                modalTab === 'moq'
                                    ? 'bg-card text-foreground shadow-xs border border-border/80'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                            }`}
                        >
                            <SlidersHorizontal className="size-3.5" />
                            <span>MOQ &amp; Specs</span>
                            {formData.min_quantity && (
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary/20 text-primary">
                                    {formData.min_quantity}
                                </span>
                            )}
                        </button>
                    </div>

                    <form onSubmit={handleFormSubmit} className="space-y-4 py-1">
                        {/* ── TAB 1: General Info ── */}
                        {modalTab === 'general' && (
                            <div className="space-y-4 animate-in fade-in-50 duration-150">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <Label htmlFor="prod-name" className="text-xs font-semibold text-foreground">
                                            Product Name <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="prod-name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. AshigoPlus Coffee Drink Mix"
                                            required
                                            className="rounded-lg bg-background border-input text-foreground"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-foreground">
                                            Item Code
                                        </Label>
                                        <div className="rounded-lg border border-input bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
                                            {editingProduct?.product_code ?? 'Generated automatically when the product is saved'}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">System-generated and cannot be edited.</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="prod-cat" className="text-xs font-semibold text-foreground">
                                            Category <span className="text-destructive">*</span>
                                        </Label>
                                        <select
                                            id="prod-cat"
                                            value={formData.category_code}
                                            onChange={(e) => setFormData({ ...formData, category_code: e.target.value })}
                                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            {categories.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="prod-srp" className="text-xs font-semibold text-foreground">
                                            Suggested SRP (₱) <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="prod-srp"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.suggested_srp}
                                            onChange={(e) => setFormData({ ...formData, suggested_srp: e.target.value })}
                                            placeholder="450.00"
                                            required
                                            className="rounded-lg bg-background border-input text-foreground"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-foreground">Product Image</Label>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="rounded-lg text-xs bg-background border-input text-foreground file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary/10 file:text-primary"
                                        />
                                    </div>

                                    {imagePreview && (
                                        <div className="sm:col-span-2 flex items-center gap-3 p-2.5 border border-border rounded-lg bg-muted/40">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="size-12 object-cover rounded-md border border-border"
                                            />
                                            <span className="text-xs text-muted-foreground">Image selected for catalog</span>
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
                                            className="rounded-lg bg-background border-input text-foreground"
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
                                                    className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                                        isChecked
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
                                                    className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                                        isChecked
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

                        <DialogFooter className="pt-3 border-t border-border gap-2 flex items-center justify-between sm:justify-between">
                            <div className="text-[11px] text-muted-foreground">
                                {modalTab === 'general' && 'Page 1 of 4: Basic catalog info'}
                                {modalTab === 'packaging' && 'Page 2 of 4: Approved packaging choices'}
                                {modalTab === 'customization' && 'Page 3 of 4: Custom finish & label methods'}
                                {modalTab === 'moq' && 'Page 4 of 4: Batch minimums & specifications'}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsFormOpen(false)}
                                    className="rounded-lg text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-lg text-xs font-semibold px-4"
                                >
                                    {submitting ? 'Saving...' : editingProduct ? 'Save All Changes' : 'Create Product'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
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
