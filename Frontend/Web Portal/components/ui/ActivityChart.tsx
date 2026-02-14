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

const data = [
    { name: "Mon", active: 400, new: 240 },
    { name: "Tue", active: 300, new: 139 },
    { name: "Wed", active: 200, new: 980 },
    { name: "Thu", active: 278, new: 390 },
    { name: "Fri", active: 189, new: 480 },
    { name: "Sat", active: 239, new: 380 },
    { name: "Sun", active: 349, new: 430 },
];

import { useState, useEffect } from "react";

export function ActivityChart() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="w-full h-75 p-4 bg-black/40 rounded-2xl border border-zinc-800 backdrop-blur-md animate-pulse" />;

    return (
        <div className="w-full h-75 p-4 bg-black/40 rounded-2xl border border-zinc-800 backdrop-blur-md">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Weekly Activity</h3>
                    <p className="text-sm text-zinc-400">Gym visits over time</p>
                </div>
                <select className="bg-zinc-800 text-zinc-200 text-sm rounded-lg px-3 py-1 border border-zinc-700 outline-none">
                    <option>This Week</option>
                    <option>Last Week</option>
                </select>
            </div>

            <div className="h-50 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
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
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="active"
                            stroke="#6366f1"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorActive)"
                        />
                        <Area
                            type="monotone"
                            dataKey="new"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorNew)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
