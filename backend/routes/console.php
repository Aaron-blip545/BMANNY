<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Services\FollowUpReminderService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Production scheduler: creates a notification once a scheduled follow-up is due.
Schedule::call(fn () => app(FollowUpReminderService::class)->sendDueReminders())->everyMinute();
