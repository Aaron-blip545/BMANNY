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
    Check,
    X,
    Loader2,
    Package,
    AlertCircle,
    FlaskConical,
    Layers,
    FileSpreadsheet,
    HelpCircle,
    Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Product Controller', href: '/product-controller/dashboard' },
    { title: 'Products', href: '/product-controller/products' },
];

function getCategoryBadgeClass(category: string) {
    switch (category?.toLowerCase()) {
        case 'health & wellness':
            return 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
        case 'supplements & wellbeing':
            return 'bg-blue-50 text-blue-700 border border-blue-200/60';
        case 'detox & nutrition':
            return 'bg-amber-50 text-amber-700 border border-amber-200/60';
        case 'beauty & personal care':
            return 'bg-purple-50 text-purple-700 border border-purple-200/60';
        default:
            return 'bg-slate-50 text-slate-700 border border-slate-200/60';
    }
}

export default function ProductsPage({ products = [], categories = [], rawMaterials = [] }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    // Add / Edit Product Modal state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Delete confirmation state
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<CatalogProduct | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Bill of Materials (BOM) Modal state matching client's screenshot
    const [isBomOpen, setIsBomOpen] = useState(false);
    const [bomProduct, setBomProduct] = useState<CatalogProduct | null>(null);
    const [bomRows, setBomRows] = useState<BomItem[]>([]);
    const [savingBom, setSavingBom] = useState(false);

    // Form fields
    const [formData, setFormData] = useState({
        name: '',
        product_code: '',
        category_code: 'Health & Wellness',
        suggested_srp: '',
        description: '',
        formulation_notes: '',
        image_url: '',
        is_active: true,
    });
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Filter products
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
            product_code: '',
            category_code: categories.includes('Health & Wellness') ? 'Health & Wellness' : (categories[0] || ''),
            suggested_srp: '',
            description: '',
            formulation_notes: '',
            image_url: '',
            is_active: true,
        });
        setSelectedImageFile(null);
        setImagePreview(null);
        setIsFormOpen(true);
    };

    const openEditModal = (product: CatalogProduct) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            product_code: product.product_code || `FP-${String(product.product_type_id).padStart(4, '0')}`,
            category_code: product.category_code || 'Health & Wellness',
            suggested_srp: product.suggested_srp.toString(),
            description: product.description || '',
            formulation_notes: product.formulation_notes || '',
            image_url: product.image_url || '',
            is_active: product.is_active,
        });
        setSelectedImageFile(null);
        setImagePreview(product.image_url || null);
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
        if (formData.product_code) data.append('product_code', formData.product_code);
        data.append('category_code', formData.category_code);
        data.append('suggested_srp', formData.suggested_srp);
        data.append('description', formData.description);
        data.append('formulation_notes', formData.formulation_notes);
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

        // If no existing recipes, start with one empty row
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
        // Pick first raw material not yet added, or fallback to first
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

        // Filter valid rows
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products Catalog - Product Controller" />

            <div className="space-y-6">
                {/* ── Page Header ────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                Finished Products &amp; Formulations
                            </h1>
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60">
                                Composite Items
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Manage finished products, catalog offerings, and formulation Bill of Materials (BOM).
                        </p>
                    </div>

                    <Button
                        onClick={openCreateModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm inline-flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Product</span>
                    </Button>
                </div>

                {/* ── Search & Filter Controls Bar ──────────────────────────── */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search by product name, code (FP-...), or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white border-slate-200 text-sm rounded-lg shadow-sm"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="relative min-w-[180px]">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full appearance-none pl-3.5 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all cursor-pointer"
                        >
                            <option value="all">All categories</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Status Filter */}
                    <div className="relative min-w-[140px]">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full appearance-none pl-3.5 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all cursor-pointer"
                        >
                            <option value="all">All statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* ── Products Table Card ───────────────────────────────────── */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-semibold">
                                    <th className="py-3.5 px-6 font-medium text-slate-600 w-[34%]">Finished Product</th>
                                    <th className="py-3.5 px-6 font-medium text-slate-600 w-[16%]">Category</th>
                                    <th className="py-3.5 px-6 font-medium text-slate-600 w-[18%]">Recipe / BOM Cost</th>
                                    <th className="py-3.5 px-6 font-medium text-slate-600 w-[12%]">SRP</th>
                                    <th className="py-3.5 px-6 font-medium text-slate-600 w-[10%]">Status</th>
                                    <th className="py-3.5 px-6 font-medium text-slate-600 text-right w-[10%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-500">
                                            <Package className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                                            <p className="text-sm font-medium text-slate-700">No products found</p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                                                    ? 'Try adjusting your search filters.'
                                                    : 'Click "+ Add Product" to add your first finished product.'}
                                            </p>
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
                                                className="hover:bg-slate-50/50 transition-colors group"
                                            >
                                                {/* Product column with thumbnail & description */}
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200/80 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                            {product.image_url ? (
                                                                <img
                                                                    src={product.image_url}
                                                                    alt={product.name}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 text-slate-400">
                                                                    <Package className="w-6 h-6 stroke-[1.5]" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-bold text-slate-900 truncate">
                                                                    {product.name}
                                                                </p>
                                                                <span className="font-mono text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/50">
                                                                    {code}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 truncate mt-0.5 max-w-sm">
                                                                {product.description || `${product.category_code} composite finished good`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Category column */}
                                                <td className="py-4 px-6">
                                                    <span
                                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getCategoryBadgeClass(
                                                            product.category_code
                                                        )}`}
                                                    >
                                                        {product.category_code}
                                                    </span>
                                                </td>

                                                {/* Recipe / BOM Cost column */}
                                                <td className="py-4 px-6">
                                                    <div>
                                                        <button
                                                            type="button"
                                                            onClick={() => openBomModal(product)}
                                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                                                        >
                                                            <Layers className="size-3.5" />
                                                            {recipeCount > 0 ? (
                                                                <span>₱{recipeCost.toFixed(2)} / unit ({recipeCount} materials)</span>
                                                            ) : (
                                                                <span className="text-slate-400">+ Set BOM Recipe</span>
                                                            )}
                                                        </button>
                                                        <p className="text-[11px] text-slate-400">Bill of Materials cost</p>
                                                    </div>
                                                </td>

                                                {/* Base SRP column */}
                                                <td className="py-4 px-6">
                                                    <span className="text-sm font-semibold text-slate-800">
                                                        {product.formatted_price}
                                                    </span>
                                                </td>

                                                {/* Status column */}
                                                <td className="py-4 px-6">
                                                    <button
                                                        onClick={() => toggleProductStatus(product)}
                                                        title="Click to toggle status"
                                                        className="inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-80 cursor-pointer"
                                                    >
                                                        <span
                                                            className={`w-2 h-2 rounded-full ${
                                                                product.is_active ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                                                            }`}
                                                        />
                                                        <span
                                                            className={
                                                                product.is_active ? 'text-[#10B981]' : 'text-[#F59E0B]'
                                                            }
                                                        >
                                                            {product.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </button>
                                                </td>

                                                {/* Actions column */}
                                                <td className="py-4 px-6 text-right">
                                                    <div className="inline-flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => openBomModal(product)}
                                                            title="Edit Bill of Materials / Recipe"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-md transition-colors cursor-pointer"
                                                        >
                                                            <FlaskConical className="w-3.5 h-3.5 text-blue-600" />
                                                            <span>BOM</span>
                                                        </button>
                                                        <button
                                                            onClick={() => openEditModal(product)}
                                                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors cursor-pointer"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDelete(product)}
                                                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-[#EF4444] bg-white hover:bg-red-50 border border-red-200/80 rounded-md transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════════
                MODAL: EDIT COMPOSITE ITEM / BILL OF MATERIALS (BOM)
                Strictly Raw Materials (R-), matching client's screenshot
               ════════════════════════════════════════════════════════════════════ */}
            <Dialog open={isBomOpen} onOpenChange={setIsBomOpen}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-xl bg-white text-slate-900 border shadow-2xl">
                    <DialogHeader className="p-6 pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
                                Edit Composite Item
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 mt-0.5">
                                Define the formulation recipe and per-unit raw material quantities for this finished product.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    {/* Product Summary Header inside modal */}
                    <div className="bg-slate-50/70 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden shadow-xs">
                                {bomProduct?.image_url ? (
                                    <img
                                        src={bomProduct.image_url}
                                        alt={bomProduct.name}
                                        className="w-full h-full object-cover rounded"
                                    />
                                ) : (
                                    <Package className="w-7 h-7 text-slate-400 stroke-[1.5]" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-base leading-tight">
                                    {bomProduct?.name}
                                </h3>
                                <p className="font-mono text-xs font-semibold text-blue-600 mt-0.5">
                                    {bomProduct?.product_code || `FP-${String(bomProduct?.product_type_id).padStart(4, '0')}`}
                                </p>
                                <p className="text-xs text-slate-400">
                                    Composite Item / Bill of Materials (Strictly Raw Materials)
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-xs text-slate-500 font-medium">Calculated Formulation Cost</p>
                            <p className="text-2xl font-extrabold text-blue-700">
                                ₱{totalBomCost.toFixed(2)}
                                <span className="text-xs font-normal text-slate-400 ml-1">/ unit</span>
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveBom}>
                        {/* BOM Table */}
                        <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                                        <th className="py-2.5 px-3 w-[45%]">Item (Raw Material)</th>
                                        <th className="py-2.5 px-3 w-[22%]">
                                            <span className="inline-flex items-center gap-1">
                                                Quantity (per unit)
                                                <HelpCircle className="size-3 text-slate-400" />
                                            </span>
                                        </th>
                                        <th className="py-2.5 px-3 w-[15%]">Rate (₱)</th>
                                        <th className="py-2.5 px-3 w-[14%]">Amount (₱)</th>
                                        <th className="py-2.5 px-2 w-8 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {bomRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-slate-400">
                                                No raw materials in this formulation. Click "+ Add Raw Material" below.
                                            </td>
                                        </tr>
                                    ) : (
                                        bomRows.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                {/* # Row Number */}
                                                <td className="py-3 px-3 font-mono text-center text-slate-400">
                                                    {idx + 1}
                                                </td>

                                                {/* Raw Material Select */}
                                                <td className="py-3 px-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="size-8 rounded bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden">
                                                            {row.product_image ? (
                                                                <img
                                                                    src={row.product_image}
                                                                    alt=""
                                                                    className="size-full object-cover"
                                                                />
                                                            ) : (
                                                                <FlaskConical className="size-4 text-slate-400" />
                                                            )}
                                                        </div>
                                                        <select
                                                            value={row.product_id}
                                                            onChange={(e) =>
                                                                handleUpdateBomRow(idx, 'product_id', e.target.value)
                                                            }
                                                            className="w-full text-xs font-semibold py-1.5 px-2 bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                                                        >
                                                            {rawMaterials.map((mat) => (
                                                                <option key={mat.product_id} value={mat.product_id}>
                                                                    {mat.name} ({mat.sku}) — Stock: {mat.stock_quantity} {mat.unit_of_measure}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </td>

                                                {/* Quantity per unit */}
                                                <td className="py-3 px-3">
                                                    <div className="space-y-0.5">
                                                        <Input
                                                            type="number"
                                                            step="0.000001"
                                                            min="0.000001"
                                                            placeholder="0.0000"
                                                            value={row.quantity_per_unit}
                                                            onChange={(e) =>
                                                                handleUpdateBomRow(idx, 'quantity_per_unit', e.target.value)
                                                            }
                                                            className="h-8 text-xs font-mono font-semibold"
                                                            required
                                                        />
                                                        <p className="text-[10px] text-slate-400 pl-1">
                                                            per unit ({row.unit_of_measure ?? 'kg'})
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* Rate (₱) */}
                                                <td className="py-3 px-3">
                                                    <div className="space-y-0.5">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={row.rate}
                                                            onChange={(e) =>
                                                                handleUpdateBomRow(idx, 'rate', e.target.value)
                                                            }
                                                            className="h-8 text-xs font-mono"
                                                        />
                                                        <p className="text-[10px] text-slate-400 pl-1">₱ / {row.unit_of_measure ?? 'kg'}</p>
                                                    </div>
                                                </td>

                                                {/* Amount (₱) */}
                                                <td className="py-3 px-3 font-mono font-bold text-slate-800 text-sm">
                                                    ₱{Number(row.amount).toFixed(2)}
                                                </td>

                                                {/* Remove */}
                                                <td className="py-3 px-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveBomRow(idx)}
                                                        className="text-slate-400 hover:text-rose-500 rounded-full p-1 transition-colors"
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

                            {/* + Add Raw Material Button matching screenshot */}
                            <div className="mt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddBomRow}
                                    className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                >
                                    <Plus className="size-3.5 mr-1" />
                                    Add Raw Material
                                </Button>
                            </div>
                        </div>

                        <DialogFooter className="p-4 px-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
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
                                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4"
                            >
                                {savingBom ? 'Saving BOM...' : 'Save changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── MODAL: Add / Edit Product ────────────────────────────── */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-lg rounded-xl p-6 bg-white text-slate-900 border shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-900">
                            {editingProduct ? 'Edit Finished Product' : 'Add New Finished Product'}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500">
                            {editingProduct
                                ? 'Update catalog details, pricing, and formulation specifications.'
                                : 'Create a new composite item / finished product for the catalog.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="prod-name" className="text-xs font-semibold text-slate-700">
                                Product Name <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="prod-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. AshigoPlus Coffee Drink Mix"
                                required
                                className="rounded-lg"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="prod-code" className="text-xs font-semibold text-slate-700">
                                    Item Code (FP-xxxx)
                                </Label>
                                <Input
                                    id="prod-code"
                                    value={formData.product_code}
                                    onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                                    placeholder="e.g. FP-0001"
                                    className="rounded-lg font-mono text-xs"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="prod-cat" className="text-xs font-semibold text-slate-700">
                                    Category <span className="text-rose-500">*</span>
                                </Label>
                                <select
                                    id="prod-cat"
                                    value={formData.category_code}
                                    onChange={(e) => setFormData({ ...formData, category_code: e.target.value })}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    {categories.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="prod-srp" className="text-xs font-semibold text-slate-700">
                                    Suggested SRP (₱) <span className="text-rose-500">*</span>
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
                                    className="rounded-lg"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Product Image</Label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="rounded-lg text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700"
                                />
                            </div>
                        </div>

                        {imagePreview && (
                            <div className="flex items-center gap-3 p-2 border border-slate-200 rounded-lg bg-slate-50">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-12 h-12 object-cover rounded-md"
                                />
                                <span className="text-xs text-slate-500">Image selected</span>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="prod-desc" className="text-xs font-semibold text-slate-700">
                                Description
                            </Label>
                            <Input
                                id="prod-desc"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Nutritional composite herbal coffee drink mix..."
                                className="rounded-lg"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="prod-notes" className="text-xs font-semibold text-slate-700">
                                Formulation Notes
                            </Label>
                            <Input
                                id="prod-notes"
                                value={formData.formulation_notes}
                                onChange={(e) => setFormData({ ...formData, formulation_notes: e.target.value })}
                                placeholder="Net weight 21g per sachet, recommended batch size..."
                                className="rounded-lg"
                            />
                        </div>

                        <DialogFooter className="pt-2 gap-2">
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
                                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs"
                            >
                                {submitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── MODAL: Delete Confirmation ───────────────────────────── */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="max-w-sm rounded-xl p-6 bg-white text-slate-900 border shadow-xl">
                    <DialogHeader>
                        <div className="size-11 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
                            <AlertCircle className="size-5" />
                        </div>
                        <DialogTitle className="text-base font-bold text-slate-900">
                            Delete Product
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500">
                            Are you sure you want to delete{' '}
                            <span className="font-semibold text-slate-800">{productToDelete?.name}</span>?
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
                            className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs"
                        >
                            {deleting ? 'Deleting...' : 'Delete Product'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
