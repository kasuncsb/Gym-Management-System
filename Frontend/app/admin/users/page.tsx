'use client';

import { useState } from 'react';
import { Users, Search, Plus, ShieldCheck } from 'lucide-react';

type Role = 'member' | 'trainer' | 'manager' | 'admin';
type UserStatus = 'active' | 'inactive' | 'suspended';

const roleColor: Record<Role, string> = {
    admin:   'text-purple-400 bg-purple-500/20',
    manager: 'text-blue-400 bg-blue-500/20',
    trainer: 'text-amber-400 bg-amber-500/20',
    member:  'text-emerald-400 bg-emerald-500/20',
};
const statusStyle: Record<UserStatus, string> = {
    active:    'text-green-400 bg-green-500/20',
    inactive:  'text-yellow-400 bg-yellow-500/20',
    suspended: 'text-red-400 bg-red-500/20',
};

const users = [
    { id: 'PW-A001',   name: 'Admin User',          email: 'admin@powerworld.lk',        role: 'admin'   as Role, status: 'active'    as UserStatus, joined: '2023-01-01' },
    { id: 'PW-M001',   name: 'Branch Manager',      email: 'manager@powerworld.lk',      role: 'manager' as Role, status: 'active'    as UserStatus, joined: '2023-06-01' },
    { id: 'PW-T001',   name: 'Chathurika Silva',    email: 'c.silva@powerworld.lk',      role: 'trainer' as Role, status: 'active'    as UserStatus, joined: '2024-01-15' },
    { id: 'PW-T002',   name: 'Isuru Bandara',       email: 'i.bandara@powerworld.lk',    role: 'trainer' as Role, status: 'active'    as UserStatus, joined: '2024-03-01' },
    { id: 'PW2025001', name: 'Nimal Perera',        email: 'nimal.p@email.com',          role: 'member'  as Role, status: 'active'    as UserStatus, joined: '2025-01-05' },
    { id: 'PW2024087', name: 'Saman Jayasinghe',    email: 'saman.j@email.com',          role: 'member'  as Role, status: 'suspended' as UserStatus, joined: '2024-08-20' },
    { id: 'PW2025022', name: 'Gayani Fernando',     email: 'gayani.f@email.com',         role: 'member'  as Role, status: 'active'    as UserStatus, joined: '2025-01-10' },
];

export default function AdminUsersPage() {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');

    const filtered = users.filter(u => {
        const matchS = u.name.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search) || u.email.includes(search);
        const matchR = roleFilter === 'all' || u.role === roleFilter;
        return matchS && matchR;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                        <Users size={28} className="text-blue-400" /> User Management
                    </h1>
                    <p className="text-zinc-400">Manage all system users — PowerWorld Kiribathgoda</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all">
                    <Plus size={16} /> Add User
                </button>
            </div>

            {/* Role summary */}
            <div className="grid grid-cols-4 gap-4">
                {(['admin','manager','trainer','member'] as Role[]).map(r => (
                    <div key={r} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-center">
                        <p className="text-2xl font-bold text-white">{users.filter(u => u.role === r).length}</p>
                        <p className={`text-xs font-semibold capitalize mt-1 ${roleColor[r].split(' ')[0]}`}>{r}s</p>
                    </div>
                ))}
            </div>

            {/* Search + role filter */}
            <div className="flex gap-3 flex-wrap items-center">
                <div className="relative flex-1 min-w-48">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, ID or email..."
                        className="w-full bg-zinc-900 border border-zinc-700 text-white text-sm rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:border-blue-500" />
                </div>
                <div className="flex gap-2">
                    {(['all','admin','manager','trainer','member'] as const).map(r => (
                        <button key={r} onClick={() => setRoleFilter(r as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${roleFilter === r ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>{r}</button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase">
                            <th className="px-5 py-3 text-left">User</th>
                            <th className="px-5 py-3 text-left">Email</th>
                            <th className="px-5 py-3 text-left">Joined</th>
                            <th className="px-5 py-3 text-center">Role</th>
                            <th className="px-5 py-3 text-center">Status</th>
                            <th className="px-5 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((u, i) => (
                            <tr key={u.id} className={`border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors ${i === filtered.length - 1 ? 'border-none' : ''}`}>
                                <td className="px-5 py-4">
                                    <p className="text-white text-sm font-semibold">{u.name}</p>
                                    <p className="text-zinc-500 text-xs">{u.id}</p>
                                </td>
                                <td className="px-5 py-4 text-zinc-400 text-sm">{u.email}</td>
                                <td className="px-5 py-4 text-zinc-400 text-sm">{u.joined}</td>
                                <td className="px-5 py-4 text-center">
                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${roleColor[u.role]}`}>{u.role}</span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusStyle[u.status]}`}>{u.status}</span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                    <button className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && <p className="text-center py-8 text-zinc-600">No users found.</p>}
            </div>
        </div>
    );
}
