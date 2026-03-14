'use client';

import { useState } from 'react';
import { Users, Search } from 'lucide-react';

type MemberStatus = 'active' | 'inactive' | 'suspended';

const members = [
    { id: 'PW2025001', name: 'Nimal Perera',         plan: 'Premium',   joined: '2025-01-05', status: 'active'    as MemberStatus, checkins: 18, trainerName: 'Chathurika Silva' },
    { id: 'PW2025009', name: 'Chathurika Silva',     plan: 'Elite',     joined: '2024-11-12', status: 'active'    as MemberStatus, checkins: 32, trainerName: 'Isuru Bandara' },
    { id: 'PW2024087', name: 'Saman Jayasinghe',     plan: 'Basic',     joined: '2024-08-20', status: 'inactive'  as MemberStatus, checkins: 4,  trainerName: '—' },
    { id: 'PW2025022', name: 'Gayani Fernando',      plan: 'Premium',   joined: '2025-01-10', status: 'active'    as MemberStatus, checkins: 12, trainerName: 'Chathurika Silva' },
    { id: 'PW2025031', name: 'Thilini Wijesinghe',   plan: 'Basic',     joined: '2025-01-15', status: 'active'    as MemberStatus, checkins: 6,  trainerName: '—' },
    { id: 'PW2024066', name: 'Ruwan Jayawardena',    plan: 'Annual Basic',joined: '2024-06-01',status: 'suspended' as MemberStatus, checkins: 0,  trainerName: '—' },
];

const statusStyle: Record<MemberStatus, string> = {
    active:    'text-green-400 bg-green-500/20',
    inactive:  'text-yellow-400 bg-yellow-500/20',
    suspended: 'text-red-400 bg-red-500/20',
};

export default function ManagerMembersPage() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<MemberStatus | 'all'>('all');

    const filtered = members.filter(m => {
        const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.id.includes(search);
        const matchStatus = filter === 'all' || m.status === filter;
        return matchSearch && matchStatus;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                    <Users size={28} className="text-orange-400" /> Member Management
                </h1>
                <p className="text-zinc-400">Overview of all gym members — PowerWorld Kiribathgoda</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
                {([
                    { label: 'Total Members', value: members.length, color: 'text-white' },
                    { label: 'Active',         value: members.filter(m => m.status === 'active').length,    color: 'text-green-400' },
                    { label: 'Inactive / Suspended', value: members.filter(m => m.status !== 'active').length, color: 'text-yellow-400' },
                ] as const).map(s => (
                    <div key={s.label} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 text-center">
                        <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-zinc-500 text-xs mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Search + filter */}
            <div className="flex gap-3 flex-wrap items-center">
                <div className="relative flex-1 min-w-48">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID..."
                        className="w-full bg-zinc-900 border border-zinc-700 text-white text-sm rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:border-orange-500" />
                </div>
                <div className="flex gap-2">
                    {(['all','active','inactive','suspended'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase">
                            <th className="px-5 py-3 text-left">Member</th>
                            <th className="px-5 py-3 text-left">Plan</th>
                            <th className="px-5 py-3 text-left">Joined</th>
                            <th className="px-5 py-3 text-left">Trainer</th>
                            <th className="px-5 py-3 text-center">Check-ins</th>
                            <th className="px-5 py-3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((m, i) => (
                            <tr key={m.id} className={`border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors ${i === filtered.length - 1 ? 'border-none' : ''}`}>
                                <td className="px-5 py-4">
                                    <p className="text-white text-sm font-semibold">{m.name}</p>
                                    <p className="text-zinc-500 text-xs">{m.id}</p>
                                </td>
                                <td className="px-5 py-4 text-zinc-300 text-sm">{m.plan}</td>
                                <td className="px-5 py-4 text-zinc-400 text-sm">{m.joined}</td>
                                <td className="px-5 py-4 text-zinc-400 text-sm">{m.trainerName}</td>
                                <td className="px-5 py-4 text-center text-zinc-300 text-sm font-semibold">{m.checkins}</td>
                                <td className="px-5 py-4 text-center">
                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusStyle[m.status]}`}>{m.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && <p className="text-center py-8 text-zinc-600">No members found.</p>}
            </div>
        </div>
    );
}
