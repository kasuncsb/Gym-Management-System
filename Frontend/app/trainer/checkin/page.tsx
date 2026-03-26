'use client';

import { useCallback, useEffect, useState } from 'react';
import { DoorQrCheckIn } from '@/components/checkin/DoorQrCheckIn';
import { Card, PageHeader, SearchInput } from '@/components/ui/SharedComponents';
import { getErrorMessage, opsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { useRealtimePolling } from '@/hooks/useRealtimePolling';

export default function TrainerCheckinPage() {
    const toast = useToast();
    const [search, setSearch] = useState('');
    const [rows, setRows] = useState<any[]>([]);

    const refresh = useCallback(async () => {
        const visits = await opsAPI.visits(120);
        setRows(visits ?? []);
    }, []);

    useEffect(() => {
        refresh().catch((e) => toast.error('Failed to load visits', getErrorMessage(e)));
    }, [refresh, toast]);

    useRealtimePolling(() => {
        refresh().catch(() => undefined);
    }, 10000);

    const filtered = rows.filter(
        (v) =>
            String(v.fullName ?? '')
                .toLowerCase()
                .includes(search.toLowerCase()) || String(v.personId ?? '').includes(search),
    );

    return (
        <div className="space-y-10">
            <DoorQrCheckIn
                title="Check-in"
                subtitle="Scan the simulator door QR to record your own entry or exit. Subscription rules apply to members only."
            />

            <div className="space-y-4">
                <PageHeader title="Branch activity" subtitle="Live visit stream (trainer desk view)" />
                <SearchInput id="trainer-checkin-search" value={search} onChange={setSearch} placeholder="Search by name or ID…" />
                <Card padding="md" className="max-h-[28rem] overflow-y-auto space-y-2">
                    {filtered.map((v: any) => (
                        <div
                            key={v.id}
                            className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-zinc-800/80 last:border-0 text-sm"
                        >
                            <span className="text-white font-medium">{v.fullName ?? v.personId}</span>
                            <span className="text-zinc-500 text-xs">{v.role}</span>
                            <span
                                className={
                                    v.status === 'denied'
                                        ? 'text-red-400'
                                        : v.status === 'active'
                                          ? 'text-emerald-400'
                                          : 'text-zinc-400'
                                }
                            >
                                {v.status}
                            </span>
                            <span className="text-zinc-500 text-xs">
                                {new Date(v.checkInAt ?? v.createdAt).toLocaleString()}
                            </span>
                        </div>
                    ))}
                    {filtered.length === 0 && <p className="text-zinc-600 text-sm py-6 text-center">No matching visits.</p>}
                </Card>
            </div>
        </div>
    );
}
