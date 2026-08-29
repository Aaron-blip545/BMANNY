<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\BusinessClient;
use App\Models\Inquiry;
use App\Models\Quotation;
use App\Models\Order;
use App\Services\AnalyticsService;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class SalesDashboardController extends Controller
{
    public function index(AnalyticsService $analytics): Response
    {
        return Inertia::render('sales/dashboard', [
            'stats' => [
                'inquiries'       => Inquiry::count(),
                'pendingReview'   => Inquiry::where('status', 'pending')->count(),
                'quotations'      => Quotation::count(),
                'businessClients' => BusinessClient::count(),
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
            'analytics' => [
                'periods' => $analytics->periods(),
            ],
        ]);
    }

}
