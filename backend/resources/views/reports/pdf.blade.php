<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>BMANNY — {{ ucfirst($report) }} Report</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            background: #f8fafc;
            color: #0f172a;
            margin: 0;
            padding: 32px;
        }
        .container {
            max-width: 900px;
            margin: auto;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 36px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 24px;
        }
        .brand {
            font-size: 24px;
            font-weight: 900;
            letter-spacing: -0.5px;
            color: #0f172a;
        }
        .brand-sub {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #d97706;
            margin-top: 2px;
        }
        .report-meta {
            text-align: right;
            font-size: 12px;
            color: #64748b;
            line-height: 1.5;
        }
        .title {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 4px 0;
            text-transform: uppercase;
            letter-spacing: -0.3px;
        }
        .subtitle {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 24px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 28px;
        }
        .metric-card {
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            border-radius: 8px;
            padding: 14px;
        }
        .metric-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.5px;
        }
        .metric-value {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 4px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-top: 12px;
        }
        th {
            background: #f1f5f9;
            color: #475569;
            font-weight: 700;
            text-align: left;
            padding: 10px 12px;
            border-bottom: 2px solid #cbd5e1;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.5px;
        }
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
            vertical-align: middle;
        }
        tr:nth-child(even) td {
            background: #fafafa;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 700;
            text-transform: capitalize;
            background: #f1f5f9;
            color: #475569;
        }
        .badge-approved { background: #eff6ff; color: #1d4ed8; }
        .badge-production { background: #faf5ff; color: #7e22ce; }
        .badge-completed { background: #ecfdf5; color: #047857; }
        .badge-cancelled { background: #fff1f2; color: #be123c; }
        .badge-new { background: #eff6ff; color: #1d4ed8; }
        .footer {
            margin-top: 36px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #94a3b8;
        }
        .btn-print {
            padding: 9px 18px;
            background: #2563eb;
            color: white;
            font-weight: 700;
            font-size: 12px;
            border: 0;
            border-radius: 6px;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .btn-print:hover {
            background: #1d4ed8;
        }
        @media print {
            body { background: #fff; padding: 0; }
            .container { border: 0; box-shadow: none; max-width: none; padding: 0; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <div class="brand">BMANNY</div>
                <div class="brand-sub">Manufacturing Operations</div>
            </div>
            <div class="report-meta">
                <strong>Timeframe:</strong> {{ $from->format('M d, Y h:i A') }} – {{ $to->format('M d, Y h:i A') }}<br>
                <strong>Generated:</strong> {{ now()->timezone('Asia/Manila')->format('M d, Y h:i A') }}
            </div>
        </div>

        <h1 class="title">{{ ucfirst($report) }} Report</h1>
        <div class="subtitle">Official administrative performance and record breakdown.</div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Inquiries</div>
                <div class="metric-value">{{ $summary['inquiries'] }}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Quotations</div>
                <div class="metric-value">{{ $summary['quotations'] }}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Orders</div>
                <div class="metric-value">{{ $summary['orders'] }}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Order Value</div>
                <div class="metric-value">₱{{ number_format((float) $summary['orderValue'], 2) }}</div>
            </div>
        </div>

        @if($report === 'inquiries' && $items)
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Business Name</th>
                        <th>Contact Person</th>
                        <th>Status</th>
                        <th>Cancellation Reason</th>
                        <th>Date Created</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($items as $inquiry)
                        <tr>
                            <td><strong>#{{ $inquiry->inquiry_id }}</strong></td>
                            <td>{{ $inquiry->client?->business_name ?? '—' }}</td>
                            <td>{{ $inquiry->client?->user?->full_name ?? ($inquiry->client?->contact_person ?? '—') }}</td>
                            <td>
                                <span class="badge {{ $inquiry->cancelled_at ? 'badge-cancelled' : 'badge-new' }}">
                                    {{ $inquiry->cancelled_at ? 'Cancelled' : str_replace('_', ' ', $inquiry->status) }}
                                </span>
                            </td>
                            <td>{{ $inquiry->cancelled_at ? ($inquiry->cancellation_reason ?: 'No reason recorded') : '—' }}</td>
                            <td>{{ optional($inquiry->created_at)->timezone('Asia/Manila')->format('M d, Y h:i A') }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="6" style="text-align:center; padding: 24px; color: #94a3b8;">No inquiries recorded within this timeframe.</td></tr>
                    @endforelse
                </tbody>
            </table>
        @elseif($report === 'quotations' && $items)
            <table>
                <thead>
                    <tr>
                        <th>Quote #</th>
                        <th>Inquiry #</th>
                        <th>Business Name</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Payment Submitted</th>
                        <th>Date Created</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($items as $quote)
                        <tr>
                            <td><strong>#{{ $quote->quotation_id }}</strong></td>
                            <td>#{{ $quote->inquiry_id }}</td>
                            <td>{{ $quote->inquiry?->client?->business_name ?? '—' }}</td>
                            <td><strong>₱{{ number_format((float) $quote->total_amount, 2) }}</strong></td>
                            <td><span class="badge">{{ str_replace('_', ' ', $quote->status) }}</span></td>
                            <td>{{ $quote->payment_submitted_at ? $quote->payment_submitted_at->timezone('Asia/Manila')->format('M d, Y h:i A') : '—' }}</td>
                            <td>{{ optional($quote->created_at)->timezone('Asia/Manila')->format('M d, Y h:i A') }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="7" style="text-align:center; padding: 24px; color: #94a3b8;">No quotations recorded within this timeframe.</td></tr>
                    @endforelse
                </tbody>
            </table>
        @elseif($report === 'orders' && $items)
            <table>
                <thead>
                    <tr>
                        <th>Order #</th>
                        <th>Quote #</th>
                        <th>Business Name</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th>Tracking Number</th>
                        <th>Date Created</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($items as $order)
                        <tr>
                            <td><strong>#{{ $order->order_id }}</strong></td>
                            <td>#{{ $order->quotation_id }}</td>
                            <td>{{ $order->client?->business_name ?? '—' }}</td>
                            <td><strong>₱{{ number_format((float) $order->total_amount, 2) }}</strong></td>
                            <td><span class="badge badge-approved">{{ str_replace('_', ' ', $order->status) }}</span></td>
                            <td>{{ $order->internal_tracking_number ?? '—' }}</td>
                            <td>{{ optional($order->created_at)->timezone('Asia/Manila')->format('M d, Y h:i A') }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="7" style="text-align:center; padding: 24px; color: #94a3b8;">No orders recorded within this timeframe.</td></tr>
                    @endforelse
                </tbody>
            </table>
        @endif

        <div class="footer">
            <div>BMANNY Internal Report Document • Confidential</div>
            <button class="btn-print no-print" onclick="window.print()">Print / Save as PDF</button>
        </div>
    </div>

    <script class="no-print">
        window.addEventListener('DOMContentLoaded', () => {
            // Auto open print dialog if requested
            if (window.location.search.includes('autoprint=1')) {
                setTimeout(() => window.print(), 300);
            }
        });
    </script>
</body>
</html>
