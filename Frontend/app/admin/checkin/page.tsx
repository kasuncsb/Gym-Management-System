'use client';

import { useState } from 'react';
import { ShieldCheck, CheckCircle2, LogOut, Search, Users, AlertTriangle } from 'lucide-react';

type AccessLevel = 'member' | 'staff' | 'admin' | 'visitor';

const accessStyle: Record<AccessLevel, string> = {
    member:  'text-blue-400 bg-blue-500/20',
    staff:   'text-green-400 bg-green-500/20',
    admin:   'text-purple-400 bg-purple-500/20',
    visitor: 'text-yellow-400 bg-yellow-500/20',
};

interface LogEntry {
    id: string;
    name: string;
    access: AccessLevel;
    subscription: 'active' | 'expired' | 'n/a';
    type: 'in' | 'out';
    time: string;
    granted: boolean;
}

const log: LogEntry[] = [
    { id: 'PW-A001',   name: 'Admin User',        access: 'admin',   subscription: 'n/a',     type: 'in',  time: '05:55 AM', granted: true },
    { id: 'PW-T001',   name: 'Chathurika Silva',  access: 'staff',   subscription: 'n/a',     type: 'in',  time: '06:00 AM', granted: true },
    { id: 'PW2025001', name: 'Nimal Perera',       access: 'member',  subscription: 'active',  type: 'in',  time: '06:32 AM', granted: true },
    { id: 'PW2024087', name: 'Saman Jayasinghe',  access: 'member',  subscription: 'expired', type: 'in',  time: '09:10 AM', granted: false },
    { id: 'PW2025022', name: 'Gayani Fernando',   access: 'member',  subscription: 'active',  type: 'out', time: '10:22 AM', granted: true },
    { id: 'VIS-001',   name: 'Walk-in Visitor',  access: 'visitor', subscription: 'n/a',     type: 'in',  time: '11:00 AM', granted: true },
];

export default function AdminCheckinPage() {
    const [search, setSearch] = useState('');

    const filtered = log.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.id.includes(search));
    // Subtract granted check-outs so members who have left are not counted as inside.
    const grantedIns  = log.filter(l => l.type === 'in'  && l.granted).length;
    const grantedOuts = log.filter(l => l.type === 'out' && l.granted).length;
    const inCount     = Math.max(0, grantedIns - grantedOuts);
    const denied      = log.filter(l => !l.granted).length;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                    <ShieldCheck size={28} className="text-purple-400" /> Access Control
                </h1>
                <p className="text-zinc-400">Full access log for PowerWorld Kiribathgoda</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 text-center">
                    <Users size={20} className="text-blue-400 mb-2 mx-auto" />
                    <p className="text-2xl font-bold text-white">{inCount}</p>
                    <p className="text-zinc-500 text-xs">Inside now</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 text-center">
                    <CheckCircle2 size={20} className="text-green-400 mb-2 mx-auto" />
                    <p className="text-2xl font-bold text-green-400">{log.filter(l => l.granted).length}</p>
                    <p className="text-zinc-500 text-xs">Granted today</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 text-center">
                    <AlertTriangle size={20} className="text-red-400 mb-2 mx-auto" />
                    <p className="text-2xl font-bold text-red-400">{denied}</p>
                    <p className="text-zinc-500 text-xs">Denied today</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 text-center">
                    <ShieldCheck size={20} className="text-purple-400 mb-2 mx-auto" />
                    <p className="text-2xl font-bold text-white">{inCount} / 80</p>
                    <p className="text-zinc-500 text-xs">Capacity</p>
                </div>
            </div>

            {/* Capacity bar */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-white font-semibold">Current Occupancy</span>
                    <span className="text-zinc-400">{inCount} / 80</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-3">
                    <div className={`h-3 rounded-full transition-all ${inCount/80 > 0.8 ? 'bg-red-500' : inCount/80 > 0.6 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${(inCount/80)*100}%` }} />
                </div>
            </div>

            {/* Log */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Full Access Log</h2>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                            className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-purple-500 w-44" />
                    </div>
                </div>
                <div className="space-y-2">
                    {filtered.map((l, i) => (
                        <div key={i} className={`flex items-center justify-between rounded-xl p-3 ${!l.granted ? 'bg-red-950/30 border border-red-900/30' : 'bg-zinc-800/30'}`}>
                            <div className="flex items-center gap-3">
                                {l.type === 'in'
                                    ? <CheckCircle2 size={16} className={l.granted ? 'text-green-400' : 'text-red-400'} />
                                    : <LogOut size={16} className="text-zinc-400" />
                                }
                                <div>
                                    <p className="text-white text-sm font-semibold">{l.name}</p>
                                    <p className="text-zinc-500 text-xs">{l.id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${accessStyle[l.access]}`}>{l.access}</span>
                                {!l.granted && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-red-500/20 text-red-400">denied</span>}
                                <span className="text-zinc-500 text-xs">{l.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
