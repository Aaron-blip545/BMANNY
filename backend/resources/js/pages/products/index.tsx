import { BmannyMetricCard } from '@/components/bmanny-metric-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    Archive,
    ArrowUpDown,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    CircleCheck,
    CircleX,
    ClipboardList,
    FlaskConical,
    Layers,
    Package,
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
    description: string | null;
    price: string | number;
    stock_quantity: number | string;
    reorder_level?: number | string;
    unit_of_measure?: string;
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

function formatQuantity(value: string | number, unit: string = 'kg') {
    const qty = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(qty)) return `0 ${unit}`;
    const formatted = parseFloat(qty.toFixed(4)).toString();
    return `${formatted} ${unit}`;
}

function getStockStatus(stock: number, reorder: number = 0) {
    if (stock <= 0) {
        return {
            label: 'Out of Stock',
            badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
            dotClass: 'bg-rose-500',
            textClass: 'text-rose-500 dark:text-rose-400',
        };
    }
    if (reorder > 0 && stock <= reorder) {
        return {
            label: 'Reorder Alert',
            badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
            dotClass: 'bg-amber-500',
            textClass: 'text-amber-500 dark:text-amber-400',
        };
    }
    return {
        label: 'In Stock',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        dotClass: 'bg-emerald-500',
        textClass: 'text-emerald-500 dark:text-emerald-400',
    };
}

