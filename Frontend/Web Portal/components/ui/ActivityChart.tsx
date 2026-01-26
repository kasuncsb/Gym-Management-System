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

export function ActivityChart() {
    return (
        <div className="w-full h-[300px] p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 backdrop-blur-sm">
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

            <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#a1a1aa', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#a1a1aa', fontSize: 12 }}
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
    );
}
