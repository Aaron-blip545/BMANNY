import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { PackageSearch } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Products', href: '/products' }];

// Matches the existing Product model and the props currently supplied by
// ProductPageController. No additional data is requested for this UI.
interface Product {
    product_id: number;
    category_id: number | null;
    name: string;
    sku: string;
    description: string | null;
    price: string;
    stock_quantity: number;
    product_image: string | null;
    category?: { category_id: number; name: string } | null;
}

interface Props {
    products: Product[];
    error: string | null;
}

const summaryCards = [
    { label: 'Total Products', value: (products: Product[]) => products.length, detail: 'All products in the system' },
    { label: 'Available Products', value: () => '—', detail: 'Availability is not available yet' },
    { label: 'Product Configurations', value: () => '—', detail: 'Configuration data is not available yet' },
    { label: 'MOQ Attention', value: () => '—', detail: 'MOQ data is not available yet' },
];

function formatPrice(value: string) {
    const amount = Number(value);

    return Number.isFinite(amount)
        ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount)
        : value;
}

export default function ProductsIndex({ products, error }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />

            <main className="min-h-full bg-background p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl">
                    <header className="mb-6">
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Products</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            View and monitor products available in the system.
                        </p>
                    </header>

                    <section aria-label="Product summary" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {summaryCards.map((card) => (
                            <Card key={card.label} className="rounded-xl border-border bg-card shadow-sm">
                                <CardContent className="p-5">
                                    <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                                    <p className="mt-2 text-2xl font-semibold tracking-tight text-card-foreground">
                                        {card.value(products)}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </section>

                    <section aria-label="Product catalogue controls" className="mb-4 rounded-xl border border-border bg-card px-4 py-3 sm:px-5">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-medium text-foreground">Product catalogue</p>
                            <p className="text-xs text-muted-foreground">Search and filters are not available yet.</p>
                        </div>
                    </section>

                    {error ? (
                        <Card className="rounded-xl border-border bg-card shadow-sm">
                            <CardContent className="p-5 text-sm text-muted-foreground">
                                We couldn&apos;t load products right now. Please try again.
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="overflow-hidden rounded-xl border-border bg-card shadow-sm">
                            {products.length === 0 ? (
                                <CardContent className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
                                    <PackageSearch className="mb-3 size-8 text-muted-foreground/60" aria-hidden="true" />
                                    <h2 className="text-sm font-semibold text-foreground">No products available</h2>
                                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                        Products will appear here once they are added to the system.
                                    </p>
                                </CardContent>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[760px] text-left text-sm">
                                        <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                                            <tr>
                                                <th className="px-5 py-3.5 font-medium">Product</th>
                                                <th className="px-5 py-3.5 font-medium">SKU</th>
                                                <th className="px-5 py-3.5 font-medium">Category</th>
                                                <th className="px-5 py-3.5 text-right font-medium">Price</th>
                                                <th className="px-5 py-3.5 text-right font-medium">Stock quantity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.map((product) => (
                                                <tr key={product.product_id} className="border-b border-border/60 last:border-0">
                                                    <td className="px-5 py-4">
                                                        <p className="font-medium text-foreground">{product.name}</p>
                                                        {product.description && (
                                                            <p className="mt-1 max-w-sm truncate text-xs text-muted-foreground">
                                                                {product.description}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{product.sku}</td>
                                                    <td className="px-5 py-4 text-muted-foreground">{product.category?.name ?? '—'}</td>
                                                    <td className="px-5 py-4 text-right font-medium text-foreground">{formatPrice(product.price)}</td>
                                                    <td className="px-5 py-4 text-right text-muted-foreground">{product.stock_quantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            </main>
        </AppLayout>
    );
}