export default function ProductsIndex({ products = [], categories = [], error }: Props) {
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
        sku: '',
        category_id: '' as string | number,
        price: '',
        stock_quantity: '',
        reorder_level: '',
        unit_of_measure: 'kg',
        description: '',
        product_image: '',
    });

    const metrics = useMemo(() => {
        let inStock = 0;
        let reorderNeeded = 0;
        let outOfStock = 0;
        for (const p of products) {
            const s = Number(p.stock_quantity) || 0;
            const r = Number(p.reorder_level) || 0;
            if (s <= 0) outOfStock++;
            else if (r > 0 && s <= r) reorderNeeded++;
            else inStock++;
        }
        return { total: products.length, inStock, reorderNeeded, outOfStock };
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
                const isReorder = r > 0 && s <= r;

                if (statusFilter === 'in_stock' && (s <= 0 || isReorder)) return false;
                if (statusFilter === 'reorder' && (!isReorder || s <= 0)) return false;
                if (statusFilter === 'out_of_stock' && s > 0) return false;
            }
            if (!term) return true;
            return (
                p.name?.toLowerCase().includes(term) ||
                p.sku?.toLowerCase().includes(term) ||
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
            sku: '',
            category_id: '',
            price: '',
            stock_quantity: '',
            reorder_level: '',
            unit_of_measure: 'kg',
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
            sku: product.sku,
            category_id: product.category_id ? String(product.category_id) : '',
            price: String(product.price),
            stock_quantity: String(product.stock_quantity),
            reorder_level: product.reorder_level ? String(product.reorder_level) : '0',
            unit_of_measure: product.unit_of_measure ?? 'kg',
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

            <div className="bmanny-page space-y-6">
                {/* ─── Header ────────────────────────────────────────────── */}
                <header className="bmanny-page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                <FlaskConical className="size-3.5" /> Factory Inventory
                            </span>
                            <span className="text-xs text-muted-foreground">Location: CDO Main Factory</span>
                        </div>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                            Raw Materials Inventory
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Track formulation ingredients, extracts, powders, and reorder levels for manufacturing.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {canManageInventory && (
                            <Button id="add-material-btn" type="button" onClick={openAddModal} className="shadow-sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Raw Material
                            </Button>
                        )}
                    </div>
                </header>

                {/* ─── 4 Metric Cards (BmannyMetricCard) ──────────────────── */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <BmannyMetricCard
                        label="TOTAL MATERIALS"
                        value={metrics.total}
                        description="Active raw materials"
                        icon={ClipboardList}
                        accent="blue"
                    />
                    <BmannyMetricCard
                        label="IN STOCK"
                        value={metrics.inStock}
                        description="Above reorder level"
                        icon={CircleCheck}
                        accent="green"
                    />
                    <BmannyMetricCard
                        label="REORDER ALERT"
                        value={metrics.reorderNeeded}
                        description="At or below reorder level"
                        icon={CircleAlert}
                        accent="gold"
                    />
                    <BmannyMetricCard
                        label="OUT OF STOCK"
                        value={metrics.outOfStock}
                        description="Zero stock on hand"
                        icon={CircleX}
                        accent="navy"
                    />
                </div>

                {/* ─── Search & Filter Controls Bar ──────────────────────── */}
                <div className="bmanny-workspace flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-sm font-medium text-foreground">
                        {sortedProducts.length} of {products.length} raw materials
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search raw material, SKU (R-)..."
                                className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-72"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Category filter */}
                        <select
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="all">All Categories</option>
                            <option value="uncategorized">Uncategorized</option>
                            {categories.map((c) => (
                                <option key={c.category_id} value={String(c.category_id)}>
                                    {c.name}
                                </option>
                            ))}
                        </select>

                        {/* Status filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="all">All Statuses</option>
                            <option value="in_stock">In Stock (Healthy)</option>
                            <option value="reorder">Reorder Alert (Low)</option>
                            <option value="out_of_stock">Out of Stock</option>
                        </select>

                        {(search || categoryFilter !== 'all' || statusFilter !== 'all') && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearch('');
                                    setCategoryFilter('all');
                                    setStatusFilter('all');
                                    setCurrentPage(1);
                                }}
                                className="text-xs text-muted-foreground hover:text-foreground"
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* ─── Table Card ────────────────────────────────────────── */}
                <Card className="bmanny-workspace overflow-hidden border shadow-sm">
                    <CardContent className="p-0">
                        {error ? (
                            <div className="py-16 text-center text-destructive">
                                <AlertTriangle className="mx-auto mb-2 size-8 opacity-80" />
                                <p className="text-sm font-medium">Failed to load inventory. Please refresh.</p>
                            </div>
                        ) : sortedProducts.length === 0 ? (
                            <div className="bmanny-empty-state py-16 text-muted-foreground text-center">
                                <PackageSearch className="mx-auto mb-3 size-10 opacity-70" />
                                <h2 className="text-base font-semibold text-foreground">
                                    {products.length === 0 ? 'No raw materials in inventory' : 'No matching materials found'}
                                </h2>
                                <p className="mt-1 text-sm max-w-sm mx-auto">
                                    {products.length === 0
                                        ? 'Start tracking ingredients, extracts, and base powders by adding your first raw material.'
                                        : 'Try adjusting your search query or filter settings.'}
                                </p>
                                {products.length === 0 && canManageInventory && (
                                    <Button onClick={openAddModal} className="mt-4">
                                        <Plus className="mr-2 h-4 w-4" /> Add Raw Material
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                                        <tr>
                                            {canManageInventory && (
                                                <th className="w-12 p-4 text-center">
                                                    <Checkbox
                                                        checked={isAllSelected}
                                                        onCheckedChange={toggleSelectAll}
                                                        aria-label="Select all"
                                                    />
                                                </th>
                                            )}
                                            <th className="p-4 font-medium">#</th>
                                            {([
                                                { label: 'RAW MATERIAL', field: 'name' as SortField },
                                                { label: 'SKU / CODE', field: 'sku' as SortField },
                                                { label: 'CATEGORY', field: 'category' as SortField },
                                                { label: 'STOCK ON HAND', field: 'stock' as SortField },
                                                { label: 'REORDER LEVEL', field: 'reorder' as SortField },
                                                { label: 'UNIT RATE (₱)', field: 'price' as SortField },
                                                { label: 'STATUS', field: 'status' as SortField },
                                            ] as { label: string; field: SortField }[]).map((col) => (
                                                <th key={col.label} className="p-4 font-medium">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSort(col.field)}
                                                        className="inline-flex items-center gap-1 hover:text-foreground transition-colors font-semibold"
                                                    >
                                                        {col.label}
                                                        <ArrowUpDown className="size-3 opacity-50" />
                                                    </button>
                                                </th>
                                            ))}
                                            {canManageInventory && (
                                                <th className="p-4 font-medium text-center">ACTION</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {paginatedProducts.map((product, idx) => {
                                            const stockNum = Number(product.stock_quantity) || 0;
                                            const reorderNum = Number(product.reorder_level) || 0;
                                            const status = getStockStatus(stockNum, reorderNum);
                                            const isSelected = selectedIds.includes(product.product_id);
                                            const rowNum = (currentPage - 1) * pageSize + idx + 1;
                                            const unit = product.unit_of_measure ?? 'kg';

                                            return (
                                                <tr
                                                    key={product.product_id}
                                                    className={`transition-colors hover:bg-muted/40 ${
                                                        isSelected ? 'bg-muted/60' : ''
                                                    }`}
                                                >
                                                    {/* Checkbox */}
                                                    {canManageInventory && (
                                                        <td className="p-4 text-center">
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={() => toggleSelectOne(product.product_id)}
                                                                aria-label={`Select ${product.name}`}
                                                            />
                                                        </td>
                                                    )}

                                                    {/* # */}
                                                    <td className="p-4 font-mono text-xs text-muted-foreground">
                                                        #{rowNum}
                                                    </td>

                                                    {/* Raw Material Name */}
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60 overflow-hidden shadow-xs">
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
                                                                    <FlaskConical className="size-4 text-primary/70" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-semibold text-foreground">
                                                                        {product.name}
                                                                    </span>
                                                                    {(product.recipes_count ?? 0) > 0 && (
                                                                        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[10px] font-medium bg-secondary text-secondary-foreground border">
                                                                            <Layers className="size-2.5 mr-0.5" />
                                                                            in {product.recipes_count} BOMs
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {product.description && (
                                                                    <p className="line-clamp-1 text-xs text-muted-foreground max-w-xs">
                                                                        {product.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* SKU */}
                                                    <td className="p-4 font-mono text-xs font-medium text-muted-foreground">
                                                        <span className="rounded bg-muted/60 px-1.5 py-0.5">
                                                            {product.sku}
                                                        </span>
                                                    </td>

                                                    {/* Category */}
                                                    <td className="p-4">
                                                        {product.category?.name ? (
                                                            <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                                                {product.category.name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">—</span>
                                                        )}
                                                    </td>

                                                    {/* Stock On Hand */}
                                                    <td className="p-4 font-mono font-semibold text-foreground">
                                                        <span className={stockNum <= 0 ? 'text-rose-500' : ''}>
                                                            {formatQuantity(product.stock_quantity, unit)}
                                                        </span>
                                                    </td>

                                                    {/* Reorder Level */}
                                                    <td className="p-4 font-mono text-xs text-muted-foreground">
                                                        {reorderNum > 0 ? (
                                                            formatQuantity(product.reorder_level ?? 0, unit)
                                                        ) : (
                                                            <span className="text-muted-foreground/60">—</span>
                                                        )}
                                                    </td>

                                                    {/* Rate / Cost */}
                                                    <td className="p-4 text-muted-foreground font-medium">
                                                        {formatCurrency(product.price)}
                                                        <span className="text-[11px] text-muted-foreground/70"> / {unit}</span>
                                                    </td>

                                                    {/* Status Badge */}
                                                    <td className="p-4">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.badgeClass}`}
                                                        >
                                                            <span className={`size-1.5 rounded-full ${status.dotClass}`} />
                                                            {status.label}
                                                        </span>
                                                    </td>

                                                    {/* Actions */}
                                                    {canManageInventory && (
                                                        <td className="p-4 text-center">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => openEditModal(product)}
                                                                    className="h-8 px-2.5 text-xs"
                                                                >
                                                                    <Pencil className="mr-1 h-3.5 w-3.5" />
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => openDeleteModal(product)}
                                                                    className="h-8 px-2.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                >
                                                                    <Trash2 className="size-3.5" />
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
                            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 text-xs text-muted-foreground">
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

                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage <= 1}
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        className="h-8 px-2.5 text-xs"
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
                                                    className="h-8 w-8 p-0 text-xs font-medium"
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
                                        className="h-8 px-2.5 text-xs"
                                    >
                                        Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
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
                                    <Label htmlFor="create-name" className="text-xs font-semibold text-foreground">
                                        Raw Material Name <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="create-name"
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        placeholder="e.g. R-BM DEXAN, R-NDC, R-Acai Berry Extract..."
                                        required
                                        className="rounded-lg"
                                    />
                                    {form.errors.name && <p className="text-xs text-rose-500">{form.errors.name}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="create-sku" className="text-xs font-semibold text-foreground">
                                            SKU / Code <span className="text-rose-500">*</span>
                                        </Label>
                                        <Input
                                            id="create-sku"
                                            value={form.data.sku}
                                            onChange={(e) => form.setData('sku', e.target.value)}
                                            placeholder="e.g. R-DEXAN-01"
                                            required
                                            className="rounded-lg"
                                        />
                                        {form.errors.sku && <p className="text-xs text-rose-500">{form.errors.sku}</p>}
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
                                                <SelectItem value="kg">kg (Kilograms)</SelectItem>
                                                <SelectItem value="g">g (Grams)</SelectItem>
                                                <SelectItem value="L">L (Liters)</SelectItem>
                                                <SelectItem value="mL">mL (Milliliters)</SelectItem>
                                                <SelectItem value="pcs">pcs (Pieces)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="create-price" className="text-xs font-semibold text-foreground">
                                            Rate / Unit Cost (₱) <span className="text-rose-500">*</span>
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
                                        {form.errors.price && <p className="text-xs text-rose-500">{form.errors.price}</p>}
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
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="create-stock" className="text-xs font-semibold text-foreground">
                                        Initial Stock on Hand <span className="text-rose-500">*</span>
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
                                        <p className="text-xs text-rose-500">{form.errors.stock_quantity}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="create-desc" className="text-xs font-semibold text-foreground">
                                        Description / Specifications
                                    </Label>
                                    <Input
                                        id="create-desc"
                                        value={form.data.description}
                                        onChange={(e) => form.setData('description', e.target.value)}
                                        placeholder="Formulation specifications, active concentration, origin..."
                                        className="rounded-lg"
                                    />
                                </div>

                                <DialogFooter className="pt-2 gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="rounded-lg"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={form.processing}
                                        className="rounded-lg"
                                    >
                                        {form.processing ? 'Saving...' : 'Add Raw Material'}
                                    </Button>
                                </DialogFooter>
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
                                    <Label htmlFor="edit-name" className="text-xs font-semibold text-foreground">
                                        Raw Material Name <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="edit-name"
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        required
                                        className="rounded-lg"
                                    />
                                    {form.errors.name && <p className="text-xs text-rose-500">{form.errors.name}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-sku" className="text-xs font-semibold text-foreground">
                                            SKU / Code <span className="text-rose-500">*</span>
                                        </Label>
                                        <Input
                                            id="edit-sku"
                                            value={form.data.sku}
                                            onChange={(e) => form.setData('sku', e.target.value)}
                                            required
                                            className="rounded-lg"
                                        />
                                        {form.errors.sku && <p className="text-xs text-rose-500">{form.errors.sku}</p>}
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
                                                <SelectItem value="kg">kg (Kilograms)</SelectItem>
                                                <SelectItem value="g">g (Grams)</SelectItem>
                                                <SelectItem value="L">L (Liters)</SelectItem>
                                                <SelectItem value="mL">mL (Milliliters)</SelectItem>
                                                <SelectItem value="pcs">pcs (Pieces)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-price" className="text-xs font-semibold text-foreground">
                                            Rate / Unit Cost (₱) <span className="text-rose-500">*</span>
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
                                        {form.errors.price && <p className="text-xs text-rose-500">{form.errors.price}</p>}
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
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-stock" className="text-xs font-semibold text-foreground">
                                        Stock on Hand <span className="text-rose-500">*</span>
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
                                        <p className="text-xs text-rose-500">{form.errors.stock_quantity}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-desc" className="text-xs font-semibold text-foreground">
                                        Description / Specifications
                                    </Label>
                                    <Input
                                        id="edit-desc"
                                        value={form.data.description}
                                        onChange={(e) => form.setData('description', e.target.value)}
                                        placeholder="Formulation specifications, active concentration..."
                                        className="rounded-lg"
                                    />
                                </div>

                                <DialogFooter className="pt-2 gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="rounded-lg"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={form.processing}
                                        className="rounded-lg"
                                    >
                                        {form.processing ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* ── MODAL: Delete ── */}
                    <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                        <DialogContent className="max-w-sm rounded-xl p-6 bg-card text-card-foreground border-border">
                            <DialogHeader>
                                <div className="size-11 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-3">
                                    <AlertCircle className="size-5" />
                                </div>
                                <DialogTitle className="text-base font-bold text-foreground">Delete Raw Material</DialogTitle>
                                <DialogDescription className="text-sm text-muted-foreground">
                                    Are you sure you want to delete{' '}
                                    <span className="font-semibold text-foreground">{activeProduct?.name}</span> (
                                    {activeProduct?.sku})? This cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="pt-3 gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="rounded-lg"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleDeleteProduct}
                                    className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
                                >
                                    Delete Material
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </AppLayout>
    );
}
