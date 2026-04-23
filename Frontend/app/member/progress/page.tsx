'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Flame, Clock, Award, Activity, Plus } from 'lucide-react';
import { PageHeader, Card, Modal, Input, LoadingButton } from '@/components/ui/SharedComponents';
import { opsAPI, getErrorMessage } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { ThemedLineChart } from '@/components/charts/ThemedLineChart';

export default function ProgressPage() {
    const toast = useToast();
    const [metrics, setMetrics] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [workoutFrequency, setWorkoutFrequency] = useState<Array<{ label: string; value: number }>>([]);
    const [vitalsOpen, setVitalsOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [vitalsForm, setVitalsForm] = useState({ weightKg: '', heightCm: '', bmi: '', restingHr: '', notes: '' });

    const loadData = () =>
        Promise.all([opsAPI.myMetrics(), opsAPI.myWorkoutLogs(), opsAPI.dashboardAnalytics('member') as Promise<any>])
            .then(([m, l, a]) => {
                setMetrics((m ?? []) as any[]);
                setLogs((l ?? []) as any[]);
                setWorkoutFrequency((a?.workoutFrequency ?? []) as Array<{ label: string; value: number }>);
            })
            .catch(() => toast.error('Error', 'Failed to load progress data'));

    useEffect(() => { loadData(); }, []);

    const handleLogVitals = async () => {
        const payload = {
            weightKg: vitalsForm.weightKg ? Number(vitalsForm.weightKg) : undefined,
            heightCm: vitalsForm.heightCm ? Number(vitalsForm.heightCm) : undefined,
            bmi: vitalsForm.bmi ? Number(vitalsForm.bmi) : undefined,
            restingHr: vitalsForm.restingHr ? Number(vitalsForm.restingHr) : undefined,
            notes: vitalsForm.notes || undefined,
        };
        if (!payload.weightKg && !payload.bmi && !payload.restingHr) {
            toast.error('Validation', 'Enter at least one measurement');
            return;
        }
        setSaving(true);
        try {
            await opsAPI.addMetric(payload);
            await loadData();
            toast.success('Vitals Logged', 'Your measurements have been recorded');
            setVitalsOpen(false);
            setVitalsForm({ weightKg: '', heightCm: '', bmi: '', restingHr: '', notes: '' });
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

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

    // Distinct stats from metrics: latest weight, lowest BMI, best resting HR
    const latestWeight = metrics.find(m => m.weightKg != null);
    const lowestBmi = metrics.filter(m => m.bmi != null).sort((a, b) => Number(a.bmi) - Number(b.bmi))[0];
    const bestHr = metrics.filter(m => m.restingHr != null).sort((a, b) => Number(a.restingHr) - Number(b.restingHr))[0];
    const prs = [
        latestWeight && { label: 'Latest Weight', value: `${Number(latestWeight.weightKg).toFixed(1)} kg`, date: String(latestWeight.recordedAt ?? '').slice(0, 10) },
        lowestBmi && { label: 'Best BMI', value: Number(lowestBmi.bmi).toFixed(1), date: String(lowestBmi.recordedAt ?? '').slice(0, 10) },
        bestHr && { label: 'Best Resting HR', value: `${bestHr.restingHr} bpm`, date: String(bestHr.recordedAt ?? '').slice(0, 10) },
    ].filter(Boolean) as { label: string; value: string; date: string }[];

    return (
        <div className="space-y-8">
            <PageHeader
                title="Progress & Stats"
                subtitle="Track your fitness journey with GymSphere"
                action={
                    <LoadingButton icon={Plus} onClick={() => setVitalsOpen(true)} size="md">
                        Log Vitals
                    </LoadingButton>
                }
            />

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
                <ThemedLineChart
                    labels={workoutFrequency.map((p) => p.label)}
                    series={[{ name: 'Sessions / week', color: '#f97316', values: workoutFrequency.map((p) => Number(p.value ?? 0)) }]}
                    height={220}
                />
            </Card>

            <Card padding="lg">
                <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                    <Award size={18} className="text-yellow-500" /> Best Metrics
                </h2>
                {prs.length === 0 ? (
                    <p className="text-zinc-500 text-sm">No vitals recorded yet. Use "Log Vitals" to add your measurements.</p>
                ) : (
                    <div className="space-y-3">
                        {prs.map((pr, i) => (
                            <div key={i} className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-4">
                                <div>
                                    <p className="text-white font-semibold">{pr.label}</p>
                                    <p className="text-zinc-500 text-xs">{pr.date}</p>
                                </div>
                                <p className="text-white font-bold">{pr.value}</p>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Log Vitals Modal */}
            <Modal isOpen={vitalsOpen} onClose={() => setVitalsOpen(false)} title="Log Vitals" description="Record your current measurements" size="md">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input id="v-weight" label="Weight (kg)" type="number" value={vitalsForm.weightKg} onChange={e => setVitalsForm(f => ({ ...f, weightKg: e.target.value }))} placeholder="70.5" min="0" />
                        <Input id="v-height" label="Height (cm)" type="number" value={vitalsForm.heightCm} onChange={e => setVitalsForm(f => ({ ...f, heightCm: e.target.value }))} placeholder="175" min="0" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input id="v-bmi" label="BMI (optional)" type="number" value={vitalsForm.bmi} onChange={e => setVitalsForm(f => ({ ...f, bmi: e.target.value }))} placeholder="22.4" min="0" step="0.1" />
                        <Input id="v-hr" label="Resting HR (bpm)" type="number" value={vitalsForm.restingHr} onChange={e => setVitalsForm(f => ({ ...f, restingHr: e.target.value }))} placeholder="65" min="0" />
                    </div>
                    <Input id="v-notes" label="Notes (optional)" value={vitalsForm.notes} onChange={e => setVitalsForm(f => ({ ...f, notes: e.target.value }))} placeholder="Feeling good today..." />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setVitalsOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={saving} onClick={handleLogVitals}>Save Vitals</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
