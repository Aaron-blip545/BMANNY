import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Products', href: '/products' }];

// Shape of what backend's Product::with('category')->get() actually returns -
// see backend/app/Models/Product.php and Category.php for the source of truth.
interface Product {
    product_id: number;
    name: string;
    sku: string;
    description: string | null;
    price: string;
    stock_quantity: number;
    category: { category_id: number; name: string } | null;
}

interface Props {
    products: Product[];
    error: string | null;
}

export default function ProductsIndex({ products, error }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />

            <main className="min-h-full bg-slate-50/70 p-4 sm:p-6 lg:p-8 dark:bg-background">
                <div className="mx-auto max-w-7xl">
                    <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-950 dark:text-foreground">Products</h1>
                    <p className="mb-6 text-sm text-muted-foreground">
                        This list is fetched live from the backend API (<code>GET /api/products</code>) — nothing here lives in
                        frontend-web's own database.
                    </p>

                    {error && (
                        <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
                            <CardContent className="p-4 text-sm text-red-700 dark:text-red-400">
                                {error} Make sure <code>backend</code> is running (<code>php artisan serve</code>) and that{' '}
                                <code>BACKEND_API_URL</code> in frontend-web's <code>.env</code> points at it.
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-slate-200/80 shadow-sm dark:border-border">
                        <CardContent className="p-0">
                            {products.length === 0 && !error ? (
                                <p className="p-8 text-center text-sm text-muted-foreground">
                                    No products yet — add one via backend's <code>POST /api/products</code>.
                                </p>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-slate-200 text-xs text-muted-foreground dark:border-border">
                                        <tr>
                                            <th className="p-4 font-medium">Name</th>
                                            <th className="p-4 font-medium">SKU</th>
                                            <th className="p-4 font-medium">Category</th>
                                            <th className="p-4 font-medium">Price</th>
                                            <th className="p-4 font-medium">Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((product) => (
                                            <tr key={product.product_id} className="border-b border-slate-100 last:border-0 dark:border-border/50">
                                                <td className="p-4 font-medium text-slate-950 dark:text-foreground">{product.name}</td>
                                                <td className="p-4 text-muted-foreground">{product.sku}</td>
                                                <td className="p-4 text-muted-foreground">{product.category?.name ?? '—'}</td>
                                                <td className="p-4 text-muted-foreground">{product.price}</td>
                                                <td className="p-4 text-muted-foreground">{product.stock_quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </AppLayout>
    );
}
