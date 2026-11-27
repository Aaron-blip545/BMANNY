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

        <h1 class="title">{{ ucwords(str_replace('_', ' ', $report)) }} Report</h1>
        <div class="subtitle">Official operational performance and record breakdown.</div>

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
                        <th>Business Name</th>
                        <th>Priority</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th>Courier / Tracking</th>
                        <th>Est. Finish</th>
                        <th>Date Created</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($items as $order)
                        <tr>
                            <td><strong>#{{ $order->order_id }}</strong></td>
                            <td>{{ $order->client?->business_name ?? '—' }}</td>
                            <td><span class="badge">{{ strtoupper($order->priority ?? 'normal') }}</span></td>
                            <td><strong>₱{{ number_format((float) $order->total_amount, 2) }}</strong></td>
                            <td><span class="badge badge-approved">{{ str_replace('_', ' ', $order->status) }}</span></td>
                            <td>{{ $order->courier_name ? "{$order->courier_name} ({$order->courier_tracking_number})" : ($order->internal_tracking_number ?? '—') }}</td>
                            <td>{{ $order->estimated_completion_date?->format('Y-m-d') ?? '—' }}</td>
                            <td>{{ optional($order->created_at)->timezone('Asia/Manila')->format('M d, Y h:i A') }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="8" style="text-align:center; padding: 24px; color: #94a3b8;">No orders recorded within this timeframe.</td></tr>
                    @endforelse
                </tbody>
            </table>
        @elseif($report === 'lost_leads' && $items)
            <table>
                <thead>
                    <tr>
                        <th>Inquiry #</th>
                        <th>Business Name</th>
                        <th>Contact</th>
                        <th>Status</th>
                        <th>Lost / Cancellation Reason</th>
                        <th>Date Lost</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($items as $inquiry)
                        <tr>
                            <td><strong>#{{ $inquiry->inquiry_id }}</strong></td>
                            <td>{{ $inquiry->client?->business_name ?? '—' }}</td>
                            <td>{{ $inquiry->client?->user?->full_name ?? ($inquiry->client?->contact_person ?? '—') }}</td>
                            <td><span class="badge badge-cancelled">{{ $inquiry->cancelled_at ? 'Cancelled' : $inquiry->status }}</span></td>
                            <td>{{ $inquiry->cancellation_reason ?: 'No reason recorded' }}</td>
                            <td>{{ optional($inquiry->cancelled_at ?? $inquiry->updated_at)->timezone('Asia/Manila')->format('M d, Y h:i A') }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="6" style="text-align:center; padding: 24px; color: #94a3b8;">No lost or cancelled leads within this timeframe.</td></tr>
                    @endforelse
                </tbody>
            </table>
        @elseif($report === 'product_requests' && $items)
            <table>
                <thead>
                    <tr>
                        <th>Review #</th>
                        <th>Inquiry #</th>
                        <th>Business Name</th>
                        <th>Decision</th>
                        <th>Reviewed By</th>
                        <th>Notes</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($items as $rev)
                        <tr>
                            <td><strong>#{{ $rev->product_request_review_id }}</strong></td>
                            <td>#{{ $rev->inquiry_id }}</td>
                            <td>{{ $rev->inquiry?->client?->business_name ?? '—' }}</td>
                            <td><span class="badge">{{ str_replace('_', ' ', $rev->status) }}</span></td>
                            <td>{{ $rev->reviewer?->full_name ?? '—' }}</td>
                            <td>{{ $rev->response_notes ?: '—' }}</td>
                            <td>{{ optional($rev->created_at)->timezone('Asia/Manila')->format('M d, Y') }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="7" style="text-align:center; padding: 24px; color: #94a3b8;">No product request reviews within this timeframe.</td></tr>
                    @endforelse
                </tbody>
            </table>
        @elseif($report === 'inventory' && $items)
            <table>
                <thead>
                    <tr>
                        <th>SKU</th>
                        <th>Raw Material</th>
                        <th>Stock</th>
                        <th>Reorder / Max</th>
                        <th>Stock Status</th>
                        <th>Expiration</th>
                        <th>Valuation</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($items as $prod)
                        <tr>
                            <td><strong>{{ $prod->sku }}</strong></td>
                            <td>{{ $prod->name }}</td>
                            <td>{{ $prod->stock_quantity }} {{ $prod->unit_of_measure }}</td>
                            <td>{{ $prod->reorder_level ?? 0 }} / {{ $prod->max_stock_level ?? '—' }}</td>
                            <td><span class="badge">{{ str_replace('_', ' ', $prod->stock_status) }}</span></td>
                            <td>{{ $prod->expiration_date?->format('Y-m-d') ?? '—' }} ({{ $prod->expiry_status }})</td>
                            <td><strong>₱{{ number_format((float) $prod->stock_quantity * (float) $prod->price, 2) }}</strong></td>
                        </tr>
                    @empty
                        <tr><td colspan="7" style="text-align:center; padding: 24px; color: #94a3b8;">No inventory records found.</td></tr>
                    @endforelse
                </tbody>
            </table>
        @elseif($report === 'production' && $items)
            <table>
                <thead>
                    <tr>
                        <th>Batch Code</th>
                        <th>Order #</th>
                        <th>Business Name</th>
                        <th>Priority</th>
                        <th>Qty</th>
                        <th>Scheduled Window</th>
                        <th>Actual Dates</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($items as $sched)
                        <tr>
                            <td><strong>{{ $sched->batch_code }}</strong></td>
                            <td>#{{ $sched->order_id }}</td>
                            <td>{{ $sched->order?->client?->business_name ?? '—' }}</td>
                            <td><span class="badge">{{ strtoupper($sched->priority) }}</span></td>
                            <td>{{ number_format($sched->planned_quantity) }}</td>
                            <td>{{ $sched->production_start_date?->format('Y-m-d') }} → {{ $sched->target_end_date?->format('Y-m-d') }}</td>
                            <td>{{ $sched->actual_start_date?->format('Y-m-d') ?? '—' }} → {{ $sched->actual_end_date?->format('Y-m-d') ?? '—' }}</td>
                            <td><span class="badge">{{ str_replace('_', ' ', $sched->production_status) }}</span></td>
                        </tr>
                    @empty
                        <tr><td colspan="8" style="text-align:center; padding: 24px; color: #94a3b8;">No production schedules recorded within this timeframe.</td></tr>
                    @endforelse
                </tbody>
            </table>
        @elseif($report === 'reorders' && $items)
            <table>
                <thead>
                    <tr>
                        <th>Inquiry #</th>
                        <th>Business &amp; Brand</th>
                        <th>Reorder Type</th>
                        <th>Batch Qty</th>
                        <th>Sales Value</th>
                        <th>Order / Production</th>
                        <th>Remaining Pouches</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($items as $inq)
                        @php
                            $ord = $inq->quotation?->order;
                            $sched = $ord?->latestProductionSchedule;
                        @endphp
                        <tr>
                            <td><strong>#{{ $inq->inquiry_id }}</strong></td>
                            <td>
                                {{ $inq->client?->business_name ?? '—' }}
                                @if($inq->packagingBalance?->brand_name)
                                    <br><small style="color:#64748b;">{{ $inq->packagingBalance->brand_name }}</small>
                                @endif
                            </td>
                            <td><span class="badge">{{ str_replace('_', ' ', $inq->inquiry_type ?: 'quick_reorder') }}</span></td>
                            <td>{{ $inq->reorder_batch_quantity ? number_format($inq->reorder_batch_quantity) : '—' }}</td>
                            <td><strong>₱{{ number_format((float) ($ord?->total_amount ?? $inq->quotation?->total_amount ?? 0), 2) }}</strong></td>
                            <td>
                                @if($ord)
                                    Order #{{ $ord->order_id }} ({{ str_replace('_', ' ', $ord->status) }})
                                    @if($sched)
                                        <br><small style="color:#2563eb;">{{ $sched->batch_code }} · Target {{ $sched->target_end_date?->format('Y-m-d') }}</small>
                                    @endif
                                @else
                                    <span class="badge">{{ str_replace('_', ' ', $inq->status) }}</span>
                                @endif
                            </td>
                            <td>{{ $inq->packagingBalance ? number_format($inq->packagingBalance->remaining_pouches) : '—' }}</td>
                            <td>{{ optional($inq->created_at)->timezone('Asia/Manila')->format('M d, Y') }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="8" style="text-align:center; padding: 24px; color: #94a3b8;">No reorder transactions recorded within this timeframe.</td></tr>
                    @endforelse
                </tbody>
            </table>
        @elseif($report === 'summary')
            <table>
                <thead>
                    <tr>
                        <th>Operational Metric</th>
                        <th>Count / Value</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Total Inquiries</td><td><strong>{{ $summary['inquiries'] }}</strong></td></tr>
                    <tr><td>Total Quotations</td><td><strong>{{ $summary['quotations'] }}</strong></td></tr>
                    <tr><td>Total Orders</td><td><strong>{{ $summary['orders'] }}</strong></td></tr>
                    <tr><td>Active Order Value</td><td><strong>₱{{ number_format((float) $summary['orderValue'], 2) }}</strong></td></tr>
                    <tr><td>Lost / Cancelled Leads</td><td><strong>{{ $summary['lostLeads'] ?? 0 }}</strong></td></tr>
                    <tr><td>Product Request Reviews</td><td><strong>{{ $summary['productRequests'] ?? 0 }}</strong></td></tr>
                    <tr><td>Production Schedules</td><td><strong>{{ $summary['production'] ?? 0 }}</strong></td></tr>
                    <tr><td>Active Raw Materials in Inventory</td><td><strong>{{ $summary['inventory'] ?? 0 }}</strong></td></tr>
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
