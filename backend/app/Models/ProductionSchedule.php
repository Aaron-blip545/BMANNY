<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductionSchedule extends Model
{
    use HasFactory;

    protected $primaryKey = 'schedule_id';

    protected $fillable = [
        'order_id',
        'batch_code',
        'production_start_date',
        'target_end_date',
        'actual_start_date',
        'actual_end_date',
        'planned_quantity',
        'daily_capacity_units',
        'priority',
        'production_status',
        'production_notes',
        'scheduled_by',
    ];

    protected $casts = [
        'production_start_date' => 'date:Y-m-d',
        'target_end_date'       => 'date:Y-m-d',
        'actual_start_date'     => 'date:Y-m-d',
        'actual_end_date'       => 'date:Y-m-d',
        'planned_quantity'      => 'integer',
        'daily_capacity_units'  => 'integer',
    ];

    protected $appends = ['is_overdue'];

    public function getIsOverdueAttribute(): bool
    {
        if (in_array($this->production_status, ['completed', 'cancelled'], true)) {
            return false;
        }
        if (! $this->target_end_date) {
            return false;
        }

        return Carbon::parse($this->target_end_date)->endOfDay()->isPast();
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id', 'order_id');
    }

    public function scheduler()
    {
        return $this->belongsTo(User::class, 'scheduled_by', 'user_id');
    }
}
