'use client';

import { useState, useEffect } from 'react';
import { analyticsAPI, getErrorMessage } from '@/lib/api';
import {
    LineChart, Users, TrendingUp, TrendingDown, Activity,
    BarChart3, Clock, Trophy, CreditCard
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

interface GrowthData { month: string; newMembers: number; totalMembers: number }
interface RevenueTrend { month: string; revenue: number }
interface HeatmapCell { day: string; hour: number; visits: number }
interface ChurnData { month: string; expired: number }
interface DailyVisit { date: string; visits: number }
interface EquipUtil { id: string; name: string; status: string; openIssues: number; totalMaintenance: number }
interface TopMember { memberId: string; name: string; visits: number }

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [growth, setGrowth] = useState<GrowthData[]>([]);
    const [revTrend, setRevTrend] = useState<RevenueTrend[]>([]);
    const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
    const [churn, setChurn] = useState<ChurnData[]>([]);
    const [occupancy, setOccupancy] = useState(0);
    const [dailyVisits, setDailyVisits] = useState<DailyVisit[]>([]);
    const [equipUtil, setEquipUtil] = useState<EquipUtil[]>([]);
    const [subDist, setSubDist] = useState<any[]>([]);
    const [topMembers, setTopMembers] = useState<TopMember[]>([]);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [g, r, h, c, o, d, e, s, t] = await Promise.all([
                    analyticsAPI.memberGrowth(12),
                    analyticsAPI.revenueTrend(12),
                    analyticsAPI.attendanceHeatmap(90),
                    analyticsAPI.churnTrend(12),
                    analyticsAPI.occupancy(),
                    analyticsAPI.dailyVisits(30),
                    analyticsAPI.equipmentUtilization(),
                    analyticsAPI.subscriptionDistribution(),
                    analyticsAPI.topMembers(30, 10),
                ]);
                setGrowth(g.data.data || []);
                setRevTrend(r.data.data || []);
                setHeatmap(h.data.data || []);
                setChurn(c.data.data || []);
                setOccupancy(o.data.data?.currentOccupancy || 0);
                setDailyVisits(d.data.data || []);
                setEquipUtil(e.data.data || []);
                setSubDist(s.data.data || []);
                setTopMembers(t.data.data || []);
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    if (loading) {
        return (
            <div className="space-y-8 page-enter">
                <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64" /></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>
                <Skeleton className="h-48 rounded-2xl" />
            </div>
        );
    }

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 18 }, (_, i) => i + 5); // 5-22

    // Build heatmap lookup
    const heatLookup = new Map<string, number>();
    let heatMax = 1;
    for (const cell of heatmap) {
        const key = `${cell.day}-${cell.hour}`;
        heatLookup.set(key, cell.visits);
        if (cell.visits > heatMax) heatMax = cell.visits;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-gray-400">
                    Analytics Dashboard
                </h1>
                <p className="text-gray-400 text-sm mt-1">Real-time insights and trends</p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl">{error}</div>
            )}

            {/* Occupancy Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-linear-to-br from-red-900/30 to-red-800/10 border border-red-800/30 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="text-red-400" size={20} />
                        <span className="text-sm text-zinc-400">Current Occupancy</span>
                    </div>
                    <div className="text-4xl font-bold">{occupancy}</div>
                    <p className="text-xs text-zinc-500 mt-1">Members currently in gym</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="text-blue-400" size={20} />
                        <span className="text-sm text-zinc-400">Member Growth (Last Month)</span>
                    </div>
                    <div className="text-4xl font-bold">
                        {growth.length > 0 ? growth[growth.length - 1].newMembers : 0}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">New members joined</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="text-green-400" size={20} />
                        <span className="text-sm text-zinc-400">Avg Daily Visits (30d)</span>
                    </div>
                    <div className="text-4xl font-bold">
                        {dailyVisits.length > 0 ? Math.round(dailyVisits.reduce((s, d) => s + d.visits, 0) / dailyVisits.length) : 0}
                    </div>
                </div>
            </div>

            {/* Revenue Trend */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                    <BarChart3 size={16} /> Revenue Trend (12 Months)
                </h3>
                <div className="flex items-end gap-2 h-44 overflow-x-auto pb-6">
                    {revTrend.map((r) => {
                        const maxVal = Math.max(...revTrend.map((x) => Number(x.revenue)), 1);
                        const pct = (Number(r.revenue) / maxVal) * 100;
                        return (
                            <div key={r.month} className="flex flex-col items-center flex-1 min-w-9" title={`${r.month}: Rs. ${Number(r.revenue).toLocaleString('en-LK')}`}>
                                <div className="w-full bg-linear-to-t from-green-700 to-green-500 rounded-t opacity-80" style={{ height: `${Math.max(pct, 3)}%` }} />
                                <span className="text-[10px] text-zinc-500 mt-2 whitespace-nowrap">{r.month.slice(5)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Member Growth */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                    <Users size={16} /> Member Growth (12 Months)
                </h3>
                <div className="flex items-end gap-2 h-36 overflow-x-auto pb-6">
                    {growth.map((g) => {
                        const maxVal = Math.max(...growth.map((x) => x.newMembers), 1);
                        const pct = (g.newMembers / maxVal) * 100;
                        return (
                            <div key={g.month} className="flex flex-col items-center flex-1 min-w-9" title={`${g.month}: ${g.newMembers} new, ${g.totalMembers} total`}>
                                <div className="w-full bg-linear-to-t from-blue-700 to-blue-500 rounded-t opacity-80" style={{ height: `${Math.max(pct, 3)}%` }} />
                                <span className="text-[10px] text-zinc-500 mt-2 whitespace-nowrap">{g.month.slice(5)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Attendance Heatmap */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                    <Clock size={16} /> Attendance Heatmap (Last 90 Days)
                </h3>
                <div className="overflow-x-auto">
                    <div className="min-w-150">
                        {/* Hour headers */}
                        <div className="flex">
                            <div className="w-12" />
                            {hours.map((h) => (
                                <div key={h} className="flex-1 text-center text-[10px] text-zinc-500 pb-1">
                                    {h}:00
                                </div>
                            ))}
                        </div>
                        {/* Rows */}
                        {days.map((day) => (
                            <div key={day} className="flex items-center gap-px mb-px">
                                <div className="w-12 text-xs text-zinc-500 pr-2 text-right">{day}</div>
                                {hours.map((h) => {
                                    const v = heatLookup.get(`${day}-${h}`) || 0;
                                    const intensity = v / heatMax;
                                    return (
                                        <div
                                            key={h}
                                            className="flex-1 aspect-square rounded-sm"
                                            style={{
                                                backgroundColor: v > 0
                                                    ? `rgba(239, 68, 68, ${0.1 + intensity * 0.8})`
                                                    : 'rgba(63, 63, 70, 0.3)',
                                            }}
                                            title={`${day} ${h}:00 — ${v} visits`}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                        {/* Legend */}
                        <div className="flex items-center justify-end gap-2 mt-3">
                            <span className="text-[10px] text-zinc-500">Less</span>
                            {[0.1, 0.3, 0.5, 0.7, 0.9].map((o) => (
                                <div key={o} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(239, 68, 68, ${o})` }} />
                            ))}
                            <span className="text-[10px] text-zinc-500">More</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Subscription Distribution + Top Members */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subscription Distribution */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                        <CreditCard size={16} /> Subscription Distribution
                    </h3>
                    {subDist.length > 0 ? (
                        <div className="space-y-3">
                            {subDist.map((s: any, i: number) => {
                                const total = subDist.reduce((sum: number, x: any) => sum + Number(x.active_count || x.activeCount || 0), 0) || 1;
                                const pct = (Number(s.active_count || s.activeCount || 0) / total) * 100;
                                return (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-white">{s.plan_name || s.planName}</span>
                                            <span className="text-zinc-400">{s.active_count || s.activeCount} active</span>
                                        </div>
                                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-linear-to-r from-red-600 to-red-400 rounded-full"
                                                style={{ width: `${Math.max(pct, 2)}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-sm">No subscription data available</p>
                    )}
                </div>

                {/* Top Members */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                        <Trophy size={16} /> Top Members (Last 30 Days)
                    </h3>
                    {topMembers.length > 0 ? (
                        <div className="space-y-2">
                            {topMembers.map((m, i) => (
                                <div key={m.memberId} className="flex items-center gap-3 py-2">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-linear-to-br from-yellow-600 to-yellow-500 text-black' : 'bg-zinc-800 text-zinc-400'
                                        }`}>
                                        {i + 1}
                                    </div>
                                    <span className="flex-1 text-sm text-white">{m.name}</span>
                                    <span className="text-sm text-zinc-400 font-mono">{m.visits} visits</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-sm">No visit data available</p>
                    )}
                </div>
            </div>

            {/* Equipment Utilization */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                    Equipment Utilization
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-zinc-500 text-xs uppercase">
                            <tr>
                                <th className="text-left pb-3">Equipment</th>
                                <th className="text-center pb-3">Status</th>
                                <th className="text-right pb-3">Open Issues</th>
                                <th className="text-right pb-3">Total Maintenance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {equipUtil.map((eq) => (
                                <tr key={eq.id} className="hover:bg-zinc-800/30">
                                    <td className="py-2 text-white">{eq.name}</td>
                                    <td className="py-2 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${eq.status === 'operational' ? 'bg-green-500/10 text-green-400'
                                            : eq.status === 'maintenance' ? 'bg-yellow-500/10 text-yellow-400'
                                                : 'bg-red-500/10 text-red-400'}`}>
                                            {eq.status}
                                        </span>
                                    </td>
                                    <td className="py-2 text-right text-zinc-400 font-mono">{eq.openIssues}</td>
                                    <td className="py-2 text-right text-zinc-400 font-mono">{eq.totalMaintenance}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Churn Trend */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                    <TrendingDown size={16} className="text-red-400" /> Churn Trend (Expired Subscriptions)
                </h3>
                <div className="flex items-end gap-2 h-32 overflow-x-auto pb-6">
                    {churn.map((c) => {
                        const maxVal = Math.max(...churn.map((x) => x.expired), 1);
                        const pct = (c.expired / maxVal) * 100;
                        return (
                            <div key={c.month} className="flex flex-col items-center flex-1 min-w-9" title={`${c.month}: ${c.expired} expired`}>
                                <div className="w-full bg-linear-to-t from-red-800 to-red-500 rounded-t opacity-70" style={{ height: `${Math.max(pct, 3)}%` }} />
                                <span className="text-[10px] text-zinc-500 mt-2 whitespace-nowrap">{c.month.slice(5)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
