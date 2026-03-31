'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Lightbulb, ArrowUp } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/SharedComponents';
import { ChatMarkdown } from '@/components/ai/ChatMarkdown';
import { aiAPI, getErrorMessage, opsAPI } from '@/lib/api';
import { MANAGER_INSIGHT_ACTIONS } from '@/lib/managerInsightsPrompts';
import { useStreamedText } from '@/hooks/useStreamedText';
import { useToast } from '@/components/ui/Toast';
import { ThemedLineChart } from '@/components/charts/ThemedLineChart';

const impactColor: Record<string, string> = {
    high:   'text-red-400 bg-red-500/20',
    medium: 'text-yellow-400 bg-yellow-500/20',
    low:    'text-blue-400 bg-blue-500/20',
};

export default function ManagerInsightsPage() {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [aiResult, setAiResult] = useState<{
        content: string;
        summary: string;
        insights: string[];
        generatedBy: string;
    } | null>(null);
    const streamedContent = useStreamedText(aiResult?.content ?? null);
    const streamDone =
        Boolean(aiResult?.content) && streamedContent.length >= (aiResult?.content?.length ?? 0);
    const [summary, setSummary] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);

    useEffect(() => {
        Promise.all([opsAPI.reportSummary(), opsAPI.dashboardAnalytics('manager')])
            .then(([s, a]) => {
                setSummary(s);
                setAnalytics(a ?? null);
            })
            .catch(() => toast.error('Error', 'Failed to load insight data'));
    }, []);

    const runAi = async (prompt: string) => {
        setLoading(true);
        setAiResult(null);
        try {
            const data = await aiAPI.insights(prompt);
            setAiResult({
                content: data.content ?? '',
                summary: data.summary,
                insights: Array.isArray(data.insights) ? data.insights : [],
                generatedBy: data.generatedBy,
            });
        } catch (err) {
            toast.error('AI Insight Error', getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const kpis = [
        { label: 'Avg Daily Check-ins', value: String(Math.round((summary?.visitsLast30Days ?? 0) / 30)), delta: 'from live visit logs', good: true },
        { label: 'Monthly Revenue', value: `Rs. ${Number(summary?.monthlyRevenue ?? 0).toLocaleString()}`, delta: 'from payment records', good: true },
        { label: 'Active Members', value: String(summary?.activeMembers ?? 0), delta: 'current status', good: true },
        { label: 'Open Incidents', value: String(summary?.openEquipmentIncidents ?? 0), delta: 'needs attention', good: false },
    ];

    const occupancyTrend = useMemo(() => analytics?.occupancyTrend ?? [], [analytics]);
    const occupancyByHour = useMemo(() => analytics?.avgHourlyOccupancy ?? [], [analytics]);
    const revenueTrend = useMemo(() => analytics?.revenueTrend ?? [], [analytics]);
    const activityOverview = useMemo(() => analytics?.activityOverview ?? [], [analytics]);

    return (
        <div className="space-y-8">
            <PageHeader
                title="Gym Insights"
                subtitle="Data-driven insights for PowerWorld Kiribathgoda"
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map(k => (
                    <Card key={k.label} padding="md" className="hover:border-zinc-700/50 transition-colors">
                        <p className="text-2xl font-bold text-white mb-1">{k.value}</p>
                        <p className="text-xs text-zinc-500">{k.label}</p>
                        <p className={`text-xs mt-1 flex items-center gap-1 ${k.good ? 'text-green-400' : 'text-red-400'}`}>
                            <ArrowUp size={10} className={k.good ? '' : 'rotate-180'} /> {k.delta}
                        </p>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card padding="lg">
                    <h2 className="text-lg font-semibold text-white mb-4">Occupancy Trend</h2>
                    <ThemedLineChart
                        labels={occupancyTrend.map((p: any) => p.label)}
                        series={[{ name: 'Visits', color: '#ef4444', values: occupancyTrend.map((p: any) => Number(p.value ?? 0)) }]}
                        height={210}
                    />
                </Card>
                <Card padding="lg">
                    <h2 className="text-lg font-semibold text-white mb-4">Average Hourly Occupancy</h2>
                    <ThemedLineChart
                        labels={occupancyByHour.map((p: any) => p.label)}
                        series={[{ name: 'Avg check-ins/hour', color: '#a855f7', values: occupancyByHour.map((p: any) => Number(p.value ?? 0)) }]}
                        height={210}
                    />
                </Card>
                <Card padding="lg" className="xl:col-span-2">
                    <h2 className="text-lg font-semibold text-white mb-4">Revenue Trend</h2>
                    <ThemedLineChart
                        labels={revenueTrend.map((p: any) => p.label)}
                        series={[{ name: 'Revenue (LKR)', color: '#22c55e', values: revenueTrend.map((p: any) => Number(p.value ?? 0)) }]}
                        height={210}
                    />
                </Card>
                <Card padding="lg" className="xl:col-span-2">
                    <h2 className="text-lg font-semibold text-white mb-4">Activity Overview</h2>
                    <ThemedLineChart
                        labels={activityOverview.map((p: any) => p.label)}
                        series={[
                            { name: 'Visits', color: '#ef4444', values: activityOverview.map((p: any) => Number(p.visits ?? 0)) },
                            { name: 'Workouts', color: '#3b82f6', values: activityOverview.map((p: any) => Number(p.workouts ?? 0)) },
                            { name: 'PT Sessions', color: '#f59e0b', values: activityOverview.map((p: any) => Number(p.ptSessions ?? 0)) },
                        ]}
                        height={210}
                    />
                </Card>
            </div>

            <Card padding="md">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-white">AI branch briefing</h2>
                    <button
                        type="button"
                        onClick={() =>
                            window.dispatchEvent(
                                new CustomEvent('pw:ai-chat-prefill', {
                                    detail: { role: 'manager', message: 'I need a deeper dive on branch operations—ask me one clarifying question, then advise.' },
                                }),
                            )
                        }
                        className="text-xs px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    >
                        Open AI Chat
                    </button>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                    Run a preset analysis—the full response streams in below. Use chat for follow-ups.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                    {MANAGER_INSIGHT_ACTIONS.map(({ label, prompt }) => (
                        <button
                            key={label}
                            type="button"
                            disabled={loading}
                            onClick={() => runAi(prompt)}
                            className="text-xs px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-60"
                        >
                            {label}
                        </button>
                    ))}
                </div>
                {(loading || streamedContent) && (
                    <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-950/25 px-4 py-3 max-h-[32rem] overflow-y-auto">
                        {loading && !streamedContent && (
                            <p className="text-sm text-violet-200/90 animate-pulse">Generating briefing…</p>
                        )}
                        {streamedContent ? (
                            <div className="text-sm text-zinc-300 leading-relaxed">
                                <ChatMarkdown text={streamedContent} />
                                {!streamDone && (
                                    <span
                                        className="inline-block w-0.5 h-4 bg-violet-400 align-middle ml-0.5 animate-pulse"
                                        aria-hidden
                                    />
                                )}
                            </div>
                        ) : null}
                        {aiResult && streamDone ? (
                            <p className="mt-3 text-[10px] text-zinc-600 uppercase tracking-wide">
                                Source: {aiResult.generatedBy}
                            </p>
                        ) : null}
                    </div>
                )}
            </Card>

            <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Lightbulb size={18} className="text-yellow-400" /> Recommendations
                </h2>
                <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                    {(!aiResult?.insights || aiResult.insights.length === 0) && (
                        <p className="text-zinc-500 text-sm">
                            Choose an action above to populate parsed action bullets here (in addition to the full briefing).
                        </p>
                    )}
                    {(aiResult?.insights ?? []).map((line, i) => (
                        <Card key={i} padding="md" className="hover:border-zinc-700/50 transition-colors border-violet-500/15 bg-violet-950/20">
                            <div className="flex items-start justify-between mb-2">
                                <p className="text-white font-semibold">Recommendation {i + 1}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${impactColor[i === 0 ? 'high' : i === 1 ? 'medium' : 'low']}`}>AI</span>
                            </div>
                            <div className="text-zinc-300 text-sm leading-relaxed">
                                <ChatMarkdown text={String(line ?? '')} />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
