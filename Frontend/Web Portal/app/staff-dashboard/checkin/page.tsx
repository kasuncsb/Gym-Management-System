'use client';

import { useState, useEffect } from 'react';
import { staffAPI } from '@/lib/api';
import { LogIn, LogOut, Search, Clock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CheckInRecord {
    id: string;
    user: {
        id: string;
        fullName: string;
        email: string;
        memberCode: string;
    };
    gate: {
        id: string;
        name: string;
    };
    timestamp: string;
    type: 'in' | 'out';
    status: 'success' | 'failure';
}

export default function StaffCheckInLogPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<CheckInRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('');

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await staffAPI.getTodayCheckIns();
            if (response.data.success) {
                setLogs(response.data.data);
            } else {
                setError('Failed to load logs');
            }
        } catch (err: any) {
            setError(err.message || 'Error loading logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log =>
        log.user.fullName.toLowerCase().includes(filter.toLowerCase()) ||
        log.user.memberCode?.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    Today's Access Log
                </h1>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search member..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-neutral-800 border border-white/5 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-white/20 w-64"
                        />
                    </div>
                    <button
                        onClick={fetchLogs}
                        className="p-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl">
                    {error}
                </div>
            )}

            <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Time</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Member</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Action</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Gate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="border-b border-white/5 animate-pulse">
                                        <td className="py-4 px-6"><div className="h-4 bg-white/10 rounded w-20"></div></td>
                                        <td className="py-4 px-6"><div className="h-4 bg-white/10 rounded w-48 mb-1"></div><div className="h-3 bg-white/5 rounded w-24"></div></td>
                                        <td className="py-4 px-6"><div className="h-6 bg-white/10 rounded w-24"></div></td>
                                        <td className="py-4 px-6"><div className="h-4 bg-white/10 rounded w-32"></div></td>
                                    </tr>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-gray-500">
                                        No check-in activity recorded today
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2 text-gray-300">
                                                <Clock size={14} className="text-gray-500" />
                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-gray-400">
                                                    <User size={14} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{log.user.fullName}</div>
                                                    <div className="text-xs text-gray-500">{log.user.memberCode}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border
                                                ${log.type === 'in'
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                    : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                                {log.type === 'in' ? <LogIn size={12} /> : <LogOut size={12} />}
                                                {log.type === 'in' ? 'Check In' : 'Check Out'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-gray-400 text-sm">
                                            {log.gate?.name || 'Main Entrance'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
