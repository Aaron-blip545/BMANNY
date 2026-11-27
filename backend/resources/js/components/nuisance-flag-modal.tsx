import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { AlertTriangle, FileX2, Loader2, ShieldAlert, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Incident {
    type: 'inquiry' | 'quotation' | 'order';
    reference: string;
    status: string;
    reason: string;
    date: string | null;
}

interface ClientRiskDetails {
    client_id: number;
    business_name: string;
    contact_person: string | null;
    email: string | null;
    is_flagged_nuisance: boolean;
    nuisance_strikes: number;
    nuisance_reason: string | null;
    nuisance_flagged_at: string | null;
    flagged_by: string | null;
    counts: {
        lost_inquiries: number;
        expired_or_rejected_quotes: number;
        cancelled_orders: number;
        total_strikes: number;
        threshold: number;
    };
    incidents: Incident[];
}

interface NuisanceFlagModalProps {
    clientId: number | null;
    onClose: () => void;
    canToggle?: boolean;
    onFlagChanged?: () => void;
}

export function NuisanceFlagModal({
    clientId,
    onClose,
    canToggle = false,
    onFlagChanged,
}: NuisanceFlagModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [details, setDetails] = useState<ClientRiskDetails | null>(null);
    const [toggling, setToggling] = useState(false);

    useEffect(() => {
        if (!clientId) {
            setDetails(null);
            setError(null);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);

        fetch(`/clients/${clientId}/risk-details`, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        })
            .then(async (res) => {
                if (!res.ok) throw new Error('Unable to load flag details.');
                return (await res.json()) as ClientRiskDetails;
            })
            .then((data) => {
                if (!cancelled) setDetails(data);
            })
            .catch((err) => {
                if (!cancelled) setError(err?.message || 'Unable to load flag details.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [clientId]);

    if (!clientId) return null;

    const handleToggleFlag = () => {
        if (!details) return;
        const currentlyFlagged = details.is_flagged_nuisance;
        const reason = currentlyFlagged
            ? null
            : window.prompt('Reason for flagging this client as a nuisance user:', 'Repeated cancellations / unresponsive inquiries');
        if (!currentlyFlagged && reason === null) return;

        setToggling(true);
        router.post(
            `/clients/${details.client_id}/toggle-nuisance`,
            { is_flagged: !currentlyFlagged, reason },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onFlagChanged?.();
                    onClose();
                },
                onFinish: () => setToggling(false),
            },
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
            onClick={onClose}
        >
            <div
                className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
                    <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                            <ShieldAlert className="size-5" />
                        </span>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-bold text-foreground">
                                    {details ? details.business_name : 'Client Flag Details'}
                                </h3>
                                {details?.is_flagged_nuisance && (
                                    <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">
                                        Flagged · {details.nuisance_strikes} strikes
                                    </span>
                                )}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {details
                                    ? [details.contact_person, details.email].filter(Boolean).join(' · ') || 'Business Client'
                                    : 'Loading nuisance risk & incident history…'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Close flag details"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Loader2 className="size-6 animate-spin text-rose-500" />
                            <p className="mt-2 text-xs">Loading flag details…</p>
                        </div>
                    ) : error ? (
                        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-center text-xs text-rose-600 dark:text-rose-400">
                            {error}
                        </div>
                    ) : details ? (
                        <>
                            {/* Primary Flag Reason Box */}
                            <div
                                className={
                                    details.is_flagged_nuisance
                                        ? 'rounded-xl border border-rose-500/35 bg-rose-500/5 p-4'
                                        : 'rounded-xl border border-border bg-muted/30 p-4'
                                }
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                                        {details.is_flagged_nuisance ? 'Reason for Flag' : 'Current Risk Standing'}
                                    </p>
                                    {details.nuisance_flagged_at && (
                                        <span className="text-[11px] text-muted-foreground">
                                            Flagged on {details.nuisance_flagged_at}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1.5 text-sm font-semibold text-foreground">
                                    {details.nuisance_reason ||
                                        'Not currently flagged. Clients are auto-flagged once they reach 3 strikes.'}
                                </p>
                                {details.flagged_by && (
                                    <p className="mt-1 text-xs text-muted-foreground">{details.flagged_by}</p>
                                )}
                            </div>

                            {/* 3-Column Strike Breakdown */}
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                                    <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
                                        {details.counts.lost_inquiries}
                                    </p>
                                    <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
                                        Lost / Cancelled Inquiries
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                                        {details.counts.expired_or_rejected_quotes}
                                    </p>
                                    <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
                                        Expired / Rejected Quotes
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                                        {details.counts.cancelled_orders}
                                    </p>
                                    <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
                                        Cancelled Orders
                                    </p>
                                </div>
                            </div>

                            {/* Incident History */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Recorded Strike Incidents ({details.incidents.length})
                                    </p>
                                    <span className="text-[11px] text-muted-foreground">
                                        Auto-flag threshold: {details.counts.threshold} strikes
                                    </span>
                                </div>

                                {details.incidents.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-muted-foreground">
                                        <FileX2 className="size-6 opacity-50" />
                                        <p className="mt-2 text-xs">No recorded strike incidents.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {details.incidents.map((inc, idx) => (
                                            <div
                                                key={`${inc.reference}-${idx}`}
                                                className="rounded-xl border border-border/70 bg-background p-3.5 text-xs"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <AlertTriangle className="size-3.5 text-rose-500" />
                                                        <span className="font-bold text-foreground">{inc.reference}</span>
                                                        <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300">
                                                            {inc.status}
                                                        </span>
                                                    </div>
                                                    {inc.date && (
                                                        <span className="text-[11px] text-muted-foreground">{inc.date}</span>
                                                    )}
                                                </div>
                                                <p className="mt-1.5 text-muted-foreground">
                                                    <span className="font-semibold text-foreground">Reason: </span>
                                                    {inc.reason}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/20 px-6 py-3.5">
                    {canToggle && details && (
                        <Button
                            type="button"
                            size="sm"
                            variant={details.is_flagged_nuisance ? 'outline' : 'destructive'}
                            disabled={toggling}
                            onClick={handleToggleFlag}
                        >
                            {toggling
                                ? 'Updating…'
                                : details.is_flagged_nuisance
                                  ? 'Remove Nuisance Flag'
                                  : 'Flag as Nuisance'}
                        </Button>
                    )}
                    <Button type="button" size="sm" variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
