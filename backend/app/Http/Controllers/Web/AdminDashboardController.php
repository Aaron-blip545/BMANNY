<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Inquiry;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductionSchedule;
use App\Models\ProductRequestReview;
use App\Models\Quotation;
use App\Models\User;
use App\Services\AnalyticsService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminDashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/dashboard', [
            'stats' => [
                'users'     => User::count(),
                'inquiries' => Inquiry::count(),
                'orders'    => Order::count(),
                'products'  => Product::count(),
            ],
            'recentInquiries' => Inquiry::with('client')
                ->orderByDesc('created_at')
                ->limit(8)
                ->get()
                ->map(fn ($i) => [
                    'inquiry_id'          => $i->inquiry_id,
                    'status'              => $i->cancelled_at ? 'cancelled' : $i->status,
                    'created_at'          => $i->created_at,
                    'cancelled_at'        => $i->cancelled_at,
                    'cancellation_reason' => $i->cancellation_reason,
                    'client'              => $i->client ? ['business_name' => $i->client->business_name] : null,
                ]),
        ]);
    }

    /**
     * Role-appropriate Analytics workspace (Admin, Sales Agent, Order Manager, Product Controller).
     */
    public function analytics(Request $request, AnalyticsService $analytics): Response
    {
        $role = $request->user('web')?->role ?? 'admin';

        return Inertia::render('admin/analytics', [
            'role'      => $role,
            'analytics' => [
                'periods'          => $analytics->periods(),
                'salesPerformance' => in_array($role, ['admin', 'sales_agent'], true)
                    ? $analytics->salesPerformance()
                    : null,
                'lostLeads'        => in_array($role, ['admin', 'sales_agent', 'order_manager'], true)
                    ? $analytics->lostLeadsAnalytics()
                    : null,
                'topBuyers'        => in_array($role, ['admin', 'sales_agent'], true)
                    ? $analytics->topBuyers(8)
                    : [],
                'productDemand'    => in_array($role, ['admin', 'product_controller', 'sales_agent'], true)
                    ? $analytics->productDemandAnalytics()
                    : null,
                'production'       => in_array($role, ['admin', 'order_manager'], true)
                    ? $analytics->productionAndOrderAnalytics()
                    : null,
                'inventoryRisks'   => in_array($role, ['admin', 'order_manager', 'product_controller'], true)
                    ? $analytics->inventoryRiskAnalytics()
                    : null,
            ],
        ]);
    }

    /**
     * Role-appropriate Reports workspace (CSV & Printable PDF exports).
     */
    public function reports(Request $request, AnalyticsService $analytics): Response
    {
        $role = $request->user('web')?->role ?? 'admin';
        [$from, $to] = $this->reportRange($request);

        $inquiries = Inquiry::whereBetween('created_at', [$from, $to]);
        $quotations = Quotation::whereBetween('created_at', [$from, $to]);
        $orders = Order::whereBetween('created_at', [$from, $to]);
        $lostLeads = Inquiry::whereBetween('created_at', [$from, $to])
            ->where(fn ($q) => $q->whereNotNull('cancelled_at')->orWhereIn('status', ['cancelled', 'lost']));
        $productRequests = ProductRequestReview::whereBetween('created_at', [$from, $to]);
        $productionSchedules = ProductionSchedule::whereBetween('created_at', [$from, $to]);
        $reorders = Inquiry::whereBetween('created_at', [$from, $to])
            ->where(fn ($q) => $q->whereIn('inquiry_type', ['reorder_batch', 'packaging_replenishment'])
                ->orWhereNotNull('source_order_id')
                ->orWhereNotNull('packaging_balance_id'));

        $cancellationInsights = in_array($role, ['admin', 'sales_agent', 'order_manager'], true)
            ? $analytics->lostLeadsAnalytics($from, $to)
            : null;

        return Inertia::render('admin/reports', [
            'role'                 => $role,
            'canImport'            => $role === 'admin',
            'allowedReports'       => $this->allowedReportsForRole($role),
            'cancellationInsights' => $cancellationInsights,
            'filters'              => [
                'from' => $from->format('Y-m-d H:i'),
                'to'   => $to->format('Y-m-d H:i'),
            ],
            'summary'              => [
                'inquiries'       => $inquiries->count(),
                'quotations'      => $quotations->count(),
                'orders'          => $orders->count(),
                'orderValue'      => (float) (clone $orders)->where('status', '!=', 'cancelled')->sum('total_amount'),
                'lostLeads'       => $lostLeads->count(),
                'productRequests' => $productRequests->count(),
                'inventory'       => Product::count(),
                'production'      => $productionSchedules->count(),
                'reorders'        => $reorders->count(),
            ],
        ]);
    }

    public function exportReport(Request $request, string $report): StreamedResponse
    {
        $role = $request->user('web')?->role ?? '';
        abort_unless(in_array($report, $this->allowedReportsForRole($role), true), 403);

        [$from, $to] = $this->reportRange($request);
        $filename = "bmanny-{$report}-{$from->format('Y-m-d_Hi')}-to-{$to->format('Y-m-d_Hi')}.csv";

        return response()->streamDownload(function () use ($report, $from, $to) {
            $output = fopen('php://output', 'w');
            fwrite($output, "\xEF\xBB\xBF");

            match ($report) {
                'inquiries'        => $this->writeInquiryReport($output, $from, $to),
                'quotations'       => $this->writeQuotationReport($output, $from, $to),
                'orders'           => $this->writeOrderReport($output, $from, $to),
                'lost_leads'       => $this->writeLostLeadsReport($output, $from, $to),
                'product_requests' => $this->writeProductRequestsReport($output, $from, $to),
                'inventory'        => $this->writeInventoryReport($output),
                'production'       => $this->writeProductionReport($output, $from, $to),
                'reorders'         => $this->writeReordersReport($output, $from, $to),
                default            => abort(404),
            };

            fclose($output);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function exportPdf(Request $request, string $report): \Illuminate\View\View
    {
        $role = $request->user('web')?->role ?? '';
        $allowed = $this->allowedReportsForRole($role);
        if ($role === 'admin') {
            $allowed[] = 'summary';
        }
        abort_unless(in_array($report, $allowed, true), 403);

        [$from, $to] = $this->reportRange($request);

        $inquiries = Inquiry::with('client.user')->whereBetween('created_at', [$from, $to])->orderBy('inquiry_id');
        $quotations = Quotation::with('inquiry.client')->whereBetween('created_at', [$from, $to])->orderBy('quotation_id');
        $orders = Order::with(['client', 'latestProductionSchedule'])->whereBetween('created_at', [$from, $to])->orderBy('order_id');
        $lostLeads = Inquiry::with('client.user')
            ->whereBetween('created_at', [$from, $to])
            ->where(fn ($q) => $q->whereNotNull('cancelled_at')->orWhereIn('status', ['cancelled', 'lost']))
            ->orderByDesc('updated_at');
        $productRequests = ProductRequestReview::with(['inquiry.client', 'reviewer'])
            ->whereBetween('created_at', [$from, $to])
            ->orderByDesc('created_at');
        $inventory = Product::with('category')->orderBy('name');
        $production = ProductionSchedule::with(['order.client', 'order.deliveryBatches'])
            ->whereBetween('created_at', [$from, $to])
            ->orderBy('production_start_date');
        $reorders = Inquiry::with(['client', 'packagingBalance', 'quotation.order.latestProductionSchedule'])
            ->whereBetween('created_at', [$from, $to])
            ->where(fn ($q) => $q->whereIn('inquiry_type', ['reorder_batch', 'packaging_replenishment'])
                ->orWhereNotNull('source_order_id')
                ->orWhereNotNull('packaging_balance_id'))
            ->orderByDesc('created_at');

        $summary = [
            'inquiries'       => (clone $inquiries)->count(),
            'quotations'      => (clone $quotations)->count(),
            'orders'          => (clone $orders)->count(),
            'orderValue'      => (float) (clone $orders)->where('status', '!=', 'cancelled')->sum('total_amount'),
            'lostLeads'       => (clone $lostLeads)->count(),
            'productRequests' => (clone $productRequests)->count(),
            'inventory'       => Product::count(),
            'production'      => (clone $production)->count(),
            'reorders'        => (clone $reorders)->count(),
        ];

        $items = match ($report) {
            'inquiries'        => $inquiries->get(),
            'quotations'       => $quotations->get(),
            'orders'           => $orders->get(),
            'lost_leads'       => $lostLeads->get(),
            'product_requests' => $productRequests->get(),
            'inventory'        => $inventory->get(),
            'production'       => $production->get(),
            'reorders'         => $reorders->get(),
            'summary'          => null,
            default            => abort(404),
        };

        $cancellationInsights = app(AnalyticsService::class)->lostLeadsAnalytics($from, $to);

        return view('reports.pdf', [
            'report'               => $report,
            'from'                 => $from,
            'to'                   => $to,
            'summary'              => $summary,
            'items'                => $items,
            'cancellationInsights' => $cancellationInsights,
        ]);
    }

    /** Download the header-only CSV template for an admin report import. */
    public function importTemplate(string $type): StreamedResponse
    {
        $headers = match ($type) {
            'inquiries'  => ['Inquiry ID', 'Business', 'Contact', 'Status', 'Created at'],
            'quotations' => ['Quotation ID', 'Inquiry ID', 'Business', 'Amount', 'Status', 'Payment submitted', 'Created at'],
            'orders'     => ['Order ID', 'Quotation ID', 'Business', 'Amount', 'Status', 'Tracking number', 'Created at'],
            default      => abort(404),
        };

        return response()->streamDownload(function () use ($headers) {
            $output = fopen('php://output', 'w');
            fwrite($output, "\xEF\xBB\xBF");
            fputcsv($output, $headers);
            fclose($output);
        }, "bmanny-{$type}-import-template.csv", ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** Import historical inquiry, quotation, or order data from an admin CSV. */
    public function importReport(Request $request)
    {
        $validated = $request->validate([
            'type' => ['required', 'in:inquiries,quotations,orders'],
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
        ]);

        $rows = $this->csvRows($validated['file']->getRealPath(), $validated['type']);

        DB::transaction(function () use ($rows, $validated): void {
            foreach ($rows as $row) {
                match ($validated['type']) {
                    'inquiries'  => $this->importInquiry($row),
                    'quotations' => $this->importQuotation($row),
                    'orders'     => $this->importOrder($row),
                };
            }
        });

        return back()->with('success', count($rows) . ' ' . $validated['type'] . ' imported successfully.');
    }

    /** @return array<int, string> */
    private function allowedReportsForRole(string $role): array
    {
        return match ($role) {
            'admin'              => ['inquiries', 'quotations', 'orders', 'reorders', 'lost_leads', 'product_requests', 'inventory', 'production'],
            'sales_agent'        => ['inquiries', 'quotations', 'orders', 'reorders', 'lost_leads'],
            'order_manager'      => ['orders', 'production', 'reorders', 'inventory'],
            'product_controller' => ['product_requests', 'inventory'],
            default              => [],
        };
    }

    private function reportRange(Request $request): array
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to'   => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $from = isset($validated['from'])
            ? (str_contains($validated['from'], ':') ? Carbon::parse($validated['from']) : Carbon::parse($validated['from'])->startOfDay())
            : now()->startOfMonth()->startOfDay();

        $to = isset($validated['to'])
            ? (str_contains($validated['to'], ':') ? Carbon::parse($validated['to'])->endOfMinute() : Carbon::parse($validated['to'])->endOfDay())
            : now()->endOfDay();

        return [$from, $to];
    }

    private function writeInquiryReport($output, Carbon $from, Carbon $to): void
    {
        fputcsv($output, ['Inquiry ID', 'Business', 'Contact', 'Type', 'Status', 'Cancelled at', 'Cancellation reason', 'Created at']);
        Inquiry::with('client.user')->whereBetween('created_at', [$from, $to])->orderBy('inquiry_id')->each(function (Inquiry $inquiry) use ($output) {
            fputcsv($output, [
                $inquiry->inquiry_id,
                $this->csv($inquiry->client?->business_name),
                $this->csv($inquiry->client?->user?->full_name ?? $inquiry->client?->contact_person),
                $inquiry->inquiry_type ?? 'new',
                $inquiry->cancelled_at ? 'cancelled' : $inquiry->status,
                optional($inquiry->cancelled_at)->toDateTimeString(),
                $this->csv($inquiry->cancellation_reason),
                optional($inquiry->created_at)->toDateTimeString(),
            ]);
        });
    }

    private function writeQuotationReport($output, Carbon $from, Carbon $to): void
    {
        fputcsv($output, ['Quotation ID', 'Inquiry ID', 'Business', 'Total Amount', 'Initial Due', 'Balance Due', 'Valid Until', 'Status', 'Payment submitted', 'Created at']);
        Quotation::with('inquiry.client')->whereBetween('created_at', [$from, $to])->orderBy('quotation_id')->each(function (Quotation $quotation) use ($output) {
            fputcsv($output, [
                $quotation->quotation_id,
                $quotation->inquiry_id,
                $this->csv($quotation->inquiry?->client?->business_name),
                $quotation->total_amount,
                $quotation->initial_payment_amount,
                $quotation->balance_payment_amount,
                $quotation->valid_until,
                $quotation->status,
                optional($quotation->payment_submitted_at)->toDateTimeString(),
                optional($quotation->created_at)->toDateTimeString(),
            ]);
        });
    }

    private function writeOrderReport($output, Carbon $from, Carbon $to): void
    {
        fputcsv($output, ['Order ID', 'Quotation ID', 'Business', 'Priority', 'Total Amount', 'Initial Verified', 'Balance Verified', 'Status', 'Est. Completion', 'Courier', 'Courier Tracking', 'Internal Tracking', 'Created at']);
        Order::with('client')->whereBetween('created_at', [$from, $to])->orderBy('order_id')->each(function (Order $order) use ($output) {
            fputcsv($output, [
                $order->order_id,
                $order->quotation_id,
                $this->csv($order->client?->business_name),
                $order->priority ?? 'normal',
                $order->total_amount,
                optional($order->initial_payment_verified_at)->toDateTimeString(),
                optional($order->balance_payment_verified_at)->toDateTimeString(),
                $order->status,
                $order->estimated_completion_date?->format('Y-m-d'),
                $this->csv($order->courier_name),
                $this->csv($order->courier_tracking_number),
                $this->csv($order->internal_tracking_number),
                optional($order->created_at)->toDateTimeString(),
            ]);
        });
    }

    private function writeLostLeadsReport($output, Carbon $from, Carbon $to): void
    {
        fputcsv($output, ['Inquiry ID', 'Business', 'Contact', 'Status', 'Lost / Cancellation Reason', 'Date Lost', 'Created at']);
        Inquiry::with('client.user')
            ->whereBetween('created_at', [$from, $to])
            ->where(fn ($q) => $q->whereNotNull('cancelled_at')->orWhereIn('status', ['cancelled', 'lost']))
            ->orderByDesc('updated_at')
            ->each(function (Inquiry $inquiry) use ($output) {
                fputcsv($output, [
                    $inquiry->inquiry_id,
                    $this->csv($inquiry->client?->business_name),
                    $this->csv($inquiry->client?->user?->full_name ?? $inquiry->client?->contact_person),
                    $inquiry->cancelled_at ? 'cancelled' : $inquiry->status,
                    $this->csv($inquiry->cancellation_reason ?: 'No reason recorded'),
                    optional($inquiry->cancelled_at ?? $inquiry->updated_at)->toDateTimeString(),
                    optional($inquiry->created_at)->toDateTimeString(),
                ]);
            });
    }

    private function writeProductRequestsReport($output, Carbon $from, Carbon $to): void
    {
        fputcsv($output, ['Review ID', 'Inquiry ID', 'Business', 'Status', 'Reviewed By', 'Response Notes', 'Created at']);
        ProductRequestReview::with(['inquiry.client', 'reviewer'])
            ->whereBetween('created_at', [$from, $to])
            ->orderByDesc('created_at')
            ->each(function (ProductRequestReview $review) use ($output) {
                fputcsv($output, [
                    $review->product_request_review_id,
                    $review->inquiry_id,
                    $this->csv($review->inquiry?->client?->business_name),
                    $review->status,
                    $this->csv($review->reviewer?->full_name),
                    $this->csv($review->response_notes),
                    optional($review->created_at)->toDateTimeString(),
                ]);
            });
    }

    private function writeInventoryReport($output): void
    {
        fputcsv($output, ['SKU', 'Raw Material', 'Batch/Lot', 'Category', 'Stock on Hand', 'Unit', 'Reorder Level', 'Max Stock', 'Stock Status', 'Expiration Date', 'Expiry Status', 'Unit Rate (PHP)', 'Valuation (PHP)']);
        Product::with('category')->orderBy('name')->each(function (Product $product) use ($output) {
            fputcsv($output, [
                $product->sku,
                $this->csv($product->name),
                $this->csv($product->batch_lot_number),
                $this->csv($product->category?->name ?? 'Uncategorized'),
                $product->stock_quantity,
                $product->unit_of_measure,
                $product->reorder_level,
                $product->max_stock_level,
                $product->stock_status,
                $product->expiration_date?->format('Y-m-d'),
                $product->expiry_status,
                $product->price,
                round((float) $product->stock_quantity * (float) $product->price, 2),
            ]);
        });
    }

    private function writeProductionReport($output, Carbon $from, Carbon $to): void
    {
        fputcsv($output, ['Batch Code', 'Order ID', 'Business', 'Priority', 'Planned Qty', 'Start Date', 'Target End', 'Actual Start', 'Actual End', 'Status', 'Overdue', 'Delivery Batches', 'Notes']);
        ProductionSchedule::with(['order.client', 'order.deliveryBatches'])
            ->whereBetween('created_at', [$from, $to])
            ->orderBy('production_start_date')
            ->each(function (ProductionSchedule $sched) use ($output) {
                fputcsv($output, [
                    $sched->batch_code,
                    $sched->order_id,
                    $this->csv($sched->order?->client?->business_name),
                    $sched->priority,
                    $sched->planned_quantity,
                    $sched->production_start_date?->format('Y-m-d'),
                    $sched->target_end_date?->format('Y-m-d'),
                    $sched->actual_start_date?->format('Y-m-d'),
                    $sched->actual_end_date?->format('Y-m-d'),
                    $sched->production_status,
                    $sched->is_overdue ? 'Yes' : 'No',
                    $sched->order?->deliveryBatches?->count() ?? 0,
                    $this->csv($sched->production_notes),
                ]);
            });
    }

    private function writeReordersReport($output, Carbon $from, Carbon $to): void
    {
        fputcsv($output, ['Inquiry ID', 'Business', 'Brand', 'Reorder Type', 'Batch Qty', 'Sales Value (PHP)', 'Lead Status', 'Order ID', 'Order Status', 'Production Batch', 'Target End', 'Remaining Stored Pouches', 'Created at']);
        Inquiry::with(['client', 'packagingBalance', 'quotation.order.latestProductionSchedule'])
            ->whereBetween('created_at', [$from, $to])
            ->where(fn ($q) => $q->whereIn('inquiry_type', ['reorder_batch', 'packaging_replenishment'])
                ->orWhereNotNull('source_order_id')
                ->orWhereNotNull('packaging_balance_id'))
            ->orderByDesc('created_at')
            ->each(function (Inquiry $inq) use ($output) {
                $order = $inq->quotation?->order;
                $sched = $order?->latestProductionSchedule;
                fputcsv($output, [
                    $inq->inquiry_id,
                    $this->csv($inq->client?->business_name),
                    $this->csv($inq->packagingBalance?->brand_name ?? '—'),
                    $inq->inquiry_type ?: 'quick_reorder',
                    $inq->reorder_batch_quantity ?? '—',
                    $order?->total_amount ?? $inq->quotation?->total_amount ?? 0,
                    $inq->cancelled_at ? 'cancelled' : $inq->status,
                    $order?->order_id ?? '—',
                    $order?->status ?? 'Not yet ordered',
                    $sched?->batch_code ?? 'Unscheduled',
                    $sched?->target_end_date?->format('Y-m-d') ?? '—',
                    $inq->packagingBalance?->remaining_pouches ?? '—',
                    optional($inq->created_at)->toDateTimeString(),
                ]);
            });
    }

    /** @return array<int, array<string, string>> */
    private function csvRows(string $path, string $type): array
    {
        $handle = fopen($path, 'r');
        if ($handle === false) {
            throw ValidationException::withMessages(['file' => 'The CSV file could not be opened.']);
        }

        $headers = fgetcsv($handle);
        $headers = is_array($headers)
            ? array_map(fn ($header) => $this->csvHeader((string) $header), $headers)
            : [];

        $required = match ($type) {
            'inquiries'  => ['inquiry_id', 'business', 'contact', 'status', 'created_at'],
            'quotations' => ['quotation_id', 'inquiry_id', 'business', 'amount', 'status', 'payment_submitted', 'created_at'],
            'orders'     => ['order_id', 'quotation_id', 'business', 'amount', 'status', 'tracking_number', 'created_at'],
        };

        if (array_diff($required, $headers)) {
            fclose($handle);
            throw ValidationException::withMessages(['file' => 'The CSV headers do not match the selected import template. Download a new template and try again.']);
        }

        $rows = [];
        $line = 1;
        while (($values = fgetcsv($handle)) !== false) {
            $line++;
            if (count($values) === 1 && trim((string) $values[0]) === '') {
                continue;
            }
            if (count($values) !== count($headers)) {
                fclose($handle);
                throw ValidationException::withMessages(['file' => "Row {$line} has a different number of columns than the header."]);
            }
            $rows[] = array_combine($headers, array_map(fn ($value) => trim((string) $value), $values));
            if (count($rows) > 1000) {
                fclose($handle);
                throw ValidationException::withMessages(['file' => 'A maximum of 1,000 rows may be imported at one time.']);
            }
        }
        fclose($handle);

        if ($rows === []) {
            throw ValidationException::withMessages(['file' => 'The CSV contains no data rows.']);
        }

        return $rows;
    }

    /** @param array<string, string> $row */
    private function importInquiry(array $row): void
    {
        $business = trim($row['business']);
        $client = \App\Models\BusinessClient::whereRaw('LOWER(business_name) = ?', [strtolower($business)])->first();
        $status = strtolower($row['status']);
        $createdAt = $this->importDate($row['created_at'], 'created_at');

        if (! $client || $business === '') {
            throw ValidationException::withMessages(['file' => "Inquiry for '{$business}' cannot be imported because the business does not exist."]);
        }
        if (! in_array($status, ['new', 'for_quotation', 'follow_up', 'quotation_sent', 'converted', 'cancelled', 'lost'], true)) {
            throw ValidationException::withMessages(['file' => "Inquiry status '{$row['status']}' is invalid."]);
        }
        $subject = 'Imported inquiry #' . $row['inquiry_id'];
        if (Inquiry::where('client_id', $client->client_id)->where('subject', $subject)->exists()) {
            throw ValidationException::withMessages(['file' => "Imported inquiry #{$row['inquiry_id']} for '{$business}' already exists."]);
        }

        $inquiry = new Inquiry();
        $inquiry->fill([
            'client_id'    => $client->client_id,
            'subject'      => $subject,
            'message'      => null,
            'status'       => $status,
            'cancelled_at' => $status === 'cancelled' ? $createdAt : null,
        ]);
        $inquiry->created_at = $createdAt;
        $inquiry->updated_at = $createdAt;
        $inquiry->save();
    }

    /** @param array<string, string> $row */
    private function importQuotation(array $row): void
    {
        $inquiry = Inquiry::find($row['inquiry_id']);
        $status = strtolower($row['status']);
        $createdAt = $this->importDate($row['created_at'], 'created_at');
        $paymentSubmittedAt = $row['payment_submitted'] !== ''
            ? $this->importDate($row['payment_submitted'], 'payment_submitted')
            : null;

        if (! $inquiry) {
            throw ValidationException::withMessages(['file' => "Inquiry #{$row['inquiry_id']} does not exist."]);
        }
        if (! is_numeric($row['amount']) || (float) $row['amount'] < 0) {
            throw ValidationException::withMessages(['file' => "Quotation for inquiry #{$row['inquiry_id']} has an invalid total amount."]);
        }
        if (! in_array($status, ['draft', 'sent', 'accepted', 'rejected', 'expired'], true)) {
            throw ValidationException::withMessages(['file' => "Quotation status '{$row['status']}' is invalid."]);
        }
        if (Quotation::where('inquiry_id', $inquiry->inquiry_id)->exists()) {
            throw ValidationException::withMessages(['file' => "Inquiry #{$row['inquiry_id']} already has a quotation."]);
        }

        $quotation = new Quotation();
        $quotation->fill([
            'inquiry_id'           => $inquiry->inquiry_id,
            'total_amount'         => $row['amount'],
            'status'               => $status,
            'payment_submitted_at' => $paymentSubmittedAt,
        ]);
        $quotation->created_at = $createdAt;
        $quotation->updated_at = $createdAt;
        $quotation->save();
    }

    /** @param array<string, string> $row */
    private function importOrder(array $row): void
    {
        $quotation = Quotation::with('inquiry')->find($row['quotation_id']);
        $status = strtolower($row['status']);
        $createdAt = $this->importDate($row['created_at'], 'created_at');

        if (! $quotation || ! $quotation->inquiry) {
            throw ValidationException::withMessages(['file' => "Quotation #{$row['quotation_id']} does not exist."]);
        }
        if (! is_numeric($row['amount']) || (float) $row['amount'] < 0) {
            throw ValidationException::withMessages(['file' => "Order for quotation #{$row['quotation_id']} has an invalid total amount."]);
        }
        if (! in_array($status, ['approved', 'in_production', 'packed', 'ready_for_pickup', 'for_delivery', 'delivered', 'completed', 'cancelled'], true)) {
            throw ValidationException::withMessages(['file' => "Order status '{$row['status']}' is invalid."]);
        }
        if (Order::where('quotation_id', $quotation->quotation_id)->exists()) {
            throw ValidationException::withMessages(['file' => "Quotation #{$row['quotation_id']} already has an order."]);
        }

        $order = new Order();
        $order->fill([
            'client_id'                => $quotation->inquiry->client_id,
            'quotation_id'             => $quotation->quotation_id,
            'total_amount'             => $row['amount'],
            'status'                   => $status,
            'internal_tracking_number' => $row['tracking_number'] ?: null,
        ]);
        $order->created_at = $createdAt;
        $order->updated_at = $createdAt;
        $order->save();
    }

    private function importDate(string $value, string $column): Carbon
    {
        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            throw ValidationException::withMessages(['file' => "The {$column} value '{$value}' is not a valid date/time."]);
        }
    }

    private function csvHeader(string $header): string
    {
        $header = preg_replace('/^\xEF\xBB\xBF/', '', $header);
        return trim((string) preg_replace('/_+/', '_', preg_replace('/[^a-z0-9]+/', '_', strtolower(trim($header)))), '_');
    }

    private function csv(?string $value): ?string
    {
        return $value !== null && preg_match('/^[=+\-@]/', $value) ? "'{$value}" : $value;
    }
}
