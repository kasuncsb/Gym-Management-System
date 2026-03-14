'use client';

import { useState } from 'react';
import { TrendingUp, Flame, Clock, Award, Activity } from 'lucide-react';

export default function ProgressPage() {
    const [period, setPeriod] = useState<'week' | 'month' | '3month'>('month');

    const vitals = [
        { label: 'Body Weight', value: '74.5 kg', delta: '-1.5 kg', trend: 'down', good: true },
        { label: 'BMI',         value: '23.4',    delta: '-0.5',    trend: 'down', good: true },
        { label: 'Body Fat %',  value: '18.2%',   delta: '-1.2%',   trend: 'down', good: true },
        { label: 'Muscle Mass', value: '58.3 kg', delta: '+0.8 kg', trend: 'up',   good: true },
    ];

    const stats = [
        { label: 'Total Workouts', value: '47',    icon: Activity, color: 'from-blue-600 to-blue-700' },
        { label: 'Calories Burned',value: '14,280',icon: Flame,    color: 'from-orange-600 to-orange-700' },
        { label: 'Total Hours',    value: '62.5h', icon: Clock,    color: 'from-purple-600 to-purple-700' },
        { label: 'Personal Records',value: '8',   icon: Award,    color: 'from-yellow-600 to-yellow-700' },
    ];

    const weekData   = [1, 0, 1, 1, 0, 1, 0];
    const monthData  = [3, 4, 3, 5, 4, 3, 2, 4, 5, 4, 3, 4, 5, 3, 4, 2, 4, 5, 4, 3, 2, 4, 5, 4, 3, 4, 5, 3, 2, 4, 5];
    const threeMonthData = [...monthData, ...monthData, ...monthData];
    const data       = period === 'week' ? weekData : period === 'month' ? monthData : threeMonthData;
    const maxVal     = Math.max(...data, 1);

    const prs = [
        { exercise: 'Bench Press', weight: '85 kg', date: '2025-01-12', improvement: '+5 kg' },
        { exercise: 'Squat',       weight: '110 kg',date: '2025-01-08', improvement: '+7.5 kg' },
        { exercise: 'Deadlift',    weight: '130 kg',date: '2025-01-15', improvement: '+10 kg' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                    <TrendingUp size={28} className="text-red-500" /> Progress & Stats
                </h1>
                <p className="text-zinc-400">Track your fitness journey at PowerWorld Kiribathgoda</p>
            </div>

            {/* Period toggle */}
            <div className="flex gap-2">
                {(['week','month','3month'] as const).map(p => (
                    <button key={p} onClick={() => setPeriod(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${period === p ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                        {p === '3month' ? '3 Months' : p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                ))}
            </div>

            {/* Vitals */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {vitals.map(v => (
                    <div key={v.label} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                        <p className="text-zinc-400 text-xs mb-2">{v.label}</p>
                        <p className="text-2xl font-bold text-white">{v.value}</p>
                        <p className={`text-xs mt-1 font-semibold ${v.good ? 'text-green-400' : 'text-red-400'}`}>{v.delta} this month</p>
                    </div>
                ))}
            </div>

            {/* Activity stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
                            <Icon size={18} className="text-white" />
                        </div>
                        <p className="text-xl font-bold text-white">{value}</p>
                        <p className="text-xs text-zinc-500 mt-1">{label}</p>
                    </div>
                ))}
            </div>

            {/* Workout frequency chart */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-6">Workout Frequency</h2>
                <div className="flex items-end gap-1 h-24 overflow-hidden">
                    {data.map((v, i) => (
                        <div key={i} className="flex-1 min-w-0">
                            <div className={`w-full rounded-t-sm transition-all ${v > 0 ? 'bg-gradient-to-t from-red-700 to-red-500' : 'bg-zinc-800'}`}
                                style={{ height: `${(v / maxVal) * 100}%`, minHeight: '4px' }} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Personal Records */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                    <Award size={18} className="text-yellow-500" /> Personal Records
                </h2>
                <div className="space-y-3">
                    {prs.map((pr, i) => (
                        <div key={i} className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-4">
                            <div>
                                <p className="text-white font-semibold">{pr.exercise}</p>
                                <p className="text-zinc-500 text-xs">{pr.date}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-white font-bold">{pr.weight}</p>
                                <p className="text-green-400 text-xs">{pr.improvement}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
