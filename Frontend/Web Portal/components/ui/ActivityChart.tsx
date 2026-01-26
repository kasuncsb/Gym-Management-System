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
        <div className="w-full h-[300px] p-4 bg-slate-800/50 rounded-2xl border border-slate-700 backdrop-blur-sm">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Weekly Activity</h3>
                    <p className="text-sm text-slate-400">Gym visits over time</p>
                </div>
                <select className="bg-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1 border border-slate-600 outline-none">
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
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
