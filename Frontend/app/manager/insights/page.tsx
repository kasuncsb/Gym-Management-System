'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Lightbulb, ArrowUp } from 'lucide-react';
import { LoadingButton, PageHeader, Card, Input } from '@/components/ui/SharedComponents';
import { aiAPI, getErrorMessage, opsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const impactColor: Record<string, string> = {
    high:   'text-red-400 bg-red-500/20',
    medium: 'text-yellow-400 bg-yellow-500/20',
    low:    'text-blue-400 bg-blue-500/20',
};

export default function ManagerInsightsPage() {
    const toast = useToast();
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiResult, setAiResult] = useState<{ summary: string; insights: string[]; generatedBy: string } | null>(null);
    const [summary, setSummary] = useState<any>(null);
    const [visits, setVisits] = useState<any[]>([]);

    useEffect(() => {
        Promise.all([opsAPI.reportSummary(), opsAPI.visits(500)])
            .then(([s, v]) => {
                setSummary(s);
                setVisits(v ?? []);
            })
            .catch(() => toast.error('Error', 'Failed to load insight data'));
    }, []);

    const runAi = async () => {
        setLoading(true);
        try {
            const data = await aiAPI.insights(question || undefined);
            setAiResult(data);
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

    const occupancyByHour = useMemo(() => {
        const arr = Array.from({ length: 24 }, () => 0);
        visits.forEach((v: any) => {
            const d = new Date(v.checkInAt);
            arr[d.getHours()] += 1;
        });
        return arr;
    }, [visits]);

    const maxOcc = Math.max(...occupancyByHour) || 1;
    const hours  = Array.from({ length: 24 }, (_, i) => `${i === 0 ? 12 : i > 12 ? i - 12 : i}${i < 12 ? 'a' : 'p'}`);

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

            <Card padding="lg">
                <h2 className="text-lg font-semibold text-white mb-6">Average Hourly Occupancy</h2>
                <div className="flex items-end gap-px h-48 min-h-[12rem]">
                    {occupancyByHour.map((v, i) => (
                        <div key={i} className="flex flex-col items-center flex-1">
                            <div className={`w-full rounded-t-sm transition-all ${v > 60 ? 'bg-red-500' : v > 40 ? 'bg-orange-500' : 'bg-purple-700'}`}
                                style={{ height: `${(v / maxOcc) * 100}%`, minHeight: '4px' }} />
                            {i % 4 === 0 && <span className="text-zinc-500 text-[9px] mt-1">{hours[i]}</span>}
                        </div>
                    ))}
                </div>
                <div className="flex gap-4 mt-3 text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500" /> Peak</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-500" /> Moderate</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-700" /> Low</span>
                </div>
            </Card>

            <Card padding="md">
                <div className="flex gap-3 items-end">
                    <Input label="Ask AI for branch insight" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. Which trends should I act on this week?" />
                    <LoadingButton loading={loading} onClick={runAi}>Generate</LoadingButton>
                </div>
                {aiResult && (
                    <div className="mt-4 space-y-2">
                        <p className="text-zinc-300 text-sm">{aiResult.summary}</p>
                        <p className="text-xs text-zinc-500">Generated by: {aiResult.generatedBy}</p>
                    </div>
                )}
            </Card>

            <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Lightbulb size={18} className="text-yellow-400" /> Recommendations
                </h2>
                <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                    {(aiResult?.insights ?? []).map((line, i) => (
                        <Card key={i} padding="md" className="hover:border-zinc-700/50 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                                <p className="text-white font-semibold">Insight {i + 1}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${impactColor[i === 0 ? 'high' : i === 1 ? 'medium' : 'low']}`}>AI</span>
                            </div>
                            <p className="text-zinc-400 text-sm">{line}</p>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
