import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface BmannyMetricCardProps {
    label: string;
    value: string | number;
    description: string;
    icon: LucideIcon;
    accent?: 'blue' | 'gold' | 'navy' | 'green';
}

const accentStyles = {
    blue: { bar: 'bg-[#1547c0]', surface: 'bg-[#f7faff] dark:bg-card', icon: 'text-[#1547c0] dark:text-blue-300' },
    gold: { bar: 'bg-[#d4a72c]', surface: 'bg-[#fffaf0] dark:bg-card', icon: 'text-[#a86f00] dark:text-amber-300' },
    navy: { bar: 'bg-violet-600 dark:bg-violet-500', surface: 'bg-[#f8f6ff] dark:bg-card', icon: 'text-violet-700 dark:text-violet-300' },
    green: { bar: 'bg-emerald-600 dark:bg-emerald-500', surface: 'bg-[#f4fbf7] dark:bg-card', icon: 'text-emerald-700 dark:text-emerald-300' },
};

export function BmannyMetricCard({ label, value, description, icon: Icon, accent = 'blue' }: BmannyMetricCardProps) {
    const styles = accentStyles[accent];

    return (
        <Card className={cn('bmanny-kpi p-0', styles.surface)}>
            <span className={cn('absolute inset-x-0 top-0 h-[3px]', styles.bar)} aria-hidden="true" />
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
                        <p className="mt-3 text-[30px] font-semibold leading-none tracking-tight text-card-foreground">{value}</p>
                    </div>
                    <span className="flex size-9 items-center justify-center rounded-lg border border-current/10 bg-white/65 dark:bg-background/50">
                        <Icon className={cn('size-[18px] shrink-0 stroke-[1.8]', styles.icon)} aria-hidden="true" />
                    </span>
                </div>
                <p className="mt-4 border-t border-border/70 pt-3 text-[13px] text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}
