'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { PageHeader, Card, SearchInput } from '@/components/ui/SharedComponents';
import { getErrorMessage, opsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

type EventType = 'member' | 'payment' | 'system' | 'security' | 'staff';

const typeStyle: Record<EventType, string> = {
    member:   'text-blue-400 bg-blue-500/20',
    payment:  'text-green-400 bg-green-500/20',
    system:   'text-purple-400 bg-purple-500/20',
    security: 'text-red-400 bg-red-500/20',
    staff:    'text-amber-400 bg-amber-500/20',
};

interface Event {
    id: number;
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
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        Promise.all([opsAPI.recentReports(), opsAPI.visits(200)])
            .then(([reports, visits]) => {
                const reportEvents: Event[] = (reports ?? []).map((r: any, i: number) => ({
                    id: i + 1,
                    action: r.title ?? r.kind ?? 'Report item',
                    actor: 'System',
                    actorId: 'SYS',
                    type: r.kind === 'payment' ? 'payment' : 'system',
                    timestamp: String(r.createdAt ?? new Date().toISOString()),
                    detail: r.kind ?? 'Operational event',
                }));
                const visitEvents: Event[] = (visits ?? []).slice(0, 30).map((v: any, i: number) => ({
                    id: 1000 + i,
                    action: v.status === 'denied' ? 'Access denied' : 'Facility access',
                    actor: v.fullName ?? 'Member',
                    actorId: v.personId,
                    type: v.role === 'trainer' || v.role === 'staff' ? 'staff' : 'member',
                    timestamp: String(v.checkInAt ?? v.createdAt ?? new Date().toISOString()),
                    detail: v.status === 'denied' ? (v.denyReason ?? 'Subscription issue') : `Status: ${v.status}`,
                }));
                setEvents([...reportEvents, ...visitEvents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            })
            .catch((err) => toast.error('Failed to load activity log', getErrorMessage(err)));
    }, []);

    const filtered = events.filter(e => {
        const matchS = e.action.toLowerCase().includes(search.toLowerCase()) || e.actor.toLowerCase().includes(search.toLowerCase());
        const matchT = typeFilter === 'all' || e.type === typeFilter;
        return matchS && matchT;
    });

    return (
        <div className="space-y-8">
            <PageHeader
                title="System Activity Log"
                subtitle="Full audit trail for PowerWorld Kiribathgoda"
            />

            <div className="flex flex-col sm:flex-row gap-3">
                <SearchInput
                    id="admin-activities-search"
                    value={search}
                    onChange={setSearch}
                    placeholder="Search events or actors..."
                    className="flex-1 min-w-0"
                    aria-label="Search events or actors"
                />
                <div className="flex gap-2 flex-wrap">
                    {(['all','member','payment','system','security','staff'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTypeFilter(t as EventType | 'all')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${typeFilter === t
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
                {filtered.map(e => (
                    <Card key={e.id} padding="md" className="flex items-start justify-between gap-4 hover:border-zinc-700/50 transition-colors">
                        <div className="flex items-start gap-3">
                            <span className={`text-[10px] px-2 py-1 rounded-full font-semibold mt-0.5 flex-shrink-0 ${typeStyle[e.type]}`}>{e.type}</span>
                            <div>
                                <p className="text-white text-sm font-semibold">{e.action}</p>
                                <p className="text-zinc-500 text-xs">{e.actor} ({e.actorId}) · {e.detail}</p>
                            </div>
                        </div>
                        <span className="text-zinc-600 text-xs flex-shrink-0">{new Date(e.timestamp).toLocaleString()}</span>
                    </Card>
                ))}
                {filtered.length === 0 && <p className="text-center py-8 text-zinc-600">No events found.</p>}
            </div>
        </div>
    );
}
