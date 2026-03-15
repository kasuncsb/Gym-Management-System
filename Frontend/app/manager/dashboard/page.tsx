'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Users, TrendingUp, UserCheck, BarChart3, Star, Lightbulb } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/SharedComponents';

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
        { label: 'Reports',  href: '/manager/reports',  icon: TrendingUp },
        { label: 'Insights', href: '/manager/insights', icon: Lightbulb },
        { label: 'Staff',    href: '/manager/staff',    icon: UserCheck },
        { label: 'Members',  href: '/manager/members',   icon: Users },
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
        <div className="space-y-8">
            <PageHeader
                title="Management Dashboard"
                subtitle={`Welcome, ${firstName} · ${currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · ${currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`}
            />

            {/* Period toggle */}
            <div className="flex gap-2">
                {(['week','month','year'] as const).map(p => (
                    <button key={p} onClick={() => setPeriod(p)}
                        className={`px-4 py-1.5 rounded-xl text-sm font-medium capitalize transition-all ${period === p ? 'bg-red-600 text-white border border-red-500' : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'}`}>
                        {p}
                    </button>
                ))}
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map(({ label, value, sub, icon: Icon, color }) => (
                    <Card key={label} padding="md" className="hover:border-zinc-700/50 transition-colors">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
                            <Icon size={18} className="text-white" />
                        </div>
                        <p className="text-xl font-bold text-white">{value}</p>
                        <p className="text-xs text-zinc-500 mt-1">{label}</p>
                        <p className="text-xs text-zinc-600">{sub}</p>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map(({ label, href, icon: Icon }) => (
                    <Link key={href} href={href}
                        className="bg-zinc-800/80 border border-zinc-700 rounded-2xl p-5 flex flex-col items-center gap-3 transition-all hover:bg-zinc-800 hover:border-red-500/60 hover:scale-[1.02]">
                        <Icon size={24} className="text-red-500" />
                        <span className="text-sm font-semibold text-white">{label}</span>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Lightbulb size={18} className="text-yellow-400" /> Key Insights</h2>
                        <Link href="/manager/insights" className="text-sm text-red-500 hover:text-red-400">View All</Link>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
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
                </Card>

                <Card>
                    <h2 className="text-lg font-semibold text-white mb-5">Upcoming Tasks</h2>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
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
                </Card>
            </div>

            <Card padding="lg">
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><BarChart3 size={18} className="text-red-500" /> Gym Occupancy Trend</h2>
                <div className="flex items-end gap-1 h-48 min-h-[12rem]">
                    {data.map((val, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1">
                            <div className="w-full rounded-t-lg bg-gradient-to-t from-red-700 to-red-500 transition-all"
                                style={{ height: `${(val / maxVal) * 100}%` }} />
                            <span className="text-zinc-500 text-[10px]">{labels[period][i]}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
