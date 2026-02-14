'use client';

import { useState, useEffect, useCallback } from 'react';
import { auditAPI, getErrorMessage } from '@/lib/api';
import {
    ShieldCheck, Search, Download, Loader2, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';

interface AuditLog {
    id: string;
    actorId: string;
    actorName: string | null;
    actorEmail: string | null;
    action: string;
    targetType: string;
    targetId: string | null;
    metadata: string | null;
    ipAddress: string | null;
    createdAt: string;
}

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actions, setActions] = useState<string[]>([]);
    const [targetTypes, setTargetTypes] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [filterAction, setFilterAction] = useState('');
    const [filterTargetType, setFilterTargetType] = useState('');
    const [searchText, setSearchText] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await auditAPI.query({
                page,
                limit: 25,
                action: filterAction || undefined,
                targetType: filterTargetType || undefined,
                search: searchText || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            });
            const data = res.data.data;
            setLogs(data?.logs || data?.items || []);
            setTotalPages(data?.pagination?.totalPages || 1);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [page, filterAction, filterTargetType, searchText, startDate, endDate]);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [actRes, ttRes] = await Promise.all([
                    auditAPI.getActions(),
                    auditAPI.getTargetTypes(),
                ]);
                setActions(actRes.data.data || []);
                setTargetTypes(ttRes.data.data || []);
            } catch { /* silent */ }
        };
        fetchFilters();
    }, []);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const handleExport = async () => {
        try {
            const res = await auditAPI.export({
                action: filterAction || undefined,
                targetType: filterTargetType || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            });
            const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const resetFilters = () => {
        setFilterAction('');
        setFilterTargetType('');
        setSearchText('');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-gray-400 flex items-center gap-3">
                        <ShieldCheck className="text-red-500" size={28} /> Audit Log
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">System activity tracking and compliance</p>
                </div>
                <button onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm">
                    <Download size={14} /> Export JSON
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl">{error}</div>
            )}

            {/* Filters */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3 text-sm text-zinc-400">
                    <Filter size={14} /> Filters
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                        <input
                            placeholder="Search..."
                            value={searchText}
                            onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                    <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
                        className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm outline-none">
                        <option value="">All Actions</option>
                        {actions.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <select value={filterTargetType} onChange={(e) => { setFilterTargetType(e.target.value); setPage(1); }}
                        className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm outline-none">
                        <option value="">All Target Types</option>
                        {targetTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                        className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm outline-none" placeholder="Start date" />
                    <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                        className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm outline-none" placeholder="End date" />
                </div>
                {(filterAction || filterTargetType || searchText || startDate || endDate) && (
                    <button onClick={resetFilters} className="mt-3 text-xs text-red-400 hover:text-red-300">
                        Clear all filters
                    </button>
                )}
            </div>

            {/* Logs Table */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="animate-spin text-red-500" size={24} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-zinc-800/50 text-zinc-400 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 text-left">Time</th>
                                    <th className="px-4 py-3 text-left">Actor</th>
                                    <th className="px-4 py-3 text-left">Action</th>
                                    <th className="px-4 py-3 text-left">Target</th>
                                    <th className="px-4 py-3 text-left">IP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-4 py-3 text-zinc-400 whitespace-nowrap text-xs">
                                            {new Date(log.createdAt).toLocaleString('en-LK', { timeZone: 'Asia/Colombo' })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-white text-xs">{log.actorName || 'System'}</div>
                                            <div className="text-zinc-500 text-xs">{log.actorEmail}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs font-mono">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-zinc-400 text-xs">
                                            {log.targetType}{log.targetId ? ` / ${log.targetId.slice(0, 8)}...` : ''}
                                        </td>
                                        <td className="px-4 py-3 text-zinc-500 text-xs font-mono">
                                            {log.ipAddress || '—'}
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                                            No audit logs found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
                        <span className="text-xs text-zinc-500">Page {page} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                                className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 disabled:opacity-30">
                                <ChevronLeft size={16} />
                            </button>
                            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                                className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 disabled:opacity-30">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
