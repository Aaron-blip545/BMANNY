<?php

namespace Tests\Feature;

use App\Models\AppNotification;
use App\Models\BusinessClient;
use App\Models\Inquiry;
use App\Models\InquiryCustomization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CancelledInquiryHistoryTest extends TestCase
{
    use RefreshDatabase;

    private function createUser(string $role, string $email): User
    {
        return User::create([
            'full_name' => ucfirst($role),
            'email' => $email,
            'password' => Hash::make('password123'),
            'role' => $role,
            'is_active' => true,
        ]);
    }

    public function test_cancelled_inquiry_exposes_reason_to_mobile_and_notifies_sales(): void
    {
        $sales = $this->createUser('sales_agent', 'sales-cancel@test.local');
        $customer = $this->createUser('customer', 'client-cancel@test.local');

        $client = $customer->businessClient()->first() ?? BusinessClient::create([
            'user_id' => $customer->user_id,
            'business_name' => 'Cancel Test Co',
            'contact_person' => 'Tester',
            'business_type' => 'Retail',
            'business_address' => 'CDO',
        ]);

        $inquiry = Inquiry::create([
            'client_id' => $client->client_id,
            'status' => 'new',
        ]);

        InquiryCustomization::create([
            'inquiry_id' => $inquiry->inquiry_id,
            'customization_type' => 'Package inquiry — Gold Package',
            'selected_package' => 'gold',
            'packaging_type' => 'Stand-up pouch, 12 × 20 cm',
            'serving_size' => '120 g',
        ]);

        $reason = 'Budget changed for this quarter, will revisit next month.';

        $cancelRes = $this->actingAs($customer, 'sanctum')
            ->postJson("/api/inquiries/{$inquiry->inquiry_id}/cancel", [
                'cancellation_reason' => $reason,
            ]);
        $cancelRes->assertOk();

        // Mobile /api/inquiries/my-inquiries exposes both cancelled_at and cancellation_reason
        $listRes = $this->actingAs($customer, 'sanctum')->getJson('/api/inquiries/my-inquiries');
        $listRes->assertOk();
        $item = collect($listRes->json())->firstWhere('inquiry_id', $inquiry->inquiry_id);
        $this->assertNotNull($item['cancelled_at']);
        $this->assertEquals($reason, $item['cancellation_reason']);

        // Sales agent receives notification with the cancellation reason
        $notif = AppNotification::where('user_id', $sales->user_id)
            ->where('title', 'Inquiry Cancelled by Client')
            ->first();
        $this->assertNotNull($notif);
        $this->assertStringContainsString($reason, $notif->message);
    }
}
