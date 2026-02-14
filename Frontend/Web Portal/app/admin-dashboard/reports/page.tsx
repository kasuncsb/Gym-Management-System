'use client';

import { useState, useEffect } from 'react';
import { reportingAPI, getErrorMessage } from '@/lib/api';
import {
    BarChart3, TrendingUp, TrendingDown, Users, DollarSign,
    Calendar, Loader2, Download, Clock, CreditCard
} from 'lucide-react';

interface RevenueSummary {
    total: number;
    byMethod: { method: string; total: number }[];
    daily: { date: string; revenue: number }[];
    previousMonthTotal: number;
    growthPercent: number;
}

interface RetentionData {
    totalExpired: number;
    renewed: number;
    churned: number;
    retentionRate: number;
}

interface AttendanceData {
    totalVisits: number;
    avgDailyVisits: number;
    peakHour: number;
    daily: { day: string; visits: number }[];
}

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
    const [retention, setRetention] = useState<RetentionData | null>(null);
    const [attendance, setAttendance] = useState<AttendanceData | null>(null);
    const [planPopularity, setPlanPopularity] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'revenue' | 'retention' | 'attendance' | 'plans'>('revenue');
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [revRes, retRes, attRes, planRes] = await Promise.all([
                    reportingAPI.revenue(year, month),
                    reportingAPI.retention(),
                    reportingAPI.attendance(year, month),
                    reportingAPI.planPopularity(),
                ]);
                setRevenue(revRes.data.data);
                setRetention(retRes.data.data);
                setAttendance(attRes.data.data);
                setPlanPopularity(planRes.data.data || []);
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [year, month]);

    const handleExportCSV = () => {
        alert('CSV export coming soon (simulation)');
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-red-500" size={32} />
            </div>
        );
    }

    const tabs = [
        { id: 'revenue' as const, label: 'Revenue', icon: DollarSign },
        { id: 'retention' as const, label: 'Retention', icon: Users },
        { id: 'attendance' as const, label: 'Attendance', icon: Calendar },
        { id: 'plans' as const, label: 'Plan Popularity', icon: CreditCard },
    ];

    const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Business Reports
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">{monthName} — Performance Analysis</p>
                </div>
                <div className="flex items-center gap-3">
                    <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
                        className="px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white outline-none text-sm">
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(year, i).toLocaleDateString('en-US', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                    <select value={year} onChange={(e) => setYear(Number(e.target.value))}
                        className="px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white outline-none text-sm">
                        {[now.getFullYear(), now.getFullYear() - 1].map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <button onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm">
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl">{error}</div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-zinc-800 pb-1">
                {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm transition-colors ${activeTab === tab.id
                            ? 'bg-zinc-800 text-white border-b-2 border-red-500'
                            : 'text-zinc-400 hover:text-white'
                            }`}>
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Revenue Tab */}
            {activeTab === 'revenue' && revenue && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                            <div className="text-sm text-zinc-400 mb-1">Total Revenue</div>
                            <div className="text-3xl font-bold">Rs. {new Intl.NumberFormat('en-LK').format(revenue.total)}</div>
                            <div className={`flex items-center text-sm mt-2 ${revenue.growthPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {revenue.growthPercent >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                                {revenue.growthPercent >= 0 ? '+' : ''}{revenue.growthPercent.toFixed(1)}% vs last month
                            </div>
                        </div>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                            <div className="text-sm text-zinc-400 mb-1">Prev. Month</div>
                            <div className="text-3xl font-bold text-zinc-300">
                                Rs. {new Intl.NumberFormat('en-LK').format(revenue.previousMonthTotal)}
                            </div>
                        </div>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                            <div className="text-sm text-zinc-400 mb-1">Payment Methods</div>
                            <div className="space-y-1 mt-2">
                                {revenue.byMethod.map((m) => (
                                    <div key={m.method} className="flex justify-between text-sm">
                                        <span className="text-zinc-400 capitalize">{m.method}</span>
                                        <span className="text-white font-mono">Rs. {Number(m.total).toLocaleString('en-LK')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Daily revenue bars */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                        <h3 className="text-sm font-medium text-zinc-400 mb-4">Daily Revenue</h3>
                        <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
                            {revenue.daily.map((d) => {
                                const maxVal = Math.max(...revenue.daily.map((x) => Number(x.revenue)), 1);
                                const pct = (Number(d.revenue) / maxVal) * 100;
                                return (
                                    <div key={d.date} className="flex flex-col items-center min-w-[18px] flex-1" title={`${d.date}: Rs. ${Number(d.revenue).toLocaleString('en-LK')}`}>
                                        <div className="w-full bg-red-600/80 rounded-t" style={{ height: `${Math.max(pct, 2)}%` }} />
                                        <span className="text-[9px] text-zinc-500 mt-1 rotate-[-45deg] origin-top-left whitespace-nowrap">
                                            {new Date(d.date).getDate()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Retention Tab */}
            {activeTab === 'retention' && retention && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                        <div className="text-sm text-zinc-400 mb-1">Retention Rate</div>
                        <div className="text-3xl font-bold text-green-400">{retention.retentionRate.toFixed(1)}%</div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                        <div className="text-sm text-zinc-400 mb-1">Total Expired</div>
                        <div className="text-3xl font-bold">{retention.totalExpired}</div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                        <div className="text-sm text-zinc-400 mb-1">Renewed</div>
                        <div className="text-3xl font-bold text-blue-400">{retention.renewed}</div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                        <div className="text-sm text-zinc-400 mb-1">Churned</div>
                        <div className="text-3xl font-bold text-red-400">{retention.churned}</div>
                    </div>
                </div>
            )}

            {/* Attendance Tab */}
            {activeTab === 'attendance' && attendance && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                            <div className="text-sm text-zinc-400 mb-1">Total Visits</div>
                            <div className="text-3xl font-bold">{attendance.totalVisits}</div>
                        </div>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                            <div className="text-sm text-zinc-400 mb-1">Avg. Daily Visits</div>
                            <div className="text-3xl font-bold">{attendance.avgDailyVisits}</div>
                        </div>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                            <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
                                <Clock size={14} /> Peak Hour
                            </div>
                            <div className="text-3xl font-bold">{attendance.peakHour}:00</div>
                        </div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                        <h3 className="text-sm font-medium text-zinc-400 mb-4">Daily Visit Trend</h3>
                        <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
                            {attendance.daily.map((d) => {
                                const maxVal = Math.max(...attendance.daily.map((x) => Number(x.visits)), 1);
                                const pct = (Number(d.visits) / maxVal) * 100;
                                return (
                                    <div key={d.day} className="flex flex-col items-center min-w-[18px] flex-1" title={`${d.day}: ${d.visits} visits`}>
                                        <div className="w-full bg-blue-600/80 rounded-t" style={{ height: `${Math.max(pct, 2)}%` }} />
                                        <span className="text-[9px] text-zinc-500 mt-1 rotate-[-45deg] origin-top-left whitespace-nowrap">
                                            {new Date(d.day).getDate()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Plan Popularity Tab */}
            {activeTab === 'plans' && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-zinc-800/50 text-zinc-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3 text-left">Plan</th>
                                <th className="px-6 py-3 text-right">Active</th>
                                <th className="px-6 py-3 text-right">Total</th>
                                <th className="px-6 py-3 text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {planPopularity.map((p: any, i: number) => (
                                <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{p.planName || p.plan_name}</td>
                                    <td className="px-6 py-4 text-right text-green-400 font-mono">{p.activeCount ?? p.active_count}</td>
                                    <td className="px-6 py-4 text-right text-zinc-400 font-mono">{p.totalCount ?? p.total_count}</td>
                                    <td className="px-6 py-4 text-right text-zinc-400">
                                        Rs. {new Intl.NumberFormat('en-LK').format(Number(p.totalRevenue ?? p.total_revenue ?? 0))}
                                    </td>
                                </tr>
                            ))}
                            {planPopularity.length === 0 && (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-500">No plan data available</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
