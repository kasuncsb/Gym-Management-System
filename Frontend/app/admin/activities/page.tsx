'use client';

import { useEffect, useState } from 'react';
import { PageHeader, Card, SearchInput } from '@/components/ui/SharedComponents';
import { getErrorMessage, opsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

type EventType = 'member' | 'payment' | 'system' | 'security' | 'trainer' | 'access' | 'config';

const typeStyle: Record<string, string> = {
    member: 'text-blue-400 bg-blue-500/20',
    payment: 'text-green-400 bg-green-500/20',
    system: 'text-purple-400 bg-purple-500/20',
    security: 'text-red-400 bg-red-500/20',
    trainer: 'text-amber-400 bg-amber-500/20',
    access: 'text-cyan-400 bg-cyan-500/20',
    config: 'text-pink-400 bg-pink-500/20',
};

interface Row {
    id: string;
    action: string;
    actor: string;
    actorId: string;
    type: EventType;
    timestamp: string;
    detail: string;
}

export default function AdminActivitiesPage() {
    const toast = useToast();
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');
    const [events, setEvents] = useState<Row[]>([]);

    useEffect(() => {
        opsAPI
            .auditLogs(800)
            .then((rows: any[]) => {
                setEvents(
                    (rows ?? []).map((r) => ({
                        id: r.id,
                        action: r.action ?? 'event',
                        actor: r.actorLabel ?? r.actorId ?? 'System',
                        actorId: r.actorId ?? '—',
                        type: (r.category ?? 'system') as EventType,
                        timestamp: String(r.createdAt ?? ''),
                        detail: [r.entityType, r.entityId, r.detail].filter(Boolean).join(' · ') || '—',
                    })),
                );
            })
            .catch((err) => toast.error('Failed to load activity log', getErrorMessage(err)));
    }, []);

    const filtered = events.filter((e) => {
        const matchS =
            e.action.toLowerCase().includes(search.toLowerCase()) ||
            e.actor.toLowerCase().includes(search.toLowerCase()) ||
            e.detail.toLowerCase().includes(search.toLowerCase());
        const matchT = typeFilter === 'all' || e.type === typeFilter;
        return matchS && matchT;
    });

    const filters: Array<EventType | 'all'> = ['all', 'member', 'payment', 'system', 'security', 'trainer', 'access', 'config'];

    return (
        <div className="space-y-8">
            <PageHeader title="System activity log" subtitle="Append-only audit trail (check-ins, payments, config, broadcasts, …)" />

            <div className="flex flex-col sm:flex-row gap-3">
                <SearchInput
                    id="admin-activities-search"
                    value={search}
                    onChange={setSearch}
                    placeholder="Search actions, actors, details…"
                    className="flex-1 min-w-0"
                    aria-label="Search"
                />
                <div className="flex gap-2 flex-wrap">
                    {filters.map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTypeFilter(t)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                                typeFilter === t
                                    ? 'bg-red-600 text-white border border-red-500'
                                    : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                {filtered.map((e) => (
                    <Card key={e.id} padding="md" className="flex items-start justify-between gap-4 hover:border-zinc-700/50 transition-colors">
                        <div className="flex items-start gap-3 min-w-0">
                            <span
                                className={`text-[10px] px-2 py-1 rounded-full font-semibold mt-0.5 flex-shrink-0 ${typeStyle[e.type] ?? typeStyle.system}`}
                            >
                                {e.type}
                            </span>
                            <div className="min-w-0">
                                <p className="text-white text-sm font-semibold">{e.action}</p>
                                <p className="text-zinc-500 text-xs break-words">
                                    {e.actor} ({e.actorId}) · {e.detail}
                                </p>
                            </div>
                        </div>
                        <span className="text-zinc-600 text-xs flex-shrink-0">{new Date(e.timestamp).toLocaleString()}</span>
                    </Card>
                ))}
                {filtered.length === 0 && <p className="text-center py-8 text-zinc-600">No events found. Run DB migration if the audit table is missing.</p>}
            </div>
        </div>
    );
}
