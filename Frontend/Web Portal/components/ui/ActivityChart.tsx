"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { useState, useEffect, useCallback } from "react";
import { analyticsAPI } from "@/lib/api";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekRange(offset: number) {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7) + offset * 7);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: monday, end: sunday };
}

function formatDateStr(d: Date) {
    return d.toISOString().slice(0, 10);
}

export function ActivityChart() {
    const [mounted, setMounted] = useState(false);
    const [weekOffset, setWeekOffset] = useState(0);
    const [data, setData] = useState<{ name: string; visits: number }[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await analyticsAPI.dailyVisits(14);
            const visits: { date: string; visits: number }[] = res.data?.data || [];
            const { start } = getWeekRange(weekOffset);

            const weekData = DAYS.map((dayName, i) => {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                const dateStr = formatDateStr(d);
                const match = visits.find(v => v.date?.startsWith(dateStr));
                return { name: dayName, visits: match?.visits || 0 };
            });
            setData(weekData);
        } catch {
            // Fallback to empty data
            setData(DAYS.map(d => ({ name: d, visits: 0 })));
        } finally {
            setLoading(false);
        }
    }, [weekOffset]);

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => { if (mounted) fetchData(); }, [mounted, fetchData]);

    if (!mounted) return <div className="w-full h-75 p-4 bg-black/40 rounded-2xl border border-zinc-800 backdrop-blur-md animate-pulse" />;

    return (
        <div className="w-full h-75 p-4 bg-black/40 rounded-2xl border border-zinc-800 backdrop-blur-md">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Weekly Activity</h3>
                    <p className="text-sm text-zinc-400">
                        {loading ? "Loading..." : "Gym visits over time"}
                    </p>
                </div>
                <select
                    value={weekOffset}
                    onChange={(e) => setWeekOffset(Number(e.target.value))}
                    className="bg-zinc-800 text-zinc-200 text-sm rounded-lg px-3 py-1 border border-zinc-700 outline-none"
                >
                    <option value={0}>This Week</option>
                    <option value={-1}>Last Week</option>
                </select>
            </div>

            <div className="h-50 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#71717a', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#71717a', fontSize: 12 }}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa' }}
                            formatter={(value: number) => [`${value} visits`, "Visits"]}
                        />
                        <Area
                            type="monotone"
                            dataKey="visits"
                            stroke="#dc2626"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorVisits)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
