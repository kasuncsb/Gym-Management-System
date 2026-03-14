'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Users, TrendingUp, UserCheck, BarChart3, Star, Lightbulb } from 'lucide-react';

type Impact = 'high' | 'medium' | 'low' | 'positive';
type Priority = 'high' | 'medium' | 'low';

const impactColor: Record<Impact, string> = {
    high:     'text-red-400 bg-red-500/20',
    medium:   'text-yellow-400 bg-yellow-500/20',
    low:      'text-blue-400 bg-blue-500/20',
    positive: 'text-green-400 bg-green-500/20',
};
const priorityColor: Record<Priority, string> = {
    high:   'text-red-400 bg-red-500/20',
    medium: 'text-yellow-400 bg-yellow-500/20',
    low:    'text-blue-400 bg-blue-500/20',
};

export default function ManagerDashboard() {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const firstName = user?.fullName?.split(' ')[0] ?? 'Manager';

    const kpis = [
        { label: 'Total Members',    value: '1,247', sub: '1,089 active',  icon: Users,     color: 'from-blue-600 to-blue-700' },
        { label: 'Monthly Revenue',  value: 'Rs.12,340', sub: '+12% MoM',  icon: TrendingUp, color: 'from-green-600 to-green-700' },
        { label: 'Retention Rate',   value: '87.5%', sub: '-3% MoM',       icon: UserCheck, color: 'from-purple-600 to-purple-700' },
        { label: 'Satisfaction',     value: '4.6/5', sub: 'Member avg',    icon: Star,      color: 'from-yellow-600 to-yellow-700' },
    ];

    const quickActions = [
        { label: 'Reports',  href: '/manager/reports',  accent: 'text-blue-400 border-blue-500/40 hover:border-blue-400' },
        { label: 'Insights', href: '/manager/insights', accent: 'text-purple-400 border-purple-500/40 hover:border-purple-400' },
        { label: 'Staff',    href: '/manager/staff',    accent: 'text-green-400 border-green-500/40 hover:border-green-400' },
        { label: 'Members',  href: '/manager/members',  accent: 'text-orange-400 border-orange-500/40 hover:border-orange-400' },
    ];

    const insights = [
        { title: 'Peak Hours Analysis',   description: 'Gym busiest 6–8 PM on weekdays',       impact: 'high'     as Impact, rec: 'Add staff during peak hours' },
        { title: 'Revenue Growth',        description: 'Monthly revenue up 12% vs last month',  impact: 'positive' as Impact, rec: 'Continue current strategies' },
        { title: 'Member Retention Drop', description: 'Retention down 3% this month',          impact: 'medium'   as Impact, rec: 'Implement engagement programs' },
        { title: 'Equipment Usage',       description: 'Cardio usage 15% higher than strength', impact: 'low'      as Impact, rec: 'Consider expanding cardio section' },
    ];

    const tasks = [
        { task: 'Review monthly budget',        priority: 'high'   as Priority, due: '2025-01-20', assignee: 'Manager' },
        { task: 'Staff performance evaluation', priority: 'medium' as Priority, due: '2025-01-22', assignee: 'Manager' },
        { task: 'Member feedback analysis',     priority: 'medium' as Priority, due: '2025-01-18', assignee: 'Manager' },
    ];

    const occupancy: Record<string, number[]> = {
        week:  [45, 52, 48, 61, 58, 35, 28],
        month: [42, 45, 50, 55, 60, 58, 52, 48, 45, 50, 55, 61],
        year:  [35, 38, 42, 45, 48, 52, 55, 58, 61, 58, 55, 52],
    };
    const data   = occupancy[period];
    const maxVal = Math.max(...data, 1);
    const labels: Record<string, string[]> = {
        week:  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        month: ['Week 1','Week 2','Week 3','Week 4','Week 5','Week 6','Week 7','Week 8','Week 9','Week 10','Week 11','Week 12'],
        year:  ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-1">Management Dashboard</h1>
                <p className="text-zinc-400">
                    Welcome, {firstName} ·{' '}
                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    {' · '}
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </p>
            </div>

            {/* Period toggle */}
            <div className="flex gap-2">
                {(['week','month','year'] as const).map(p => (
                    <button key={p} onClick={() => setPeriod(p)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${period === p ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                        {p}
                    </button>
                ))}
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map(({ label, value, sub, icon: Icon, color }) => (
                    <div key={label} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
                            <Icon size={18} className="text-white" />
                        </div>
                        <p className="text-xl font-bold text-white">{value}</p>
                        <p className="text-xs text-zinc-500 mt-1">{label}</p>
                        <p className="text-xs text-zinc-600">{sub}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map(({ label, href, accent }) => (
                    <Link key={href} href={href}
                        className={`bg-zinc-900/50 border ${accent} rounded-2xl p-5 text-center font-semibold transition-all hover:bg-zinc-900 hover:scale-[1.02]`}>
                        {label}
                    </Link>
                ))}
            </div>

            {/* Insights + Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Lightbulb size={18} className="text-yellow-400" /> Key Insights</h2>
                        <Link href="/manager/insights" className="text-sm text-red-500 hover:text-red-400">View All</Link>
                    </div>
                    <div className="space-y-3">
                        {insights.map((ins, i) => (
                            <div key={i} className="bg-zinc-800/30 rounded-xl p-4">
                                <div className="flex justify-between mb-1">
                                    <p className="text-white text-sm font-semibold">{ins.title}</p>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${impactColor[ins.impact]}`}>{ins.impact}</span>
                                </div>
                                <p className="text-zinc-400 text-xs mb-1">{ins.description}</p>
                                <p className="text-zinc-600 text-xs italic">→ {ins.rec}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-5">Upcoming Tasks</h2>
                    <div className="space-y-3">
                        {tasks.map((t, i) => (
                            <div key={i} className="bg-zinc-800/30 rounded-xl p-4">
                                <div className="flex justify-between mb-1">
                                    <p className="text-white text-sm font-semibold">{t.task}</p>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${priorityColor[t.priority]}`}>{t.priority}</span>
                                </div>
                                <p className="text-zinc-500 text-xs">Due {t.due} · {t.assignee}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Occupancy Chart */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><BarChart3 size={18} className="text-red-500" /> Gym Occupancy Trend</h2>
                <div className="flex items-end gap-1 h-32">
                    {data.map((val, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1">
                            <div className="w-full rounded-t-lg bg-gradient-to-t from-red-700 to-red-500 transition-all"
                                style={{ height: `${(val / maxVal) * 100}%` }} />
                            <span className="text-zinc-600 text-[9px]">{labels[period][i]}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
