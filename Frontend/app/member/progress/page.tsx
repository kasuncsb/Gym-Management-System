'use client';

import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Flame, Clock, Award, Activity } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/SharedComponents';
import { opsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export default function ProgressPage() {
    const toast = useToast();
    const [period, setPeriod] = useState<'week' | 'month' | '3month'>('month');
    const [metrics, setMetrics] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        Promise.all([opsAPI.myMetrics(), opsAPI.myWorkoutLogs()])
            .then(([m, l]) => {
                setMetrics((m ?? []) as any[]);
                setLogs((l ?? []) as any[]);
            })
            .catch(() => toast.error('Error', 'Failed to load progress data'));
    }, []);

    const latestMetric = metrics[0];
    const previousMetric = metrics[1];
    const diff = (a?: number, b?: number) => (a != null && b != null ? a - b : null);
    const weightNow = latestMetric?.weightKg != null ? Number(latestMetric.weightKg) : null;
    const weightPrev = previousMetric?.weightKg != null ? Number(previousMetric.weightKg) : null;
    const bmiNow = latestMetric?.bmi != null ? Number(latestMetric.bmi) : null;
    const bmiPrev = previousMetric?.bmi != null ? Number(previousMetric.bmi) : null;
    const vitals = [
        { label: 'Body Weight', value: weightNow != null ? `${weightNow.toFixed(1)} kg` : '—', delta: diff(weightNow ?? undefined, weightPrev ?? undefined), invertGood: true },
        { label: 'BMI', value: bmiNow != null ? bmiNow.toFixed(1) : '—', delta: diff(bmiNow ?? undefined, bmiPrev ?? undefined), invertGood: true },
        { label: 'Resting HR', value: latestMetric?.restingHr != null ? `${latestMetric.restingHr} bpm` : '—', delta: previousMetric?.restingHr != null && latestMetric?.restingHr != null ? latestMetric.restingHr - previousMetric.restingHr : null, invertGood: true },
        { label: 'Entries', value: String(metrics.length), delta: null, invertGood: false },
    ];

    const stats = [
        { label: 'Total Workouts', value: String(logs.length), icon: Activity, color: 'from-blue-600 to-blue-700' },
        { label: 'Calories Burned', value: String(logs.reduce((n, l) => n + Number(l.caloriesBurned ?? 0), 0).toLocaleString()), icon: Flame, color: 'from-orange-600 to-orange-700' },
        { label: 'Total Hours', value: `${(logs.reduce((n, l) => n + Number(l.durationMin ?? 0), 0) / 60).toFixed(1)}h`, icon: Clock, color: 'from-purple-600 to-purple-700' },
        { label: 'Personal Records', value: String(metrics.length), icon: Award, color: 'from-yellow-600 to-yellow-700' },
    ];

    const data = useMemo(() => {
        const buckets = period === 'week' ? 7 : period === 'month' ? 30 : 90;
        const out = Array.from({ length: buckets }, () => 0);
        const now = new Date();
        logs.forEach((l) => {
            const d = new Date(l.workoutDate);
            const delta = Math.floor((now.getTime() - d.getTime()) / (24 * 3600 * 1000));
            if (delta >= 0 && delta < buckets) out[buckets - 1 - delta] += 1;
        });
        return out;
    }, [logs, period]);
    const maxVal     = Math.max(...data, 1);
    const prs = metrics.slice(0, 5).map((m) => ({
        exercise: 'Body Weight',
        weight: m.weightKg ? `${Number(m.weightKg).toFixed(1)} kg` : '—',
        date: String(m.recordedAt).slice(0, 10),
        improvement: m.notes ? String(m.notes).slice(0, 40) : 'Recorded',
    }));

    return (
        <div className="space-y-8">
            <PageHeader
                title="Progress & Stats"
                subtitle="Track your fitness journey at PowerWorld Kiribathgoda"
            />

            <div className="flex gap-2">
                {(['week','month','3month'] as const).map(p => (
                    <button key={p} onClick={() => setPeriod(p)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${period === p ? 'bg-red-600 text-white border border-red-500' : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'}`}>
                        {p === '3month' ? '3 Months' : p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {vitals.map(v => (
                    <Card key={v.label} padding="md" className="hover:border-zinc-700/50 transition-colors">
                        <p className="text-zinc-400 text-xs mb-2">{v.label}</p>
                        <p className="text-2xl font-bold text-white">{v.value}</p>
                        <p className={`text-xs mt-1 font-semibold ${
                            v.delta == null ? 'text-zinc-500' : ((v.invertGood ? v.delta <= 0 : v.delta >= 0) ? 'text-emerald-400' : 'text-red-400')
                        }`}>
                            {v.delta == null ? 'No previous record' : `${v.delta > 0 ? '+' : ''}${v.delta.toFixed(1)} since previous`}
                        </p>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(({ label, value, icon: Icon, color }) => (
                    <Card key={label} padding="md" className="hover:border-zinc-700/50 transition-colors">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
                            <Icon size={18} className="text-white" />
                        </div>
                        <p className="text-xl font-bold text-white">{value}</p>
                        <p className="text-xs text-zinc-500 mt-1">{label}</p>
                    </Card>
                ))}
            </div>

            <Card padding="lg">
                <h2 className="text-lg font-semibold text-white mb-6">Workout Frequency</h2>
                <div className="flex items-end gap-1 h-24 overflow-hidden">
                    {data.map((v, i) => (
                        <div key={i} className="flex-1 min-w-0">
                            <div className={`w-full rounded-t-sm transition-all ${v > 0 ? 'bg-gradient-to-t from-red-700 to-red-500' : 'bg-zinc-800'}`}
                                style={{ height: `${(v / maxVal) * 100}%`, minHeight: '4px' }} />
                        </div>
                    ))}
                </div>
            </Card>

            <Card padding="lg">
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
            </Card>
        </div>
    );
}
