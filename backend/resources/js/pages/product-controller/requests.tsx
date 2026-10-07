import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

type Variant = { variant_id: number; name: string; sku?: string | null; is_available?: boolean; product_type?: { name: string } };
type Packaging = { packaging_id: number; name: string; category: string };
type Product = { product_type_id: number; name: string; variants: Variant[]; packaging_options: Packaging[] };
type Review = {
    product_request_review_id: number;
    status: string;
    request_notes: string | null;
    response_notes: string | null;
    reviewed_at: string | null;
    inquiry: {
        inquiry_id: number;
        client: { business_name: string; contact_person: string } | null;
        customizations: { packaging_type: string; serving_size: string | null; client_notes: string | null }[];
    };
    product_type: Product | null;
    requested_variant: Variant | null;
    suggested_variant: Variant | null;
    suggested_packaging: Packaging | null;
    requester: { full_name: string } | null;
};

const statusLabel: Record<string, string> = {
    pending: 'Awaiting review',
    available: 'Available',
    alternative: 'Alternative offered',
    unavailable: 'Unavailable',
};

export default function ProductRequests({ requests, productTypes }: { requests: Review[]; productTypes: Product[] }) {
    const [editing, setEditing] = useState<Review | null>(null);
    const form = useForm({ status: 'available', suggested_variant_id: '', suggested_packaging_id: '', response_notes: '' });
    const availableVariants = productTypes.flatMap((product) => product.variants.map((variant) => ({ ...variant, product_name: product.name })));
    const packaging = productTypes
        .flatMap((product) => product.packaging_options)
        .filter((item, index, all) => all.findIndex((other) => other.packaging_id === item.packaging_id) === index);
    const openReview = (review: Review) => {
        setEditing(review);
        form.setData({
            status: review.status === 'pending' ? 'available' : review.status,
            suggested_variant_id: review.suggested_variant?.variant_id?.toString() ?? '',
            suggested_packaging_id: review.suggested_packaging?.packaging_id?.toString() ?? '',
            response_notes: review.response_notes ?? '',
        });
    };
    const submit = () =>
        editing && form.patch(route('product-controller.requests.review', editing.product_request_review_id), { onSuccess: () => setEditing(null) });

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Product Controller', href: '/product-controller/dashboard' },
                { title: 'Product Requests', href: '/product-controller/requests' },
            ]}
        >
            <Head title="Product Requests" />
            <main className="bmanny-page">
                <div className="bmanny-page-inner space-y-5">
                    <section className="bmanny-page-header">
                        <p className="bmanny-page-eyebrow">Product Controller</p>
                        <h1 className="text-2xl font-semibold tracking-tight">Product request review</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Check requests forwarded by Sales, then confirm availability or send alternatives.
                        </p>
                    </section>
                    <Card className="bmanny-workspace overflow-hidden">
                        <CardHeader>
                            <CardTitle>Requests</CardTitle>
                            <CardDescription>{requests.filter((request) => request.status === 'pending').length} awaiting review</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {requests.length === 0 ? (
                                <p className="text-muted-foreground p-8 text-center text-sm">No product requests have been forwarded by Sales yet.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[60rem] text-left text-sm">
                                        <thead className="text-muted-foreground border-y text-xs uppercase">
                                            <tr>
                                                <th className="p-4">Inquiry</th>
                                                <th className="p-4">Requested configuration</th>
                                                <th className="p-4">Customer details</th>
                                                <th className="p-4">Sales notes</th>
                                                <th className="p-4">Decision</th>
                                                <th className="p-4" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {requests.map((review) => (
                                                <tr key={review.product_request_review_id} className="border-b">
                                                    <td className="p-4 font-medium">
                                                        #{review.inquiry.inquiry_id}
                                                        <div className="text-muted-foreground mt-1 text-xs">
                                                            {review.requester?.full_name ?? 'Sales Agent'}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        {review.product_type?.name ?? 'Product not selected'}
                                                        <div className="text-muted-foreground mt-1 text-xs">
                                                            {(review.requested_variant?.name ??
                                                                review.inquiry.customizations.map((item) => item.packaging_type).join(', ')) ||
                                                                '—'}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        {review.inquiry.client?.business_name ?? '—'}
                                                        <div className="text-muted-foreground mt-1 text-xs">
                                                            {review.inquiry.client?.contact_person ?? ''}
                                                        </div>
                                                    </td>
                                                    <td className="text-muted-foreground max-w-64 p-4 whitespace-pre-wrap">
                                                        {review.request_notes ?? '—'}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="bg-muted rounded-full px-2 py-1 text-xs">
                                                            {statusLabel[review.status] ?? review.status}
                                                        </span>
                                                        {review.response_notes && (
                                                            <div className="text-muted-foreground mt-2 max-w-56 text-xs">{review.response_notes}</div>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <Button size="sm" onClick={() => openReview(review)}>
                                                            {review.status === 'pending' ? 'Review' : 'Update response'}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    {editing && (
                        <Card className="bmanny-workspace">
                            <CardHeader>
                                <CardTitle>Respond to inquiry #{editing.inquiry.inquiry_id}</CardTitle>
                                <CardDescription>Give Sales a clear availability decision before a quotation is prepared.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>Availability decision</Label>
                                    <Select value={form.data.status} onValueChange={(value) => form.setData('status', value)}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="available">Available as requested</SelectItem>
                                            <SelectItem value="alternative">Offer an alternative</SelectItem>
                                            <SelectItem value="unavailable">Unavailable</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Suggested variant (optional)</Label>
                                    <Select
                                        value={form.data.suggested_variant_id || 'none'}
                                        onValueChange={(value) => form.setData('suggested_variant_id', value === 'none' ? '' : value)}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="No variant suggestion" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No variant suggestion</SelectItem>
                                            {availableVariants.map((variant) => (
                                                <SelectItem key={variant.variant_id} value={String(variant.variant_id)}>
                                                    {variant.product_name} — {variant.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Suggested packaging / label (optional)</Label>
                                    <Select
                                        value={form.data.suggested_packaging_id || 'none'}
                                        onValueChange={(value) => form.setData('suggested_packaging_id', value === 'none' ? '' : value)}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="No packaging suggestion" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No packaging suggestion</SelectItem>
                                            {packaging.map((option) => (
                                                <SelectItem key={option.packaging_id} value={String(option.packaging_id)}>
                                                    {option.category} — {option.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="sm:col-span-2">
                                    <Label>Response to Sales</Label>
                                    <textarea
                                        className="mt-1 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={form.data.response_notes}
                                        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => form.setData('response_notes', event.target.value)}
                                        placeholder="State availability, limits, or why the alternative is recommended."
                                    />
                                    {form.errors.response_notes && <p className="text-destructive mt-1 text-xs">{form.errors.response_notes}</p>}
                                </div>
                                <div className="flex gap-2 sm:col-span-2">
                                    <Button onClick={submit} disabled={form.processing}>
                                        Send response
                                    </Button>
                                    <Button variant="outline" onClick={() => setEditing(null)}>
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </AppLayout>
    );
}
