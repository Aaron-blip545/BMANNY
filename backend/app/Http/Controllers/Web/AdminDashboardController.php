<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Inquiry;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

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
}
