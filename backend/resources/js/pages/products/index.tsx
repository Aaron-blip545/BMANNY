import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowUpDown,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    CircleCheck,
    CircleX,
    ClipboardList,
    FlaskConical,
    Layers,
    PackageSearch,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Inventory', href: '/products' }];

interface Product {
    product_id: number;
    category_id: number | null;
    name: string;
    sku: string;
    batch_lot_number?: string | null;
    description: string | null;
    price: string | number;
    stock_quantity: number | string;
    reorder_level?: number | string;
    max_stock_level?: number | string | null;
    unit_of_measure?: string;
    expiration_date?: string | null;
    restock_lead_days?: number | null;
    stock_status?: string;
    expiry_status?: 'none' | 'fresh' | 'expiring_soon' | 'expired';
    days_until_expiry?: number | null;
    recipes_count?: number;
    product_image: string | null;
    created_at?: string;
    updated_at?: string;
    category?: { category_id: number; name: string } | null;
}

interface Category {
    category_id: number;
    name: string;
}

interface Props {
    products: Product[];
    categories: Category[];
    nextSku?: string;
    error?: string | null;
}

type SortField = 'name' | 'sku' | 'category' | 'stock' | 'reorder' | 'price' | 'status';
type SortOrder = 'asc' | 'desc';

function formatCurrency(value: string | number) {
    const amount = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(amount)) return '₱0';
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatQuantity(value: string | number, unit: string = 'pcs') {
    const qty = typeof value === 'string' ? parseFloat(value) : value;
    const displayUnit = (!unit || unit === 'kg' || unit === 'pieces') ? 'pcs' : unit;
    if (isNaN(qty)) return `0 ${displayUnit}`;
    const formatted = parseFloat(qty.toFixed(4)).toString();
    return `${formatted} ${displayUnit}`;
}

function getStockStatus(stock: number, reorder: number = 0, maxStock: number = 0) {
    if (stock <= 0) {
        return {
            label: 'Out of Stock',
            pill: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
        };
    }
    if (reorder > 0 && stock <= reorder) {
        return {
            label: 'Reorder Alert',
            pill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
        };
    }
    if (maxStock > 0 && stock > maxStock) {
        return {
            label: 'Overstock',
            pill: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
        };
    }
    return {
        label: 'In Stock',
        pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    };
}

