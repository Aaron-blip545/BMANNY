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
        return Inertia::render('admin/reports', [
            'filters' => [
                'from' => $from->format('Y-m-d H:i'),
                'to' => $to->format('Y-m-d H:i'),
            ],
            'summary' => [
                'inquiries' => $inquiries->count(),
                'quotations' => $quotations->count(),
                'orders' => $orders->count(),
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
                default => abort(404),
            };

            fclose($output);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** Download the header-only CSV template for an admin report import. */
    public function importTemplate(string $type): StreamedResponse
    {
        $headers = match ($type) {
            'inquiries' => ['Inquiry ID', 'Business', 'Contact', 'Status', 'Created at'],
            'quotations' => ['Quotation ID', 'Inquiry ID', 'Business', 'Amount', 'Status', 'Payment submitted', 'Created at'],
            'orders' => ['Order ID', 'Quotation ID', 'Business', 'Amount', 'Status', 'Tracking number', 'Created at'],
            default => abort(404),
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
                    'inquiries' => $this->importInquiry($row),
                    'quotations' => $this->importQuotation($row),
                    'orders' => $this->importOrder($row),
                };
            }
        });

        return back()->with('success', count($rows) . ' ' . $validated['type'] . ' imported successfully.');
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
            'inquiries' => ['inquiry_id', 'business', 'contact', 'status', 'created_at'],
            'quotations' => ['quotation_id', 'inquiry_id', 'business', 'amount', 'status', 'payment_submitted', 'created_at'],
            'orders' => ['order_id', 'quotation_id', 'business', 'amount', 'status', 'tracking_number', 'created_at'],
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
        if (! in_array($status, ['pending', 'reviewed', 'responded', 'closed', 'cancelled'], true)) {
            throw ValidationException::withMessages(['file' => "Inquiry status '{$row['status']}' is invalid."]);
        }
        $subject = 'Imported inquiry #' . $row['inquiry_id'];
        if (Inquiry::where('client_id', $client->client_id)->where('subject', $subject)->exists()) {
            throw ValidationException::withMessages(['file' => "Imported inquiry #{$row['inquiry_id']} for '{$business}' already exists."]);
        }

        $inquiry = new Inquiry();
        $inquiry->fill([
            'client_id' => $client->client_id,
            'subject' => $subject,
            'message' => null,
            'status' => $status === 'cancelled' ? 'closed' : $status,
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
        if (! in_array($status, ['draft', 'sent', 'accepted', 'rejected'], true)) {
            throw ValidationException::withMessages(['file' => "Quotation status '{$row['status']}' is invalid."]);
        }
        if (Quotation::where('inquiry_id', $inquiry->inquiry_id)->exists()) {
            throw ValidationException::withMessages(['file' => "Inquiry #{$row['inquiry_id']} already has a quotation."]);
        }

        $quotation = new Quotation();
        $quotation->fill([
            'inquiry_id' => $inquiry->inquiry_id,
            'total_amount' => $row['amount'],
            'status' => $status,
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
        if (! in_array($status, ['pending', 'processing', 'completed', 'cancelled'], true)) {
            throw ValidationException::withMessages(['file' => "Order status '{$row['status']}' is invalid."]);
        }
        if (Order::where('quotation_id', $quotation->quotation_id)->exists()) {
            throw ValidationException::withMessages(['file' => "Quotation #{$row['quotation_id']} already has an order."]);
        }

        $order = new Order();
        $order->fill([
            'client_id' => $quotation->inquiry->client_id,
            'quotation_id' => $quotation->quotation_id,
            'total_amount' => $row['amount'],
            'status' => $status,
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
