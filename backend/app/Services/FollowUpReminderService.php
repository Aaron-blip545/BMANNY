<?php

namespace App\Services;

use App\Models\InquiryFollowup;

class FollowUpReminderService
{
    /** Send one reminder per due follow-up to Sales and Admin users. */
    public function sendDueReminders(): void
    {
        InquiryFollowup::with('inquiry.client')
            ->whereNull('completed_at')
            ->whereNull('reminded_at')
            ->where('follow_up_date', '<=', now())
            ->whereHas('inquiry', function ($q) {
                $q->whereNull('cancelled_at')
                    ->whereNotIn('status', ['converted', 'cancelled', 'lost']);
            })
            ->get()
            ->each(function (InquiryFollowup $followUp) {
                $businessName = $followUp->inquiry?->client?->business_name ?? "Inquiry #{$followUp->inquiry_id}";

                NotificationService::sendToRoles(
                    ['sales_agent', 'admin'],
                    'follow_up',
                    'Lead follow-up due',
                    "Follow up with {$businessName} today.",
                    ['inquiry_id' => $followUp->inquiry_id, 'follow_up_id' => $followUp->id]
                );

                $followUp->update(['reminded_at' => now()]);
            });
    }
}
