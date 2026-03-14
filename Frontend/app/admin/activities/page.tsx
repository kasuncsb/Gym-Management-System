'use client';

import { useState } from 'react';
import { Activity } from 'lucide-react';
import { PageHeader, Card, SearchInput } from '@/components/ui/SharedComponents';

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

const events: Event[] = [
    { id: 1,  action: 'New member registered',     actor: 'Nimal Perera',       actorId: 'PW2025035', type: 'member',   timestamp: '2025-01-17 09:12:03', detail: 'Premium plan selected' },
    { id: 2,  action: 'Payment processed',          actor: 'Chathurika Silva',   actorId: 'PW2025009', type: 'payment',  timestamp: '2025-01-17 09:00:15', detail: 'Rs.4,900 — Premium plan renewal' },
    { id: 3,  action: 'System backup completed',    actor: 'System',             actorId: 'SYS',       type: 'system',   timestamp: '2025-01-17 03:00:00', detail: 'Full backup — 512 MB' },
    { id: 4,  action: 'Failed login attempt',       actor: 'Unknown',            actorId: '—',         type: 'security', timestamp: '2025-01-16 23:44:12', detail: '3 attempts from 192.168.1.55' },
    { id: 5,  action: 'Plan updated',               actor: 'Admin User',         actorId: 'PW-A001',   type: 'system',   timestamp: '2025-01-16 15:30:00', detail: 'Elite plan price changed to Rs.7,900' },
    { id: 6,  action: 'Staff check-in',             actor: 'Chathurika Silva',   actorId: 'PW-T001',   type: 'staff',    timestamp: '2025-01-16 06:01:44', detail: 'Trainer on duty — morning shift' },
    { id: 7,  action: 'Subscription cancelled',     actor: 'Saman Jayasinghe',   actorId: 'PW2024087', type: 'member',   timestamp: '2025-01-15 11:20:33', detail: 'Member requested cancellation' },
    { id: 8,  action: 'Payment failed',             actor: 'Ruwan Jayawardena',  actorId: 'PW2025009', type: 'payment',  timestamp: '2025-01-14 08:05:00', detail: 'Card expired' },
];

export default function AdminActivitiesPage() {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');

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
                    value={search}
                    onChange={setSearch}
                    placeholder="Search events or actors..."
                    className="flex-1 min-w-0"
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
                        <span className="text-zinc-600 text-xs flex-shrink-0">{e.timestamp}</span>
                    </Card>
                ))}
                {filtered.length === 0 && <p className="text-center py-8 text-zinc-600">No events found.</p>}
            </div>
        </div>
    );
}
