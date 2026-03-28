'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Users, TrendingUp, UserCheck, BarChart3, Star, Lightbulb } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/SharedComponents';
import { aiAPI, getErrorMessage, opsAPI } from '@/lib/api';
import { useRealtimePolling } from '@/hooks/useRealtimePolling';
import { useToast } from '@/components/ui/Toast';

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
    const toast = useToast();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
    const [dashboard, setDashboard] = useState<any>(null);
    const [branchInsights, setBranchInsights] = useState<Array<{ title: string; description: string; impact: Impact; rec: string }>>([]);
    const [latestAi, setLatestAi] = useState<{ summary: string; insights: string[] } | null>(null);
    const [tasks, setTasks] = useState<Array<{ task: string; priority: Priority; due: string; assignee: string }>>([]);
    const [occupancyData, setOccupancyData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
    const [aiSummary, setAiSummary] = useState<string>('');
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    const refresh = async () => {
        const [dash, summary, reports, visits] = await Promise.all([
            opsAPI.dashboard('manager'),
            opsAPI.reportSummary(),
            opsAPI.recentReports(),
            opsAPI.visits(200),
        ]);
        setDashboard(dash);
        setBranchInsights([
            { title: 'Visits Today', description: `${dash.todayVisits ?? 0} recorded check-ins today`, impact: 'high', rec: 'Optimize trainer staffing during peaks' },
            { title: 'Open Issues', description: `${dash.openIssues ?? 0} unresolved incidents`, impact: dash.openIssues > 0 ? 'medium' : 'positive', rec: 'Review equipment incident queue daily' },
            { title: 'Revenue', description: `Rs. ${Number(summary.monthlyRevenue ?? 0).toLocaleString()} this month`, impact: 'positive', rec: 'Track conversion from trial to paid plans' },
        ]);
        setTasks((reports ?? []).slice(0, 3).map((r: any) => ({
            task: r.title ?? 'Review report',
            priority: 'medium',
            due: String(r.createdAt).slice(0, 10),
            assignee: 'Manager',
        })));
        const buckets = period === 'week' ? 7 : 12;
        const out = Array.from({ length: buckets }, () => 0);
        (visits ?? []).forEach((v: any) => {
            const d = new Date(v.checkInAt);
            if (period === 'week') {
                const day = d.getDay();
                const idx = (day + 6) % 7;
                out[idx] += 1;
            } else {
                out[d.getMonth()] += 1;
            }
        });
        setOccupancyData(out);
    };
    useRealtimePolling(() => { refresh().catch(() => undefined); }, 15000);

    const firstName = user?.fullName?.split(' ')[0] ?? 'Manager';

    const kpis = [
        { label: 'Total Members', value: String(dashboard?.activeMembers ?? 0), sub: 'active', icon: Users, color: 'from-blue-600 to-blue-700' },
        { label: 'Monthly Revenue', value: `Rs.${Number(dashboard?.monthlyRevenue ?? 0).toLocaleString()}`, sub: 'current month', icon: TrendingUp, color: 'from-green-600 to-green-700' },
        { label: 'Visits Today', value: String(dashboard?.todayVisits ?? 0), sub: 'facility entries', icon: UserCheck, color: 'from-purple-600 to-purple-700' },
        { label: 'Open Issues', value: String(dashboard?.openIssues ?? 0), sub: 'action items', icon: Star, color: 'from-yellow-600 to-yellow-700' },
    ];

    const quickActions = [
        { label: 'Reports',  href: '/manager/reports',  icon: TrendingUp },
        { label: 'Insights', href: '/manager/insights', icon: Lightbulb },
        { label: 'Team',     href: '/manager/staff',     icon: UserCheck },
        { label: 'Members',  href: '/manager/members',   icon: Users },
    ];

    const data   = occupancyData;
    const maxVal = Math.max(...data, 1);
    const labels: Record<string, string[]> = {
        week:  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        month: ['Week 1','Week 2','Week 3','Week 4','Week 5','Week 6','Week 7','Week 8','Week 9','Week 10','Week 11','Week 12'],
        year:  ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    };

    const askAi = async (q: string) => {
        setAiLoading(true);
        try {
            const result = await aiAPI.insights(q);
            setAiSummary(result.summary);
            setLatestAi({
                summary: result.summary,
                insights: Array.isArray(result.insights) ? result.insights : [],
            });
        } catch (err) {
            toast.error('AI Insight Error', getErrorMessage(err));
        } finally {
            setAiLoading(false);
        }
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

            <Card padding="md">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-white">Ask AI for Manager Actions</h2>
                    <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('pw:ai-chat-prefill', {
                            detail: { role: 'manager', message: 'Summarize key branch risks and actions for this week.' },
                        }))}
                        className="text-xs px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    >
                        Open AI Chat
                    </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {[
                        'Forecast next month revenue trend',
                        'Identify churn risk from current activity',
                        'Recommend staffing adjustments for peak periods',
                    ].map((q) => (
                        <button
                            key={q}
                            type="button"
                            onClick={() => askAi(q)}
                            disabled={aiLoading}
                            className="text-xs px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-60"
                        >
                            {q}
                        </button>
                    ))}
                </div>
                {aiSummary && <p className="mt-3 text-sm text-zinc-300 whitespace-pre-wrap">{aiSummary}</p>}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Lightbulb size={18} className="text-yellow-400" /> Key Insights</h2>
                        <Link href="/manager/insights" className="text-sm text-red-500 hover:text-red-400">View All</Link>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {branchInsights.map((ins, i) => (
                            <div key={`kpi-${i}`} className="bg-zinc-800/30 rounded-xl p-4">
                                <div className="flex justify-between mb-1">
                                    <p className="text-white text-sm font-semibold">{ins.title}</p>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${impactColor[ins.impact]}`}>{ins.impact}</span>
                                </div>
                                <p className="text-zinc-400 text-xs mb-1">{ins.description}</p>
                                <p className="text-zinc-600 text-xs italic">→ {ins.rec}</p>
                            </div>
                        ))}
                        {latestAi && latestAi.insights.length > 0 && (
                            <>
                                <p className="text-[11px] text-zinc-500 uppercase tracking-wide pt-2">AI recommendations</p>
                                {latestAi.insights.map((line, i) => (
                                    <div key={`ai-${i}`} className="bg-violet-950/40 border border-violet-500/20 rounded-xl p-4">
                                        <div className="flex justify-between mb-1">
                                            <p className="text-violet-200 text-sm font-semibold">Action {i + 1}</p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${impactColor[(i === 0 ? 'high' : i === 1 ? 'medium' : 'low') as Impact]}`}>AI</span>
                                        </div>
                                        <p className="text-zinc-300 text-xs whitespace-pre-wrap leading-relaxed">{line}</p>
                                    </div>
                                ))}
                            </>
                        )}
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
