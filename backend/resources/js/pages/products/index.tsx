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
import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    Archive,
    ArrowUpDown,
    CircleCheck,
    CircleX,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Clock,
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
    stock_quantity: number;
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

type SortField = 'name' | 'sku' | 'category' | 'stock' | 'price' | 'status';
type SortOrder = 'asc' | 'desc';

function formatCurrency(value: string | number) {
    const amount = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(amount)) return '₱0';
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

function getStockStatus(stock: number) {
    if (stock <= 0) {
        return {
            label: 'Out of Stock',
            dotClass: 'bg-rose-500',
            textClass: 'text-rose-500 dark:text-rose-400',
        };
    }
    if (stock <= 10) {
        return {
            label: 'Low Stock',
            dotClass: 'bg-amber-500',
            textClass: 'text-amber-500 dark:text-amber-400',
        };
    }
    return {
        label: 'In Stock',
        dotClass: 'bg-emerald-500',
        textClass: 'text-emerald-500 dark:text-emerald-400',
    };
}

export default function ProductsIndex({ products = [], categories = [], error }: Props) {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [activeProduct, setActiveProduct] = useState<Product | null>(null);

    const form = useForm({
        name: '',
        sku: '',
        category_id: '' as string | number,
        price: '',
        stock_quantity: 0,
        description: '',
        product_image: '',
    });

    const metrics = useMemo(() => {
        let inStock = 0;
        let lowStock = 0;
        let outOfStock = 0;
        for (const p of products) {
            const s = Number(p.stock_quantity) || 0;
            if (s <= 0) outOfStock++;
            else if (s <= 10) lowStock++;
            else inStock++;
        }
        return { total: products.length, inStock, lowStock, outOfStock };
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
                if (statusFilter === 'in_stock' && s <= 10) return false;
                if (statusFilter === 'low_stock' && (s <= 0 || s > 10)) return false;
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
                case 'price':
                    av = parseFloat(String(a.price)) || 0;
                    bv = parseFloat(String(b.price)) || 0;
                    break;
                case 'status': {
                    const w = (p: Product) => {
                        const s = Number(p.stock_quantity) || 0;
                        return s <= 0 ? 0 : s <= 10 ? 1 : 2;
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
            stock_quantity: product.stock_quantity,
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
                {/* ─── Header ────────────────────────────────────────────── */}
                <header className="bmanny-page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="bmanny-page-eyebrow">Inventory Workspace</p>
                        <h1 className="text-2xl font-semibold tracking-tight">Raw Materials</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Track flavors, packaging &amp; container stock for product customization.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" type="button">
                            <Archive className="mr-2 h-4 w-4" />
                            Archived materials
                        </Button>
                        <Button id="add-material-btn" type="button" onClick={openAddModal}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Material
                        </Button>
                    </div>
                </header>

                {/* ─── 4 Metric Cards (BmannyMetricCard) ──────────────────── */}
                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <BmannyMetricCard
                        label="TOTAL"
                        value={metrics.total}
                        description="All raw materials"
                        icon={ClipboardList}
                        accent="blue"
                    />
                    <BmannyMetricCard
                        label="IN STOCK"
                        value={metrics.inStock}
                        description="Available for use"
                        icon={Clock}
                        accent="gold"
                    />
                    <BmannyMetricCard
                        label="LOW STOCK"
                        value={metrics.lowStock}
                        description="Needs restocking soon"
                        icon={CircleCheck}
                        accent="green"
                    />
                    <BmannyMetricCard
                        label="OUT OF STOCK"
                        value={metrics.outOfStock}
                        description="Currently unavailable"
                        icon={CircleX}
                        accent="navy"
                    />
                </div>

                {/* ─── Search & Filter Controls Bar ──────────────────────── */}
                <div className="bmanny-workspace mb-4 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-sm font-medium text-foreground">
                        {sortedProducts.length} of {products.length} materials
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
                                placeholder="Search material, SKU…"
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
                            <option value="in_stock">In Stock</option>
                            <option value="low_stock">Low Stock</option>
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
                <Card className="bmanny-workspace overflow-hidden">
                    <CardContent className="p-0">
                        {error ? (
                            <div className="py-16 text-center text-destructive">
                                <AlertTriangle className="mx-auto mb-2 size-8 opacity-80" />
                                <p className="text-sm font-medium">Failed to load inventory. Please refresh.</p>
                            </div>
                        ) : sortedProducts.length === 0 ? (
                            <div className="bmanny-empty-state py-16 text-muted-foreground">
                                <PackageSearch className="mb-3 size-10" />
                                <h2 className="text-base font-semibold text-foreground">
                                    {products.length === 0 ? 'No materials in inventory' : 'No matching materials found'}
                                </h2>
                                <p className="mt-1 text-sm max-w-sm">
                                    {products.length === 0
                                        ? 'Get started by adding your first raw material.'
                                        : 'Try adjusting your search or filters.'}
                                </p>
                                {products.length === 0 && (
                                    <Button onClick={openAddModal} className="mt-4">
                                        <Plus className="mr-2 h-4 w-4" /> Add Material
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                                        <tr>
                                            <th className="w-12 p-4 text-center">
                                                <Checkbox
                                                    checked={isAllSelected}
                                                    onCheckedChange={toggleSelectAll}
                                                    aria-label="Select all"
                                                />
                                            </th>
                                            <th className="p-4 font-medium">#</th>
                                            {([
                                                { label: 'MATERIAL', field: 'name' as SortField },
                                                { label: 'SKU', field: 'sku' as SortField },
                                                { label: 'TYPE', field: 'category' as SortField },
                                                { label: 'STOCK', field: 'stock' as SortField },
                                                { label: 'UNIT COST', field: 'price' as SortField },
                                                { label: 'STATUS', field: 'status' as SortField },
                                            ] as { label: string; field: SortField }[]).map((col) => (
                                                <th key={col.label} className="p-4 font-medium">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSort(col.field)}
                                                        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                                                    >
                                                        {col.label}
                                                        <ArrowUpDown className="size-3 opacity-50" />
                                                    </button>
                                                </th>
                                            ))}
                                            <th className="p-4 font-medium text-center">ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {paginatedProducts.map((product, idx) => {
                                            const status = getStockStatus(Number(product.stock_quantity) || 0);
                                            const isSelected = selectedIds.includes(product.product_id);
                                            const rowNum = (currentPage - 1) * pageSize + idx + 1;

                                            return (
                                                <tr
                                                    key={product.product_id}
                                                    className={`transition-colors hover:bg-muted/50 ${
                                                        isSelected ? 'bg-muted/70' : ''
                                                    }`}
                                                >
                                                    {/* Checkbox */}
                                                    <td className="p-4 text-center">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => toggleSelectOne(product.product_id)}
                                                            aria-label={`Select ${product.name}`}
                                                        />
                                                    </td>

                                                    {/* # */}
                                                    <td className="p-4 font-mono text-xs text-muted-foreground">
                                                        #{rowNum}
                                                    </td>

                                                    {/* Material */}
                                                    <td className="p-4 font-medium text-foreground">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60 overflow-hidden">
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
                                                                    <Package className="size-4 text-muted-foreground" />
                                                                )}
                                                            </div>
                                                            <span className="font-semibold text-foreground">
                                                                {product.name}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* SKU */}
                                                    <td className="p-4 font-mono text-xs text-muted-foreground">
                                                        {product.sku}
                                                    </td>

                                                    {/* Type */}
                                                    <td className="p-4">
                                                        {product.category?.name ? (
                                                            <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                                                {product.category.name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">—</span>
                                                        )}
                                                    </td>

                                                    {/* Stock */}
                                                    <td className="p-4 font-medium text-foreground">
                                                        {product.stock_quantity}
                                                    </td>

                                                    {/* Price */}
                                                    <td className="p-4 text-muted-foreground font-medium">
                                                        {formatCurrency(product.price)}
                                                    </td>

                                                    {/* Status */}
                                                    <td className="p-4">
                                                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${status.textClass}`}>
                                                            <span className={`size-1.5 rounded-full ${status.dotClass}`} />
                                                            {status.label}
                                                        </span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="p-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openEditModal(product)}
                                                            >
                                                                <Pencil className="mr-1 h-3.5 w-3.5" />
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openDeleteModal(product)}
                                                                className="text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="mr-1 h-3.5 w-3.5" />
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

            {/* ── MODAL: Add ── */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-lg rounded-xl p-6 bg-card text-card-foreground border-border">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-foreground">Add Raw Material</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Enter material specs and initial stock levels.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateProduct} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="create-name" className="text-xs font-semibold text-foreground">
                                Material Name <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="create-name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                placeholder="e.g. Vanilla, Hazelnut, Pouch, Bottle..."
                                required
                                className="rounded-lg"
                            />
                            {form.errors.name && <p className="text-xs text-rose-500">{form.errors.name}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="create-sku" className="text-xs font-semibold text-foreground">
                                    SKU <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="create-sku"
                                    value={form.data.sku}
                                    onChange={(e) => form.setData('sku', e.target.value)}
                                    placeholder="e.g. FLV-VAN-001"
                                    required
                                    className="rounded-lg"
                                />
                                {form.errors.sku && <p className="text-xs text-rose-500">{form.errors.sku}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="create-category" className="text-xs font-semibold text-foreground">
                                    Category / Type
                                </Label>
                                <Select
                                    value={form.data.category_id ? String(form.data.category_id) : 'none'}
                                    onValueChange={(v) => form.setData('category_id', v === 'none' ? '' : v)}
                                >
                                    <SelectTrigger id="create-category" className="rounded-lg">
                                        <SelectValue placeholder="Select" />
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
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="create-price" className="text-xs font-semibold text-foreground">
                                    Unit Cost (₱) <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="create-price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.data.price}
                                    onChange={(e) => form.setData('price', e.target.value)}
                                    placeholder="45.00"
                                    required
                                    className="rounded-lg"
                                />
                                {form.errors.price && <p className="text-xs text-rose-500">{form.errors.price}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="create-stock" className="text-xs font-semibold text-foreground">
                                    Stock Quantity <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="create-stock"
                                    type="number"
                                    min="0"
                                    value={form.data.stock_quantity}
                                    onChange={(e) => form.setData('stock_quantity', parseInt(e.target.value) || 0)}
                                    placeholder="150"
                                    required
                                    className="rounded-lg"
                                />
                                {form.errors.stock_quantity && (
                                    <p className="text-xs text-rose-500">{form.errors.stock_quantity}</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="create-image" className="text-xs font-semibold text-foreground">
                                Image URL (Optional)
                            </Label>
                            <Input
                                id="create-image"
                                value={form.data.product_image}
                                onChange={(e) => form.setData('product_image', e.target.value)}
                                placeholder="https://example.com/image.jpg"
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
                                {form.processing ? 'Saving...' : 'Add Material'}
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
                            Update material details, pricing, and stock quantity.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateProduct} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-name" className="text-xs font-semibold text-foreground">
                                Material Name <span className="text-rose-500">*</span>
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
                                    SKU <span className="text-rose-500">*</span>
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
                                    Category / Type
                                </Label>
                                <Select
                                    value={form.data.category_id ? String(form.data.category_id) : 'none'}
                                    onValueChange={(v) => form.setData('category_id', v === 'none' ? '' : v)}
                                >
                                    <SelectTrigger id="edit-category" className="rounded-lg">
                                        <SelectValue placeholder="Select" />
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
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-price" className="text-xs font-semibold text-foreground">
                                    Unit Cost (₱) <span className="text-rose-500">*</span>
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
                                <Label htmlFor="edit-stock" className="text-xs font-semibold text-foreground">
                                    Stock Quantity <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="edit-stock"
                                    type="number"
                                    min="0"
                                    value={form.data.stock_quantity}
                                    onChange={(e) => form.setData('stock_quantity', parseInt(e.target.value) || 0)}
                                    required
                                    className="rounded-lg"
                                />
                                {form.errors.stock_quantity && (
                                    <p className="text-xs text-rose-500">{form.errors.stock_quantity}</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-image" className="text-xs font-semibold text-foreground">
                                Image URL (Optional)
                            </Label>
                            <Input
                                id="edit-image"
                                value={form.data.product_image}
                                onChange={(e) => form.setData('product_image', e.target.value)}
                                placeholder="https://example.com/image.jpg"
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
        </AppLayout>
    );
}