export default function ProductsIndex({ products = [], categories = [], nextSku = 'RM-0001', error }: Props) {
    const { auth } = usePage().props as any;
    const userRole: string = auth?.user?.role ?? '';
    const canManageInventory = ['product_controller', 'admin'].includes(userRole);

    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 12;

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [activeProduct, setActiveProduct] = useState<Product | null>(null);

    const form = useForm({
        name: '',
        batch_lot_number: '',
        category_id: '' as string | number,
        price: '',
        stock_quantity: '',
        reorder_level: '',
        max_stock_level: '',
        unit_of_measure: 'pcs',
        expiration_date: '',
        restock_lead_days: '7',
        description: '',
        product_image: '',
    });

    const metrics = useMemo(() => {
        let inStock = 0;
        let reorderNeeded = 0;
        let outOfStock = 0;
        let overstock = 0;
        let expiryRisk = 0;
        for (const p of products) {
            const s = Number(p.stock_quantity) || 0;
            const r = Number(p.reorder_level) || 0;
            const m = Number(p.max_stock_level) || 0;
            if (s <= 0) outOfStock++;
            else if (r > 0 && s <= r) reorderNeeded++;
            else if (m > 0 && s > m) overstock++;
            else inStock++;

            if (p.expiry_status === 'expired' || p.expiry_status === 'expiring_soon') {
                expiryRisk++;
            }
        }
        return { total: products.length, inStock, reorderNeeded, outOfStock, overstock, expiryRisk };
    }, [products]);

    const filteredProducts = useMemo(() => {
        const term = search.trim().toLowerCase();
        return products.filter((p) => {
            if (categoryFilter !== 'all') {
                if (categoryFilter === 'uncategorized') {
                    if (p.category_id) return false;
                } else if (String(p.category_id) !== categoryFilter) {
                    return false;
                }
            }
            if (statusFilter !== 'all') {
                const s = Number(p.stock_quantity) || 0;
                const r = Number(p.reorder_level) || 0;
                const m = Number(p.max_stock_level) || 0;
                const isReorder = r > 0 && s <= r;
                const isOverstock = m > 0 && s > m;

                if (statusFilter === 'in_stock' && (s <= 0 || isReorder || isOverstock)) return false;
                if (statusFilter === 'reorder' && (!isReorder || s <= 0)) return false;
                if (statusFilter === 'out_of_stock' && s > 0) return false;
                if (statusFilter === 'overstock' && !isOverstock) return false;
                if (statusFilter === 'expiry_risk' && p.expiry_status !== 'expired' && p.expiry_status !== 'expiring_soon') return false;
            }
            if (!term) return true;
            return (
                p.name?.toLowerCase().includes(term) ||
                p.sku?.toLowerCase().includes(term) ||
                (p.batch_lot_number?.toLowerCase().includes(term) ?? false) ||
                (p.category?.name?.toLowerCase().includes(term) ?? false)
            );
        });
    }, [products, search, categoryFilter, statusFilter]);

    const sortedProducts = useMemo(() => {
        return [...filteredProducts].sort((a, b) => {
            let av: string | number = '';
            let bv: string | number = '';
            switch (sortField) {
                case 'name':
                    av = a.name.toLowerCase();
                    bv = b.name.toLowerCase();
                    break;
                case 'sku':
                    av = a.sku.toLowerCase();
                    bv = b.sku.toLowerCase();
                    break;
                case 'category':
                    av = a.category?.name?.toLowerCase() ?? '';
                    bv = b.category?.name?.toLowerCase() ?? '';
                    break;
                case 'stock':
                    av = Number(a.stock_quantity) || 0;
                    bv = Number(b.stock_quantity) || 0;
                    break;
                case 'reorder':
                    av = Number(a.reorder_level) || 0;
                    bv = Number(b.reorder_level) || 0;
                    break;
                case 'price':
                    av = parseFloat(String(a.price)) || 0;
                    bv = parseFloat(String(b.price)) || 0;
                    break;
                case 'status': {
                    const w = (p: Product) => {
                        const s = Number(p.stock_quantity) || 0;
                        const r = Number(p.reorder_level) || 0;
                        if (s <= 0) return 0;
                        if (r > 0 ? s <= r : s <= 10) return 1;
                        return 2;
                    };
                    av = w(a);
                    bv = w(b);
                    break;
                }
            }
            if (av < bv) return sortOrder === 'asc' ? -1 : 1;
            if (av > bv) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredProducts, sortField, sortOrder]);

    const totalPages = Math.max(1, Math.ceil(sortedProducts.length / pageSize));
    const paginatedProducts = useMemo(
        () => sortedProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [sortedProducts, currentPage]
    );

    const handleSort = (field: SortField) => {
        if (sortField === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const isAllSelected =
        paginatedProducts.length > 0 && paginatedProducts.every((p) => selectedIds.includes(p.product_id));

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds((prev) => prev.filter((id) => !paginatedProducts.some((p) => p.product_id === id)));
        } else {
            setSelectedIds((prev) => [
                ...prev,
                ...paginatedProducts.map((p) => p.product_id).filter((id) => !prev.includes(id)),
            ]);
        }
    };

    const toggleSelectOne = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const openAddModal = () => {
        form.reset();
        form.clearErrors();
        form.setData({
            name: '',
            batch_lot_number: '',
            category_id: '',
            price: '',
            stock_quantity: '',
            reorder_level: '',
            max_stock_level: '',
            unit_of_measure: 'pcs',
            expiration_date: '',
            restock_lead_days: '7',
            description: '',
            product_image: '',
        });
        setIsAddModalOpen(true);
    };

    const handleCreateProduct = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/products', {
            preserveScroll: true,
            onSuccess: () => {
                setIsAddModalOpen(false);
                form.reset();
            },
        });
    };

    const openEditModal = (product: Product) => {
        setActiveProduct(product);
        form.clearErrors();
        form.setData({
            name: product.name,
            batch_lot_number: product.batch_lot_number ?? '',
            category_id: product.category_id ? String(product.category_id) : '',
            price: String(product.price),
            stock_quantity: String(product.stock_quantity),
            reorder_level: product.reorder_level ? String(product.reorder_level) : '0',
            max_stock_level: product.max_stock_level ? String(product.max_stock_level) : '',
            unit_of_measure: product.unit_of_measure ?? 'pcs',
            expiration_date: product.expiration_date ?? '',
            restock_lead_days: product.restock_lead_days ? String(product.restock_lead_days) : '7',
            description: product.description ?? '',
            product_image: product.product_image ?? '',
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateProduct = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeProduct) return;
        form.put(`/products/${activeProduct.product_id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditModalOpen(false);
                setActiveProduct(null);
                form.reset();
            },
        });
    };

    const openDeleteModal = (product: Product) => {
        setActiveProduct(product);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteProduct = () => {
        if (!activeProduct) return;
        router.delete(`/products/${activeProduct.product_id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedIds((prev) => prev.filter((id) => id !== activeProduct.product_id));
                setActiveProduct(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory - Raw Materials" />

            <div className="bmanny-page">
                {/* Header Banner */}
                <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="border-l-4 border-amber-400 pl-3.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sales Workspace</p>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">RAW MATERIALS INVENTORY</h1>
                        <p className="text-xs text-muted-foreground sm:text-sm">Track formulation ingredients, extracts, powders, and reorder levels for manufacturing</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        {canManageInventory && (
                            <Button
                                id="add-material-btn"
                                type="button"
                                onClick={openAddModal}
                                className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                            >
                                <Plus className="mr-1.5 h-4 w-4" />
                                Add Raw Material
                            </Button>
                        )}
                    </div>
                </header>

                {/* Metric Summary Cards */}
                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {[
                        {
                            label: 'Total Materials',
                            value: metrics.total,
                            description: 'Active raw materials',
                            icon: ClipboardList,
                        },
                        {
                            label: 'In Stock',
                            value: metrics.inStock,
                            description: 'Healthy stock level',
                            icon: CircleCheck,
                        },
                        {
                            label: 'Reorder Alert',
                            value: metrics.reorderNeeded,
                            description: 'At or below reorder',
                            icon: CircleAlert,
                        },
                        {
                            label: 'Out of Stock',
                            value: metrics.outOfStock,
                            description: 'Zero stock on hand',
                            icon: CircleX,
                        },
                        {
                            label: 'Overstock',
                            value: metrics.overstock,
                            description: 'Above max threshold',
                            icon: Layers,
                        },
                        {
                            label: 'Expiry Risk',
                            value: metrics.expiryRisk,
                            description: 'Expired or ≤30d left',
                            icon: AlertTriangle,
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
                        {sortedProducts.length}/{products.length} Materials
                    </p>
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search raw material, SKU (R-)..."
                                className="h-9 w-full rounded-lg border border-input/80 bg-muted/20 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-72"
                            />
                        </div>

                        {/* Category filter */}
                        <div className="relative">
                            <select
                                value={categoryFilter}
                                onChange={(e) => {
                                    setCategoryFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-9 w-full appearance-none rounded-lg border border-input/80 bg-muted/20 px-3 pr-8 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-auto"
                            >
                                <option value="all">All Categories</option>
                                <option value="uncategorized">Uncategorized</option>
                                {categories.map((c) => (
                                    <option key={c.category_id} value={String(c.category_id)}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        </div>

                        {/* Status filter */}
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-9 w-full appearance-none rounded-lg border border-input/80 bg-muted/20 px-3 pr-8 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-auto"
                            >
                                <option value="all">All Statuses</option>
                                <option value="in_stock">In Stock</option>
                                <option value="reorder">Reorder Alert</option>
                                <option value="out_of_stock">Out of Stock</option>
                                <option value="overstock">Overstock</option>
                                <option value="expiry_risk">Expiring / Expired</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>
                </div>

                {/* Items Table / Card Rows */}
                {error ? (
                    <div className="rounded-xl border border-border/70 bg-card py-16 text-center text-destructive shadow-sm">
                        <AlertTriangle className="mx-auto mb-2 size-8 opacity-80" />
                        <p className="text-sm font-medium">Failed to load inventory. Please refresh.</p>
                    </div>
                ) : sortedProducts.length === 0 ? (
                    <div className="rounded-xl border border-border/70 bg-card py-16 text-center text-muted-foreground shadow-sm">
                        <PackageSearch className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                        <h2 className="text-base font-semibold text-foreground">
                            {products.length === 0 ? 'No raw materials in inventory' : 'No matching materials found'}
                        </h2>
                        <p className="mt-1 text-xs">
                            {products.length === 0
                                ? 'Start tracking ingredients, extracts, and base powders by adding your first raw material.'
                                : 'Try adjusting your search query or filter settings.'}
                        </p>
                        {products.length === 0 && canManageInventory && (
                            <Button onClick={openAddModal} className="mt-4 h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700">
                                <Plus className="mr-1.5 h-4 w-4" /> Add Raw Material
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] border-separate border-spacing-y-2.5 text-left text-sm">
                            <thead>
                                <tr>
                                    <th className="px-5 py-3 text-sm font-bold text-foreground">
                                        <button
                                            type="button"
                                            onClick={() => handleSort('name')}
                                            className="inline-flex items-center gap-1 hover:text-foreground/80 font-bold"
                                        >
                                            Raw Material
                                            <ArrowUpDown className="size-3.5 opacity-50" />
                                        </button>
                                    </th>

                                    <th className="px-5 py-3 text-sm font-bold text-foreground">
                                        <button
                                            type="button"
                                            onClick={() => handleSort('category')}
                                            className="inline-flex items-center gap-1 hover:text-foreground/80 font-bold"
                                        >
                                            Category
                                            <ArrowUpDown className="size-3.5 opacity-50" />
                                        </button>
                                    </th>
                                    <th className="px-5 py-3 text-sm font-bold text-foreground">
                                        <button
                                            type="button"
                                            onClick={() => handleSort('stock')}
                                            className="inline-flex items-center gap-1 hover:text-foreground/80 font-bold"
                                        >
                                            Stock on Hand
                                            <ArrowUpDown className="size-3.5 opacity-50" />
                                        </button>
                                    </th>
                                    <th className="px-5 py-3 text-sm font-bold text-foreground">
                                        <button
                                            type="button"
                                            onClick={() => handleSort('price')}
                                            className="inline-flex items-center gap-1 hover:text-foreground/80 font-bold"
                                        >
                                            Unit Rate (₱)
                                            <ArrowUpDown className="size-3.5 opacity-50" />
                                        </button>
                                    </th>
                                    <th className="px-5 py-3 text-sm font-bold text-foreground">
                                        <button
                                            type="button"
                                            onClick={() => handleSort('status')}
                                            className="inline-flex items-center gap-1 hover:text-foreground/80 font-bold"
                                        >
                                            Status
                                            <ArrowUpDown className="size-3.5 opacity-50" />
                                        </button>
                                    </th>
                                    {canManageInventory && (
                                        <th className="px-5 py-3 text-sm font-bold text-foreground">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedProducts.map((product) => {
                                    const stockNum = Number(product.stock_quantity) || 0;
                                    const reorderNum = Number(product.reorder_level) || 0;
                                    const maxStockNum = Number(product.max_stock_level) || 0;
                                    const status = getStockStatus(stockNum, reorderNum, maxStockNum);
                                    const isSelected = selectedIds.includes(product.product_id);
                                    const rawUnit = product.unit_of_measure ?? 'pcs';
                                    const unit = (!rawUnit || rawUnit === 'kg' || rawUnit === 'pieces') ? 'pcs' : rawUnit;

                                    return (
                                        <tr
                                            key={product.product_id}
                                            className="group rounded-xl border border-border/70 bg-card shadow-xs transition-shadow hover:shadow-md"
                                        >
                                            {/* Raw Material Details */}
                                            <td className="rounded-l-xl border-y border-l border-border/70 p-5 align-middle">
                                                <div className="flex items-center gap-3.5">
                                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/60 overflow-hidden shadow-xs">
                                                        {product.product_image ? (
                                                            <img
                                                                src={product.product_image}
                                                                alt={product.name}
                                                                className="size-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLElement).style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <FlaskConical className="size-5 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="text-base font-bold text-foreground">{product.name}</p>
                                                            <span className="font-mono text-xs font-bold text-foreground bg-muted/80 border border-border/80 px-2 py-0.5 rounded-md">
                                                                {product.sku}
                                                            </span>
                                                            {(product.recipes_count ?? 0) > 0 && (
                                                                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold bg-muted/60 text-muted-foreground border border-border/60">
                                                                    <Layers className="size-2.5" />
                                                                    in {product.recipes_count} BOMs
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td className="border-y border-border/70 p-5 align-middle">
                                                <p className="text-base font-semibold text-foreground">
                                                    {product.category?.name ?? 'Uncategorized'}
                                                </p>
                                                <p className="mt-0.5 text-xs text-muted-foreground">Raw Material</p>
                                            </td>

                                            {/* Stock on Hand */}
                                            <td className="border-y border-border/70 p-5 align-middle">
                                                <p className={`text-base font-bold font-mono ${stockNum <= 0 ? 'text-rose-600' : 'text-foreground'}`}>
                                                    {formatQuantity(product.stock_quantity, unit)}
                                                </p>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {reorderNum > 0 ? `Reorder: ${formatQuantity(reorderNum, unit)}` : 'No reorder threshold'}
                                                    {maxStockNum > 0 ? ` · Max: ${formatQuantity(maxStockNum, unit)}` : ''}
                                                </p>
                                                {product.expiration_date && (
                                                    <p
                                                        className={`mt-0.5 text-[11px] font-semibold ${
                                                            product.expiry_status === 'expired'
                                                                ? 'text-rose-600 dark:text-rose-400'
                                                                : product.expiry_status === 'expiring_soon'
                                                                  ? 'text-orange-600 dark:text-orange-400'
                                                                  : 'text-muted-foreground'
                                                        }`}
                                                    >
                                                        {product.expiry_status === 'expired'
                                                            ? `Expired: ${product.expiration_date}`
                                                            : product.expiry_status === 'expiring_soon'
                                                              ? `Expiring in ${product.days_until_expiry}d (${product.expiration_date})`
                                                              : `Exp: ${product.expiration_date}`}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Unit Rate */}
                                            <td className="border-y border-border/70 p-5 align-middle">
                                                <p className="text-base font-semibold text-foreground">
                                                    {formatCurrency(product.price)}
                                                </p>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    per {unit === 'pieces' || unit === 'pcs' || unit === 'kg' ? 'piece' : unit}
                                                </p>
                                            </td>

                                            {/* Status Badge */}
                                            <td className={`${!canManageInventory ? 'rounded-r-xl border-r' : ''} border-y border-border/70 p-5 align-middle`}>
                                                <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold sm:text-base ${status.pill}`}>
                                                    {status.label}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            {canManageInventory && (
                                                <td className="rounded-r-xl border-y border-r border-border/70 p-5 align-middle">
                                                    <div className="flex items-center gap-2 min-w-[180px]">
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => openEditModal(product)}
                                                            className="h-9 justify-start rounded-md bg-muted/60 px-3 text-xs font-semibold hover:bg-muted"
                                                        >
                                                            <Pencil className="mr-1.5 h-4 w-4 text-muted-foreground shrink-0" />
                                                            <span className="whitespace-nowrap">Edit</span>
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => openDeleteModal(product)}
                                                            className="h-9 justify-start rounded-md bg-muted/60 px-3 text-xs font-semibold text-rose-600 hover:bg-muted hover:text-rose-700 dark:text-rose-400"
                                                        >
                                                            <Trash2 className="mr-1.5 h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                                                            <span className="whitespace-nowrap">Delete</span>
                                                        </Button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination footer */}
                {sortedProducts.length > 0 && (
                    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border/70 bg-card px-5 py-3 shadow-xs sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
                        <span>
                            Showing{' '}
                            <strong className="font-semibold text-foreground">
                                {Math.min(sortedProducts.length, (currentPage - 1) * pageSize + 1)}
                            </strong>
                            –
                            <strong className="font-semibold text-foreground">
                                {Math.min(sortedProducts.length, currentPage * pageSize)}
                            </strong>{' '}
                            of{' '}
                            <strong className="font-semibold text-foreground">
                                {sortedProducts.length}
                            </strong>{' '}
                            materials
                        </span>

                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage <= 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="h-8 rounded-lg border-border/80 px-3 text-xs font-semibold"
                            >
                                <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Prev
                            </Button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .map((page, i, arr) => (
                                    <div key={page} className="flex items-center">
                                        {arr[i - 1] && page - arr[i - 1] > 1 && (
                                            <span className="px-1 text-muted-foreground">…</span>
                                        )}
                                        <Button
                                            variant={currentPage === page ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setCurrentPage(page)}
                                            className={`h-8 w-8 rounded-lg p-0 text-xs font-semibold ${currentPage === page ? 'bg-[#3b5de7] text-white hover:bg-[#2f4bc9]' : 'border-border/80'}`}
                                        >
                                            {page}
                                        </Button>
                                    </div>
                                ))}

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className="h-8 rounded-lg border-border/80 px-3 text-xs font-semibold"
                            >
                                Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── MODALS (Product Controller & Admin only) ── */}
            {canManageInventory && (
                <>
                    {/* ── MODAL: Add ── */}
                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogContent className="max-w-lg rounded-xl p-6 bg-card text-card-foreground border-border">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-bold text-foreground">Add Raw Material</DialogTitle>
                                <DialogDescription className="text-sm text-muted-foreground">
                                    Register a new formulation ingredient, powder, or botanical extract into factory inventory.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateProduct} className="space-y-4 py-2">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="create-name" className="text-xs font-semibold text-foreground">
                                            Raw Material Name <span className="text-muted-foreground">*</span>
                                        </Label>
                                        {form.data.name.length > 0 && (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                                                {form.data.name.trim().length >= 2 ? <CheckCircle2 className="size-3" /> : <X className="size-3" />}
                                                {form.data.name.trim().length >= 2 ? 'Accepted' : 'Min 2 chars'}
                                            </span>
                                        )}
                                    </div>
                                    <Input
                                        id="create-name"
                                        maxLength={150}
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        placeholder="e.g. R-BM DEXAN, R-NDC, R-Acai Berry Extract..."
                                        required
                                        className="rounded-lg"
                                    />
                                    {form.errors.name && <p className="text-xs text-destructive">{form.errors.name}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="create-sku" className="text-xs font-semibold text-foreground">
                                            SKU / Code
                                        </Label>
                                        <Input
                                            id="create-sku"
                                            value={nextSku}
                                            readOnly
                                            className="rounded-lg bg-muted/50 font-mono text-muted-foreground cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="create-category" className="text-xs font-semibold text-foreground">
                                            Category
                                        </Label>
                                        <Select
                                            value={form.data.category_id ? String(form.data.category_id) : 'none'}
                                            onValueChange={(v) => form.setData('category_id', v === 'none' ? '' : v)}
                                        >
                                            <SelectTrigger id="create-category" className="rounded-lg">
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {categories.map((c) => (
                                                    <SelectItem key={c.category_id} value={String(c.category_id)}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="create-unit" className="text-xs font-semibold text-foreground">
                                            Unit of Measure
                                        </Label>
                                        <Select
                                            value={form.data.unit_of_measure}
                                            onValueChange={(v) => form.setData('unit_of_measure', v)}
                                        >
                                            <SelectTrigger id="create-unit" className="rounded-lg">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pcs">pcs (Pieces)</SelectItem>
                                                <SelectItem value="kg">kg (Kilograms)</SelectItem>
                                                <SelectItem value="g">g (Grams)</SelectItem>
                                                <SelectItem value="L">L (Liters)</SelectItem>
                                                <SelectItem value="mL">mL (Milliliters)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="create-price" className="text-xs font-semibold text-foreground">
                                            Rate / Unit Cost (₱) <span className="text-muted-foreground">*</span>
                                        </Label>
                                        <Input
                                            id="create-price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={form.data.price}
                                            onChange={(e) => form.setData('price', e.target.value)}
                                            placeholder="69.12"
                                            required
                                            className="rounded-lg"
                                        />
                                        {form.errors.price && <p className="text-xs text-destructive">{form.errors.price}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="create-reorder" className="text-xs font-semibold text-foreground">
                                            Reorder Level
                                        </Label>
                                        <Input
                                            id="create-reorder"
                                            type="number"
                                            step="0.0001"
                                            min="0"
                                            value={form.data.reorder_level}
                                            onChange={(e) => form.setData('reorder_level', e.target.value)}
                                            placeholder="300.00"
                                            className="rounded-lg"
                                        />
                                        {form.errors.reorder_level && <p className="text-xs text-destructive">{form.errors.reorder_level}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="create-stock" className="text-xs font-semibold text-foreground">
                                            Initial Stock on Hand <span className="text-muted-foreground">*</span>
                                        </Label>
                                        <Input
                                            id="create-stock"
                                            type="number"
                                            step="0.0001"
                                            min="0"
                                            value={form.data.stock_quantity}
                                            onChange={(e) => form.setData('stock_quantity', e.target.value)}
                                            placeholder="409.52"
                                            required
                                            className="rounded-lg"
                                        />
                                        {form.errors.stock_quantity && (
                                            <p className="text-xs text-destructive">{form.errors.stock_quantity}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="create-max-stock" className="text-xs font-semibold text-foreground">
                                            Max Stock (Overstock Alert)
                                        </Label>
                                        <Input
                                            id="create-max-stock"
                                            type="number"
                                            step="0.0001"
                                            min="0"
                                            value={form.data.max_stock_level}
                                            onChange={(e) => form.setData('max_stock_level', e.target.value)}
                                            placeholder="e.g. 1000"
                                            className="rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="create-lot" className="text-xs font-semibold text-foreground">
                                            Batch / Lot #
                                        </Label>
                                        <Input
                                            id="create-lot"
                                            maxLength={80}
                                            value={form.data.batch_lot_number}
                                            onChange={(e) => form.setData('batch_lot_number', e.target.value)}
                                            placeholder="LOT-2026-01"
                                            className="rounded-lg"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="create-expiry" className="text-xs font-semibold text-foreground">
                                            Expiration Date
                                        </Label>
                                        <Input
                                            id="create-expiry"
                                            type="date"
                                            value={form.data.expiration_date}
                                            onChange={(e) => form.setData('expiration_date', e.target.value)}
                                            className="rounded-lg"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="create-lead" className="text-xs font-semibold text-foreground">
                                            Restock Lead (Days)
                                        </Label>
                                        <Input
                                            id="create-lead"
                                            type="number"
                                            min="1"
                                            max="365"
                                            value={form.data.restock_lead_days}
                                            onChange={(e) => form.setData('restock_lead_days', e.target.value)}
                                            className="rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="create-desc" className="text-xs font-semibold text-foreground">
                                        Description / Specifications
                                    </Label>
                                    <Input
                                        id="create-desc"
                                        maxLength={500}
                                        value={form.data.description}
                                        onChange={(e) => form.setData('description', e.target.value)}
                                        placeholder="Formulation specifications, active concentration, origin..."
                                        className="rounded-lg"
                                    />
                                    {form.errors.description && <p className="text-xs text-destructive">{form.errors.description}</p>}
                                </div>

                                <div className="flex items-center justify-end gap-3 border-t border-border/60 bg-muted/20 px-7 py-4.5 rounded-b-2xl">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="h-10 rounded-lg border-border/80 bg-background px-5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={form.processing}
                                        className="h-10 rounded-lg bg-[#3b5de7] hover:bg-[#2f4bc9] px-5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
                                    >
                                        {form.processing ? 'Saving...' : 'Add Raw Material'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* ── MODAL: Edit ── */}
                    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                        <DialogContent className="max-w-lg rounded-xl p-6 bg-card text-card-foreground border-border">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-bold text-foreground">Edit Raw Material</DialogTitle>
                                <DialogDescription className="text-sm text-muted-foreground">
                                    Update raw material details, unit cost rate, stock on hand, and reorder threshold.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleUpdateProduct} className="space-y-4 py-2">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="edit-name" className="text-xs font-semibold text-foreground">
                                            Raw Material Name <span className="text-muted-foreground">*</span>
                                        </Label>
                                        {form.data.name.length > 0 && (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                                                {form.data.name.trim().length >= 2 ? <CheckCircle2 className="size-3" /> : <X className="size-3" />}
                                                {form.data.name.trim().length >= 2 ? 'Accepted' : 'Min 2 chars'}
                                            </span>
                                        )}
                                    </div>
                                    <Input
                                        id="edit-name"
                                        maxLength={150}
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        required
                                        className="rounded-lg"
                                    />
                                    {form.errors.name && <p className="text-xs text-destructive">{form.errors.name}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-sku" className="text-xs font-semibold text-foreground">
                                            SKU / Code
                                        </Label>
                                        <Input
                                            id="edit-sku"
                                            value={activeProduct?.sku ?? ''}
                                            readOnly
                                            className="rounded-lg bg-muted/50 font-mono text-muted-foreground cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-category" className="text-xs font-semibold text-foreground">
                                            Category
                                        </Label>
                                        <Select
                                            value={form.data.category_id ? String(form.data.category_id) : 'none'}
                                            onValueChange={(v) => form.setData('category_id', v === 'none' ? '' : v)}
                                        >
                                            <SelectTrigger id="edit-category" className="rounded-lg">
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {categories.map((c) => (
                                                    <SelectItem key={c.category_id} value={String(c.category_id)}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-unit" className="text-xs font-semibold text-foreground">
                                            Unit of Measure
                                        </Label>
                                        <Select
                                            value={form.data.unit_of_measure}
                                            onValueChange={(v) => form.setData('unit_of_measure', v)}
                                        >
                                            <SelectTrigger id="edit-unit" className="rounded-lg">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pcs">pcs (Pieces)</SelectItem>
                                                <SelectItem value="kg">kg (Kilograms)</SelectItem>
                                                <SelectItem value="g">g (Grams)</SelectItem>
                                                <SelectItem value="L">L (Liters)</SelectItem>
                                                <SelectItem value="mL">mL (Milliliters)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-price" className="text-xs font-semibold text-foreground">
                                            Rate / Unit Cost (₱) <span className="text-muted-foreground">*</span>
                                        </Label>
                                        <Input
                                            id="edit-price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={form.data.price}
                                            onChange={(e) => form.setData('price', e.target.value)}
                                            required
                                            className="rounded-lg"
                                        />
                                        {form.errors.price && <p className="text-xs text-destructive">{form.errors.price}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-reorder" className="text-xs font-semibold text-foreground">
                                            Reorder Level
                                        </Label>
                                        <Input
                                            id="edit-reorder"
                                            type="number"
                                            step="0.0001"
                                            min="0"
                                            value={form.data.reorder_level}
                                            onChange={(e) => form.setData('reorder_level', e.target.value)}
                                            className="rounded-lg"
                                        />
                                        {form.errors.reorder_level && <p className="text-xs text-destructive">{form.errors.reorder_level}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-stock" className="text-xs font-semibold text-foreground">
                                            Stock on Hand <span className="text-muted-foreground">*</span>
                                        </Label>
                                        <Input
                                            id="edit-stock"
                                            type="number"
                                            step="0.0001"
                                            min="0"
                                            value={form.data.stock_quantity}
                                            onChange={(e) => form.setData('stock_quantity', e.target.value)}
                                            required
                                            className="rounded-lg"
                                        />
                                        {form.errors.stock_quantity && (
                                            <p className="text-xs text-destructive">{form.errors.stock_quantity}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-max-stock" className="text-xs font-semibold text-foreground">
                                            Max Stock (Overstock Alert)
                                        </Label>
                                        <Input
                                            id="edit-max-stock"
                                            type="number"
                                            step="0.0001"
                                            min="0"
                                            value={form.data.max_stock_level}
                                            onChange={(e) => form.setData('max_stock_level', e.target.value)}
                                            placeholder="e.g. 1000"
                                            className="rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-lot" className="text-xs font-semibold text-foreground">
                                            Batch / Lot #
                                        </Label>
                                        <Input
                                            id="edit-lot"
                                            maxLength={80}
                                            value={form.data.batch_lot_number}
                                            onChange={(e) => form.setData('batch_lot_number', e.target.value)}
                                            placeholder="LOT-2026-01"
                                            className="rounded-lg"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-expiry" className="text-xs font-semibold text-foreground">
                                            Expiration Date
                                        </Label>
                                        <Input
                                            id="edit-expiry"
                                            type="date"
                                            value={form.data.expiration_date}
                                            onChange={(e) => form.setData('expiration_date', e.target.value)}
                                            className="rounded-lg"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-lead" className="text-xs font-semibold text-foreground">
                                            Restock Lead (Days)
                                        </Label>
                                        <Input
                                            id="edit-lead"
                                            type="number"
                                            min="1"
                                            max="365"
                                            value={form.data.restock_lead_days}
                                            onChange={(e) => form.setData('restock_lead_days', e.target.value)}
                                            className="rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-desc" className="text-xs font-semibold text-foreground">
                                        Description / Specifications
                                    </Label>
                                    <Input
                                        id="edit-desc"
                                        maxLength={500}
                                        value={form.data.description}
                                        onChange={(e) => form.setData('description', e.target.value)}
                                        placeholder="Formulation specifications, active concentration..."
                                        className="rounded-lg"
                                    />
                                    {form.errors.description && <p className="text-xs text-destructive">{form.errors.description}</p>}
                                </div>

                                <div className="flex items-center justify-end gap-3 border-t border-border/60 bg-muted/20 px-7 py-4.5 rounded-b-2xl">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="h-10 rounded-lg border-border/80 bg-background px-5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={form.processing}
                                        className="h-10 rounded-lg bg-[#3b5de7] hover:bg-[#2f4bc9] px-5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
                                    >
                                        {form.processing ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* ── MODAL: Delete ── */}
                    <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                        <DialogContent className="max-w-md flex flex-col justify-between overflow-visible rounded-2xl border-border/70 p-0 shadow-2xl">
                            <div className="p-7 pb-4">
                                <DialogHeader className="space-y-1.5 text-left">
                                    <div className="size-11 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-2">
                                        <AlertCircle className="size-5" />
                                    </div>
                                    <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                                        Delete Raw Material
                                    </DialogTitle>
                                    <DialogDescription className="text-sm text-muted-foreground">
                                        Are you sure you want to delete{' '}
                                        <span className="font-semibold text-foreground">{activeProduct?.name}</span> (
                                        {activeProduct?.sku})? This cannot be undone.
                                    </DialogDescription>
                                </DialogHeader>
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-border/60 bg-muted/20 px-7 py-4.5 rounded-b-2xl">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="h-10 rounded-lg border-border/80 bg-background px-5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleDeleteProduct}
                                    className="h-10 rounded-lg bg-rose-600 hover:bg-rose-700 px-5 text-sm font-semibold text-white shadow-sm"
                                >
                                    Delete Material
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </AppLayout>
    );
}
