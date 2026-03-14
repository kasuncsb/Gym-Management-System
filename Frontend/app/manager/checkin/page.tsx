'use client';

import { useState } from 'react';
import { QrCode, CheckCircle2, LogOut, Search, Users, ShieldCheck } from 'lucide-react';

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
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                    <QrCode size={28} className="text-blue-400" /> Check-in Management
                </h1>
                <p className="text-zinc-400">Monitor entries and exits — PowerWorld Kiribathgoda</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                    <Users size={20} className="text-blue-400 mb-3" />
                    <p className="text-3xl font-bold text-white">{inCount}</p>
                    <p className="text-zinc-500 text-xs">Currently inside</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                    <ShieldCheck size={20} className="text-green-400 mb-3" />
                    <p className="text-3xl font-bold text-green-400">{log.length - denied}</p>
                    <p className="text-zinc-500 text-xs">Granted today</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                    <CheckCircle2 size={20} className="text-red-400 mb-3" />
                    <p className="text-3xl font-bold text-red-400">{denied}</p>
                    <p className="text-zinc-500 text-xs">Denied (expired)</p>
                </div>
            </div>

            {/* Capacity bar */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-white font-semibold">Capacity</span>
                    <span className="text-zinc-400">{inCount} / 80</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-3">
                    <div className={`h-3 rounded-full transition-all ${inCount / 80 > 0.8 ? 'bg-red-500' : inCount / 80 > 0.6 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${(inCount / 80) * 100}%` }} />
                </div>
            </div>

            {/* Searchable log */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Today's Access Log</h2>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                            className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 w-44" />
                    </div>
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
            </div>
        </div>
    );
}
