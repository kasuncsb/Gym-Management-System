'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Users, TrendingUp, UserCheck, BarChart3, Star, Lightbulb } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/SharedComponents';
import { ChatMarkdown } from '@/components/ai/ChatMarkdown';
import { aiAPI, getErrorMessage, opsAPI } from '@/lib/api';
import { MANAGER_INSIGHT_ACTIONS } from '@/lib/managerInsightsPrompts';
import { useRealtimePolling } from '@/hooks/useRealtimePolling';
import { useStreamedText } from '@/hooks/useStreamedText';
import { useToast } from '@/components/ui/Toast';
import { ThemedLineChart } from '@/components/charts/ThemedLineChart';

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
    const [latestAi, setLatestAi] = useState<{
        content: string;
        summary: string;
        insights: string[];
        generatedBy: string;
    } | null>(null);
    const [tasks, setTasks] = useState<Array<{ task: string; priority: Priority; due: string; assignee: string }>>([]);
    const [analytics, setAnalytics] = useState<{
        occupancyTrend: Array<{ label: string; value: number }>;
        avgHourlyOccupancy: Array<{ label: string; value: number }>;
        revenueTrend: Array<{ label: string; value: number }>;
        activityOverview: Array<{ label: string; visits: number; workouts: number; ptSessions: number }>;
    }>({
        occupancyTrend: [],
        avgHourlyOccupancy: [],
        revenueTrend: [],
        activityOverview: [],
    });
    const [aiLoading, setAiLoading] = useState(false);
    const streamedBriefing = useStreamedText(latestAi?.content ?? null);
    const briefingComplete =
        Boolean(latestAi?.content) && streamedBriefing.length >= (latestAi?.content?.length ?? 0);

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    const refresh = async () => {
        const [dash, summary, reports, chartData] = await Promise.all([
            opsAPI.dashboard('manager'),
            opsAPI.reportSummary(),
            opsAPI.recentReports(),
            opsAPI.dashboardAnalytics('manager') as Promise<any>,
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
        setAnalytics({
            occupancyTrend: chartData?.occupancyTrend ?? [],
            avgHourlyOccupancy: chartData?.avgHourlyOccupancy ?? [],
            revenueTrend: chartData?.revenueTrend ?? [],
            activityOverview: chartData?.activityOverview ?? [],
        });
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

    const occupancyPoints = analytics.occupancyTrend.slice(period === 'week' ? -7 : period === 'month' ? -12 : -14);

    const askAi = async (q: string) => {
        setAiLoading(true);
        setLatestAi(null);
        try {
            const result = await aiAPI.insights(q);
            setLatestAi({
                content: result.content ?? '',
                summary: result.summary,
                insights: Array.isArray(result.insights) ? result.insights : [],
                generatedBy: result.generatedBy,
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
                <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                    Choose a briefing—full Markdown is generated in place with a live reveal. Follow up in chat anytime.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                    {MANAGER_INSIGHT_ACTIONS.map(({ label, prompt }) => (
                        <button
                            key={label}
                            type="button"
                            onClick={() => askAi(prompt)}
                            disabled={aiLoading}
                            className="text-xs px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-60"
                        >
                            {label}
                        </button>
                    ))}
                </div>
                {(aiLoading || streamedBriefing) && (
                    <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-950/25 px-4 py-3 max-h-[28rem] overflow-y-auto">
                        {aiLoading && !streamedBriefing && (
                            <p className="text-sm text-violet-200/90 animate-pulse">Generating briefing…</p>
                        )}
                        {streamedBriefing ? (
                            <div className="text-sm text-zinc-300 leading-relaxed relative">
                                <ChatMarkdown text={streamedBriefing} />
                                {!briefingComplete && (
                                    <span
                                        className="inline-block w-0.5 h-4 bg-violet-400 align-middle ml-0.5 animate-pulse"
                                        aria-hidden
                                    />
                                )}
                            </div>
                        ) : null}
                        {latestAi && briefingComplete ? (
                            <p className="mt-3 text-[10px] text-zinc-600 uppercase tracking-wide">
                                Source: {latestAi.generatedBy}
                            </p>
                        ) : null}
                    </div>
                )}
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

            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
                <Card padding="lg">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-red-500" /> Occupancy Trend</h2>
                    <ThemedLineChart
                        labels={occupancyPoints.map((p) => p.label)}
                        series={[{ name: 'Visits', color: '#ef4444', values: occupancyPoints.map((p) => Number(p.value ?? 0)) }]}
                        height={220}
                    />
                </Card>
                <Card padding="lg">
                    <h2 className="text-lg font-semibold text-white mb-4">Avg. Hourly Occupancy</h2>
                    <ThemedLineChart
                        labels={analytics.avgHourlyOccupancy.map((p) => p.label)}
                        series={[{ name: 'Avg check-ins/hour', color: '#a855f7', values: analytics.avgHourlyOccupancy.map((p) => Number(p.value ?? 0)) }]}
                        height={220}
                    />
                </Card>
                <Card padding="lg">
                    <h2 className="text-lg font-semibold text-white mb-4">Revenue Trend</h2>
                    <ThemedLineChart
                        labels={analytics.revenueTrend.map((p) => p.label)}
                        series={[{ name: 'Revenue (LKR)', color: '#22c55e', values: analytics.revenueTrend.map((p) => Number(p.value ?? 0)) }]}
                        height={220}
                    />
                </Card>
                <Card padding="lg">
                    <h2 className="text-lg font-semibold text-white mb-4">Activity Overview</h2>
                    <ThemedLineChart
                        labels={analytics.activityOverview.map((p) => p.label)}
                        series={[
                            { name: 'Visits', color: '#ef4444', values: analytics.activityOverview.map((p) => Number(p.visits ?? 0)) },
                            { name: 'Workouts', color: '#3b82f6', values: analytics.activityOverview.map((p) => Number(p.workouts ?? 0)) },
                            { name: 'PT Sessions', color: '#f59e0b', values: analytics.activityOverview.map((p) => Number(p.ptSessions ?? 0)) },
                        ]}
                        height={220}
                    />
                </Card>
            </div>
        </div>
    );
}
