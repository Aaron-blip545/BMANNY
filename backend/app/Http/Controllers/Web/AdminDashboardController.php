<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Inquiry;
use App\Models\Order;
use App\Models\Product;
use App\Models\Quotation;
use App\Models\User;
use App\Services\AnalyticsService;
use Carbon\Carbon;
use Illuminate\Http\Request;
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
                    'inquiry_id' => $i->inquiry_id,
                    'status'     => $i->cancelled_at ? 'cancelled' : $i->status,
                    'created_at' => $i->created_at,
                    'client'     => $i->client ? ['business_name' => $i->client->business_name] : null,
                ]),
        ]);
    }

    public function analytics(AnalyticsService $analytics): Response
    {
        return Inertia::render('admin/analytics', [
            'analytics' => [
                'periods' => $analytics->periods(),
            ],
        ]);
    }

    public function reports(Request $request): Response
    {
        [$from, $to] = $this->reportRange($request);

        $inquiries = Inquiry::whereBetween('created_at', [$from, $to]);
        $quotations = Quotation::whereBetween('created_at', [$from, $to]);
        $orders = Order::whereBetween('created_at', [$from, $to]);
        $users = User::whereBetween('created_at', [$from, $to]);

        return Inertia::render('admin/reports', [
            'filters' => [
                'from' => $from->format('Y-m-d H:i'),
                'to' => $to->format('Y-m-d H:i'),
            ],
            'summary' => [
                'inquiries' => $inquiries->count(),
                'quotations' => $quotations->count(),
                'orders' => $orders->count(),
                'newUsers' => $users->count(),
                'orderValue' => (float) (clone $orders)->where('status', '!=', 'cancelled')->sum('total_amount'),
            ],
        ]);
    }

    public function exportReport(Request $request, string $report): StreamedResponse
    {
        [$from, $to] = $this->reportRange($request);
        $filename = "bmanny-{$report}-{$from->format('Y-m-d_Hi')}-to-{$to->format('Y-m-d_Hi')}.csv";

        return response()->streamDownload(function () use ($report, $from, $to) {
            $output = fopen('php://output', 'w');
            fwrite($output, "\xEF\xBB\xBF");

            match ($report) {
                'inquiries' => $this->writeInquiryReport($output, $from, $to),
                'quotations' => $this->writeQuotationReport($output, $from, $to),
                'orders' => $this->writeOrderReport($output, $from, $to),
                'users' => $this->writeUserReport($output, $from, $to),
                default => abort(404),
            };

            fclose($output);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function reportRange(Request $request): array
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $from = isset($validated['from'])
            ? (str_contains($validated['from'], ':') ? Carbon::parse($validated['from']) : Carbon::parse($validated['from'])->startOfDay())
            : now()->startOfMonth()->startOfDay();

        $to = isset($validated['to'])
            ? (str_contains($validated['to'], ':') ? Carbon::parse($validated['to']) : Carbon::parse($validated['to'])->endOfDay())
            : now()->endOfDay();

        return [$from, $to];
    }

    private function writeInquiryReport($output, Carbon $from, Carbon $to): void
    {
        fputcsv($output, ['Inquiry ID', 'Business', 'Contact', 'Status', 'Created at']);
        Inquiry::with('client.user')->whereBetween('created_at', [$from, $to])->orderBy('inquiry_id')->each(function (Inquiry $inquiry) use ($output) {
            fputcsv($output, [$inquiry->inquiry_id, $this->csv($inquiry->client?->business_name), $this->csv($inquiry->client?->user?->full_name), $inquiry->cancelled_at ? 'cancelled' : $inquiry->status, optional($inquiry->created_at)->toDateTimeString()]);
        });
    }

    private function writeQuotationReport($output, Carbon $from, Carbon $to): void
    {
        fputcsv($output, ['Quotation ID', 'Inquiry ID', 'Business', 'Amount', 'Status', 'Payment submitted', 'Created at']);
        Quotation::with('inquiry.client')->whereBetween('created_at', [$from, $to])->orderBy('quotation_id')->each(function (Quotation $quotation) use ($output) {
            fputcsv($output, [$quotation->quotation_id, $quotation->inquiry_id, $this->csv($quotation->inquiry?->client?->business_name), $quotation->total_amount, $quotation->status, optional($quotation->payment_submitted_at)->toDateTimeString(), optional($quotation->created_at)->toDateTimeString()]);
        });
    }

    private function writeOrderReport($output, Carbon $from, Carbon $to): void
    {
        fputcsv($output, ['Order ID', 'Quotation ID', 'Business', 'Amount', 'Status', 'Tracking number', 'Created at']);
        Order::with('client')->whereBetween('created_at', [$from, $to])->orderBy('order_id')->each(function (Order $order) use ($output) {
            fputcsv($output, [$order->order_id, $order->quotation_id, $this->csv($order->client?->business_name), $order->total_amount, $order->status, $this->csv($order->internal_tracking_number), optional($order->created_at)->toDateTimeString()]);
        });
    }

    private function writeUserReport($output, Carbon $from, Carbon $to): void
    {
        fputcsv($output, ['User ID', 'Name', 'Email', 'Role', 'Status', 'Created at']);
        User::whereBetween('created_at', [$from, $to])->orderBy('user_id')->each(function (User $user) use ($output) {
            fputcsv($output, [$user->user_id, $this->csv($user->full_name), $this->csv($user->email), $user->role, $user->is_active ? 'active' : 'inactive', optional($user->created_at)->toDateTimeString()]);
        });
    }

    private function csv(?string $value): ?string
    {
        return $value !== null && preg_match('/^[=+\-@]/', $value) ? "'{$value}" : $value;
    }

}
