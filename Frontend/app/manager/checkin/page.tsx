'use client';

import { useState } from 'react';
import { QrCode, CheckCircle2, LogOut, Users, ShieldCheck } from 'lucide-react';
import { PageHeader, Card, SearchInput } from '@/components/ui/SharedComponents';

interface LogEntry {
    id: string;
    name: string;
    access: 'member' | 'staff' | 'visitor';
    subscription: 'active' | 'expired' | 'visitor';
    type: 'in' | 'out';
    time: string;
}

const log: LogEntry[] = [
    { id: 'PW2025001', name: 'Nimal Perera',       access: 'member', subscription: 'active',  type: 'in',  time: '08:02 AM' },
    { id: 'PW-S004',   name: 'Chathurika Silva',   access: 'staff',  subscription: 'active',  type: 'in',  time: '05:58 AM' },
    { id: 'PW2024087', name: 'Saman Jayasinghe',   access: 'member', subscription: 'expired', type: 'in',  time: '09:10 AM' },
    { id: 'VIS-001',   name: 'Visitor',            access: 'visitor',subscription: 'visitor', type: 'in',  time: '10:00 AM' },
    { id: 'PW2025022', name: 'Gayani Fernando',    access: 'member', subscription: 'active',  type: 'out', time: '10:22 AM' },
];

const accessColor: Record<string, string> = {
    member:  'text-blue-400 bg-blue-500/20',
    staff:   'text-green-400 bg-green-500/20',
    visitor: 'text-yellow-400 bg-yellow-500/20',
};

export default function ManagerCheckinPage() {
    const [search, setSearch] = useState('');
    const filtered  = log.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.id.includes(search));
    const granted   = (l: LogEntry) => l.subscription !== 'expired';
    const totalIns  = log.filter(l => l.type === 'in' && granted(l)).length;
    const totalOuts = log.filter(l => l.type === 'out' && granted(l)).length;
    const inCount   = Math.max(0, totalIns - totalOuts);
    const denied    = log.filter(l => l.subscription === 'expired').length;

    return (
        <div className="space-y-8">
            <PageHeader
                title="Check-in Management"
                subtitle="Monitor entries and exits — PowerWorld Kiribathgoda"
            />

            <div className="grid grid-cols-3 gap-4">
                <Card padding="md" className="hover:border-zinc-700/50 transition-colors">
                    <Users size={20} className="text-blue-400 mb-3" />
                    <p className="text-3xl font-bold text-white">{inCount}</p>
                    <p className="text-zinc-500 text-xs">Currently inside</p>
                </Card>
                <Card padding="md" className="hover:border-zinc-700/50 transition-colors">
                    <ShieldCheck size={20} className="text-green-400 mb-3" />
                    <p className="text-3xl font-bold text-green-400">{log.length - denied}</p>
                    <p className="text-zinc-500 text-xs">Granted today</p>
                </Card>
                <Card padding="md" className="hover:border-zinc-700/50 transition-colors">
                    <CheckCircle2 size={20} className="text-red-400 mb-3" />
                    <p className="text-3xl font-bold text-red-400">{denied}</p>
                    <p className="text-zinc-500 text-xs">Denied (expired)</p>
                </Card>
            </div>

            <Card padding="md">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-white font-semibold">Capacity</span>
                    <span className="text-zinc-400">{inCount} / 80</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-3">
                    <div className={`h-3 rounded-full transition-all ${inCount / 80 > 0.8 ? 'bg-red-500' : inCount / 80 > 0.6 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${(inCount / 80) * 100}%` }} />
                </div>
            </Card>

            <Card padding="lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h2 className="text-lg font-semibold text-white">Today's Access Log</h2>
                    <SearchInput value={search} onChange={setSearch} placeholder="Search..." className="w-full sm:w-56" />
                </div>
                <div className="space-y-2">
                    {filtered.map((l, i) => (
                        <div key={i} className={`flex items-center justify-between rounded-xl p-3 ${l.subscription === 'expired' ? 'bg-red-950/30 border border-red-900/30' : 'bg-zinc-800/30'}`}>
                            <div className="flex items-center gap-3">
                                {l.type === 'in' ? <CheckCircle2 size={16} className={l.subscription === 'expired' ? 'text-red-400' : 'text-green-400'} /> : <LogOut size={16} className="text-zinc-400" />}
                                <div>
                                    <p className="text-white text-sm font-semibold">{l.name}</p>
                                    <p className="text-zinc-500 text-xs">{l.id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${accessColor[l.access]}`}>{l.access}</span>
                                {l.subscription === 'expired' && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-red-400 bg-red-500/20">expired</span>}
                                <span className="text-zinc-500 text-xs">{l.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
