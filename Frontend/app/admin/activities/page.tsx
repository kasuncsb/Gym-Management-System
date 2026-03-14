'use client';

import { useState } from 'react';
import { Activity, Search } from 'lucide-react';

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
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                    <Activity size={28} className="text-red-400" /> System Activity Log
                </h1>
                <p className="text-zinc-400">Full audit trail for PowerWorld Kiribathgoda</p>
            </div>

            {/* Filter bar */}
            <div className="flex gap-3 flex-wrap items-center">
                <div className="relative flex-1 min-w-48">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events or actors..."
                        className="w-full bg-zinc-900 border border-zinc-700 text-white text-sm rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:border-red-500" />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {(['all','member','payment','system','security','staff'] as const).map(t => (
                        <button key={t} onClick={() => setTypeFilter(t as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${typeFilter === t ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>{t}</button>
                    ))}
                </div>
            </div>

            {/* Event list */}
            <div className="space-y-3">
                {filtered.map(e => (
                    <div key={e.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <span className={`text-[10px] px-2 py-1 rounded-full font-semibold mt-0.5 flex-shrink-0 ${typeStyle[e.type]}`}>{e.type}</span>
                            <div>
                                <p className="text-white text-sm font-semibold">{e.action}</p>
                                <p className="text-zinc-500 text-xs">{e.actor} ({e.actorId}) · {e.detail}</p>
                            </div>
                        </div>
                        <span className="text-zinc-600 text-xs flex-shrink-0">{e.timestamp}</span>
                    </div>
                ))}
                {filtered.length === 0 && <p className="text-center py-8 text-zinc-600">No events found.</p>}
            </div>
        </div>
    );
}
