import { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    Box,
    Plus,
    Search,
    ChevronDown,
    Pencil,
    Trash2,
    Image as ImageIcon,
    Check,
    X,
    Loader2,
    Package,
    Sparkles,
    AlertCircle,
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

interface CatalogProduct {
    product_type_id: number;
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
}

interface Props {
    products: CatalogProduct[];
    categories: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Product Controller', href: '/product-controller/dashboard' },
    { title: 'Products', href: '/product-controller/products' },
];

export default function ProductsPage({ products = [], categories = [] }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    // Add / Edit Modal state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Delete confirmation state
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<CatalogProduct | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Form fields
    const [formData, setFormData] = useState({
        name: '',
        category_code: 'Beverage',
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
            category_code: categories[0] || 'Beverage',
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
            category_code: product.category_code || 'Beverage',
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

    const toggleProductStatus = (product: CatalogProduct) => {
        router.patch(`/product-controller/products/${product.product_type_id}/toggle-status`, {}, {
            preserveScroll: true,
        });
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

    const getCategoryBadgeClass = (category: string) => {
        const cat = category.toLowerCase();
        if (cat.includes('beverage') || cat.includes('drink')) {
            return 'bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]';
        }
        if (cat.includes('supplement') || cat.includes('health')) {
            return 'bg-[#F5F3FF] text-[#7C3AED] border border-[#EDE9FE]';
        }
        if (cat.includes('cosmetic') || cat.includes('beauty') || cat.includes('skin')) {
            return 'bg-[#FAF5FF] text-[#9333EA] border border-[#F3E8FF]';
        }
        if (cat.includes('personal') || cat.includes('care')) {
            return 'bg-[#ECFDF5] text-[#059669] border border-[#D1FAE5]';
        }
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products - Catalog Management" />

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* ── Page Header matching reference image ────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                        <div className="mt-1 flex items-center justify-center text-slate-900">
                            {/* Cube Icon */}
                            <svg
                                className="w-8 h-8 stroke-current"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                <line x1="12" y1="22.08" x2="12" y2="12" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                                Products
                            </h1>
                            <p className="text-sm text-slate-500 mt-0.5">
                                Manage what customers see in the customization catalog.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-sm shadow-sm transition-colors cursor-pointer"
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Add product</span>
                    </button>
                </div>

                {/* ── Filter Controls matching reference image ──────────────── */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search bar */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Category Filter */}
                    <div className="relative min-w-[160px]">
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

                {/* ── Products Table Card matching reference image ──────────── */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-semibold">
                                    <th className="py-3.5 px-6 font-medium text-slate-600 w-[38%]">Product</th>
                                    <th className="py-3.5 px-6 font-medium text-slate-600 w-[18%]">Category</th>
                                    <th className="py-3.5 px-6 font-medium text-slate-600 w-[16%]">Base price</th>
                                    <th className="py-3.5 px-6 font-medium text-slate-600 w-[14%]">Status</th>
                                    <th className="py-3.5 px-6 font-medium text-slate-600 text-right w-[14%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-500">
                                            <Package className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                                            <p className="text-sm font-medium text-slate-700">No products found</p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                                                    ? 'Try adjusting your search filters.'
                                                    : 'Click "+ Add product" to add your first product to the catalog.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => (
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
                                                        <p className="text-sm font-semibold text-slate-900 truncate">
                                                            {product.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500 truncate mt-0.5 max-w-sm">
                                                            {product.description || `${product.category_code} catalog product`}
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

                                            {/* Base price column */}
                                            <td className="py-4 px-6">
                                                <span className="text-sm font-medium text-slate-800">
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
                                                        className={`w-2 h-2 rounded-full ${product.is_active ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
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
                                                <div className="inline-flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(product)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors shadow-2xs cursor-pointer"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                                        <span>Edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => confirmDelete(product)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#EF4444] bg-white hover:bg-red-50 border border-red-200/80 rounded-md transition-colors shadow-2xs cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
                                                        <span>Delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── Add / Edit Product Modal ───────────────────────────────── */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-900">
                            {editingProduct ? 'Edit product' : 'Add product'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            {editingProduct
                                ? 'Update the product details, category, price, and visibility in the mobile catalog.'
                                : 'Add a new product to the catalog. It will immediately be visible on the mobile app for customers to customize.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
                        {/* Product Name */}
                        <div>
                            <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                                Product Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Citrus Energy Shot"
                                className="mt-1 text-sm"
                            />
                        </div>

                        {/* Category & Base Price */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="category_code" className="text-xs font-semibold text-slate-700">
                                    Category <span className="text-red-500">*</span>
                                </Label>
                                <div className="mt-1 relative">
                                    <input
                                        id="category_code"
                                        list="category-options"
                                        required
                                        value={formData.category_code}
                                        onChange={(e) => setFormData({ ...formData, category_code: e.target.value })}
                                        placeholder="Select or type category"
                                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    <datalist id="category-options">
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="suggested_srp" className="text-xs font-semibold text-slate-700">
                                    Base Price (₱) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="suggested_srp"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={formData.suggested_srp}
                                    onChange={(e) => setFormData({ ...formData, suggested_srp: e.target.value })}
                                    placeholder="85.00"
                                    className="mt-1 text-sm"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <Label htmlFor="description" className="text-xs font-semibold text-slate-700">
                                Description / Specification Subtitle
                            </Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="e.g. 60ml functional beverage base"
                                className="mt-1 text-sm"
                            />
                        </div>

                        {/* Product Image */}
                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Product Image</Label>
                            <div className="mt-1 flex items-center gap-4">
                                <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-6 h-6 text-slate-400" />
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-200 file:text-xs file:font-medium file:bg-white file:text-slate-700 hover:file:bg-slate-50 cursor-pointer"
                                    />
                                    <Input
                                        value={formData.image_url}
                                        onChange={(e) => {
                                            setFormData({ ...formData, image_url: e.target.value });
                                            setImagePreview(e.target.value || null);
                                        }}
                                        placeholder="Or paste image URL"
                                        className="text-xs h-8"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Catalog Status Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                            <div>
                                <p className="text-xs font-semibold text-slate-800">Active in Mobile Catalog</p>
                                <p className="text-xs text-slate-500">
                                    When active, customers will see this product on the mobile app home screen and can customize orders.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${formData.is_active ? 'bg-[#2563EB]' : 'bg-slate-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsFormOpen(false)}
                                disabled={submitting}
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium"
                            >
                                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                                {editingProduct ? 'Save changes' : 'Add to catalog'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation Dialog ─────────────────────────────── */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            Delete product from catalog?
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 pt-1">
                            Are you sure you want to remove <strong className="text-slate-700">{productToDelete?.name}</strong> from the catalog? Customers will no longer be able to select or customize this product.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="gap-2 sm:gap-0 pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteOpen(false)}
                            disabled={deleting}
                            className="text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium"
                        >
                            {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                            Delete product
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
