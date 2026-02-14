'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Users, Loader2, Mail, Phone, Calendar, Shield, Search,
    UserCheck, Clock, Briefcase, ChevronDown, RefreshCw
} from 'lucide-react';
import { managerAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

interface StaffMember {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    role: string;
    designation?: string;
    status: string;
    hireDate?: string;
    branchId?: string;
}

const ROLE_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string }> = {
    manager: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: '👔' },
    trainer: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: '🏋️' },
    staff: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: '👤' },
};

export default function ManagerStaffPage() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    const fetchStaff = useCallback(async () => {
        setLoading(true);
        try {
            const res = await managerAPI.getStaffList(1, 100);
            setStaff(res.data.data || []);
        } catch (e) {
            console.error('Failed to load staff:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStaff(); }, [fetchStaff]);

    const filteredStaff = staff.filter(s => {
        const matchSearch = s.fullName.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase()) ||
            (s.designation?.toLowerCase().includes(search.toLowerCase()) ?? false);
        const matchRole = roleFilter === 'all' || s.role === roleFilter;
        return matchSearch && matchRole;
    });

    const stats = {
        total: staff.length,
        trainers: staff.filter(s => s.role === 'trainer').length,
        staff: staff.filter(s => s.role === 'staff').length,
        active: staff.filter(s => s.status === 'active').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-red-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Staff Directory</h2>
                    <p className="text-zinc-400 mt-1">View and manage branch staff members</p>
                </div>
                <button
                    onClick={fetchStaff}
                    className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition font-medium"
                >
                    <RefreshCw size={18} /> Refresh
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl border border-zinc-800 bg-black/40">
                    <div className="flex items-center gap-2 mb-1">
                        <Users size={16} className="text-zinc-500" />
                        <span className="text-sm text-zinc-400">Total Staff</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                </div>
                <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5">
                    <div className="flex items-center gap-2 mb-1">
                        <Briefcase size={16} className="text-blue-400" />
                        <span className="text-sm text-blue-400">Trainers</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-400">{stats.trainers}</div>
                </div>
                <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                    <div className="flex items-center gap-2 mb-1">
                        <Shield size={16} className="text-emerald-400" />
                        <span className="text-sm text-emerald-400">General Staff</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">{stats.staff}</div>
                </div>
                <div className="p-4 rounded-2xl border border-green-500/20 bg-green-500/5">
                    <div className="flex items-center gap-2 mb-1">
                        <UserCheck size={16} className="text-green-400" />
                        <span className="text-sm text-green-400">Active</span>
                    </div>
                    <div className="text-2xl font-bold text-green-400">{stats.active}</div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, email, or designation..."
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:border-red-600 focus:outline-none"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:border-red-600 focus:outline-none"
                >
                    <option value="all">All Roles</option>
                    <option value="trainer">Trainers</option>
                    <option value="staff">Staff</option>
                </select>
                <div className="flex gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-700">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={cn('px-3 py-1.5 rounded-lg text-sm transition', viewMode === 'grid' ? 'bg-red-700 text-white' : 'text-zinc-400 hover:text-white')}
                    >
                        Grid
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={cn('px-3 py-1.5 rounded-lg text-sm transition', viewMode === 'table' ? 'bg-red-700 text-white' : 'text-zinc-400 hover:text-white')}
                    >
                        Table
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {filteredStaff.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-800 bg-black/30 p-16 text-center">
                    <Users className="mx-auto mb-4 text-zinc-600" size={40} />
                    <h3 className="text-xl font-semibold text-zinc-300">No Staff Found</h3>
                    <p className="text-zinc-500 mt-2">
                        {search || roleFilter !== 'all' ? 'Try adjusting your search or filters.' : 'No staff members assigned to this branch.'}
                    </p>
                </div>
            ) : viewMode === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStaff.map(member => {
                        const roleStyle = ROLE_CONFIG[member.role] || ROLE_CONFIG.staff;
                        return (
                            <div key={member.id} className="rounded-2xl border border-zinc-800 bg-black/40 p-5 hover:border-zinc-700 transition-all group">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-red-700 to-red-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                                        {member.fullName.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-white truncate">{member.fullName}</h4>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border capitalize', roleStyle.color, roleStyle.bg, roleStyle.border)}>
                                                {member.role}
                                            </span>
                                            {member.designation && (
                                                <span className="text-xs text-zinc-500">{member.designation}</span>
                                            )}
                                        </div>
                                    </div>
                                    <span className={cn(
                                        'w-2.5 h-2.5 rounded-full shrink-0 mt-1',
                                        member.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-600'
                                    )} title={member.status} />
                                </div>

                                <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                                        <Mail size={14} className="shrink-0 text-zinc-500" />
                                        <span className="truncate">{member.email}</span>
                                    </div>
                                    {member.phone && (
                                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                                            <Phone size={14} className="shrink-0 text-zinc-500" />
                                            <span>{member.phone}</span>
                                        </div>
                                    )}
                                    {member.hireDate && (
                                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                                            <Calendar size={14} className="shrink-0 text-zinc-500" />
                                            <span>Hired {new Date(member.hireDate).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Table View */
                <div className="rounded-2xl border border-zinc-800 bg-black/40 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-900/50 text-zinc-400 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Hire Date</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {filteredStaff.map(member => {
                                    const roleStyle = ROLE_CONFIG[member.role] || ROLE_CONFIG.staff;
                                    return (
                                        <tr key={member.id} className="hover:bg-zinc-900/30">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-red-600/10 flex items-center justify-center text-red-500 text-sm font-bold">
                                                        {member.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-white">{member.fullName}</div>
                                                        {member.designation && <div className="text-xs text-zinc-500">{member.designation}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={cn('px-2 py-1 rounded-full text-xs font-medium border capitalize', roleStyle.color, roleStyle.bg, roleStyle.border)}>
                                                    {member.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="text-zinc-300">{member.email}</div>
                                                {member.phone && <div className="text-xs text-zinc-500">{member.phone}</div>}
                                            </td>
                                            <td className="px-6 py-3 text-zinc-400">
                                                {member.hireDate ? new Date(member.hireDate).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={cn(
                                                    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
                                                    member.status === 'active'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                                                )}>
                                                    <span className={cn('w-1.5 h-1.5 rounded-full', member.status === 'active' ? 'bg-emerald-400' : 'bg-zinc-500')} />
                                                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
