"use client";

import { useState, useEffect } from "react";
import { Dumbbell, Sparkles, ChevronDown, ChevronUp, Check, Clock, Loader2, Play, History, Zap, Target } from "lucide-react";
import { workoutAPI, getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { PageHeader, Badge, Card, ErrorAlert, EmptyState, Tabs, LoadingButton, Modal } from "@/components/ui/SharedComponents";

export default function WorkoutsPage() {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<string>("plans");
    const [plans, setPlans] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [generating, setGenerating] = useState(false);
    const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
    const [logModal, setLogModal] = useState(false);
    const [logLoading, setLogLoading] = useState(false);
    const [logData, setLogData] = useState({
        planId: '',
        durationMinutes: 30,
        caloriesBurned: 0,
        notes: '',
        rating: 4,
    });

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const [plansRes, historyRes] = await Promise.allSettled([
                workoutAPI.getMyPlans(),
                workoutAPI.getWorkoutHistory(),
            ]);
            if (plansRes.status === 'fulfilled') setPlans(plansRes.value.data.data || []);
            if (historyRes.status === 'fulfilled') setHistory(historyRes.value.data.data || []);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleGenerateAI = async () => {
        setGenerating(true);
        try {
            await workoutAPI.generateAIPlan();
            toast.success("AI Workout Plan Generated!", "Your personalized plan is ready.");
            await fetchData();
        } catch (err) {
            toast.error("Generation failed", getErrorMessage(err));
        } finally {
            setGenerating(false);
        }
    };

    const handleLogWorkout = async () => {
        setLogLoading(true);
        try {
            await workoutAPI.logWorkout({
                planId: logData.planId || undefined,
                durationMinutes: logData.durationMinutes,
                caloriesBurned: logData.caloriesBurned || undefined,
                notes: logData.notes || undefined,
                rating: logData.rating,
            });
            toast.success("Workout logged!", "Great job! Keep it up.");
            setLogModal(false);
            setLogData({ planId: '', durationMinutes: 30, caloriesBurned: 0, notes: '', rating: 4 });
            await fetchData();
        } catch (err) {
            toast.error("Failed to log", getErrorMessage(err));
        } finally {
            setLogLoading(false);
        }
    };

    const activePlans = plans.filter((p: any) => p.isActive);

    const tabs = [
        { key: "plans", label: "My Plans", count: activePlans.length },
        { key: "history", label: "History", count: history.length },
    ];

    if (loading) {
        return (
            <div className="space-y-8 page-enter">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-36" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-10 w-64" />
                <div className="grid gap-4">
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 page-enter">
            <PageHeader
                title="Workouts"
                subtitle="Your workout plans and exercise history"
                actions={
                    <div className="flex gap-3">
                        <LoadingButton
                            variant="secondary"
                            icon={Play}
                            onClick={() => setLogModal(true)}
                        >
                            Log Workout
                        </LoadingButton>
                        <LoadingButton
                            loading={generating}
                            icon={Sparkles}
                            onClick={handleGenerateAI}
                        >
                            Generate AI Plan
                        </LoadingButton>
                    </div>
                }
            />

            {error && <ErrorAlert message={error} onRetry={fetchData} />}

            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            {/* Plans Tab */}
            {activeTab === "plans" && (
                <div className="space-y-4">
                    {activePlans.length === 0 ? (
                        <EmptyState
                            icon={Dumbbell}
                            title="No active workout plans"
                            description="Generate an AI-powered workout plan or ask your trainer to create one for you."
                            action={
                                <LoadingButton
                                    loading={generating}
                                    icon={Sparkles}
                                    onClick={handleGenerateAI}
                                >
                                    Generate AI Plan
                                </LoadingButton>
                            }
                        />
                    ) : (
                        <div className="space-y-4 stagger-in">
                            {activePlans.map((plan: any) => (
                                <Card key={plan.id} padding="none">
                                    <button
                                        className="w-full p-5 flex items-center justify-between text-left hover:bg-zinc-800/30 transition-colors rounded-t-2xl"
                                        onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center">
                                                <Target className="text-red-400" size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-white">{plan.name || 'Workout Plan'}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <Badge variant={plan.planSource === 'ai_generated' ? 'info' : 'default'}>
                                                        {plan.planSource === 'ai_generated' ? 'AI Generated' : plan.planSource || 'Manual'}
                                                    </Badge>
                                                    <span className="text-xs text-zinc-500">
                                                        {plan.exercises?.length || 0} exercises
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {expandedPlan === plan.id ? (
                                            <ChevronUp className="text-zinc-500" size={20} />
                                        ) : (
                                            <ChevronDown className="text-zinc-500" size={20} />
                                        )}
                                    </button>

                                    {expandedPlan === plan.id && plan.exercises && (
                                        <div className="px-5 pb-5 border-t border-zinc-800">
                                            {plan.description && (
                                                <p className="text-sm text-zinc-400 py-3">{plan.description}</p>
                                            )}
                                            <div className="space-y-2 mt-2">
                                                {(plan.exercises || []).map((ex: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-xl">
                                                        <div className="w-8 h-8 rounded-lg bg-zinc-700/50 flex items-center justify-center text-xs font-bold text-zinc-400">
                                                            {i + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-zinc-200">{ex.exerciseName || ex.name}</p>
                                                            <p className="text-xs text-zinc-500">
                                                                {[
                                                                    ex.sets && `${ex.sets} sets`,
                                                                    ex.reps && `${ex.reps} reps`,
                                                                    ex.durationMinutes && `${ex.durationMinutes} min`,
                                                                    ex.restSeconds && `${ex.restSeconds}s rest`,
                                                                ].filter(Boolean).join(' \u2022 ')}
                                                            </p>
                                                        </div>
                                                        {ex.muscleGroup && (
                                                            <Badge variant="outline">{ex.muscleGroup}</Badge>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-4 flex justify-end">
                                                <LoadingButton
                                                    variant="primary"
                                                    size="sm"
                                                    icon={Play}
                                                    onClick={() => {
                                                        setLogData(prev => ({ ...prev, planId: plan.id }));
                                                        setLogModal(true);
                                                    }}
                                                >
                                                    Start Workout
                                                </LoadingButton>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
                <div className="space-y-4">
                    {history.length === 0 ? (
                        <EmptyState
                            icon={History}
                            title="No workout history"
                            description="Start logging your workouts to track your progress over time."
                            action={
                                <LoadingButton icon={Play} onClick={() => setLogModal(true)}>
                                    Log First Workout
                                </LoadingButton>
                            }
                        />
                    ) : (
                        <Card padding="none">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-zinc-800 text-zinc-500 text-left">
                                            <th className="p-4 font-medium">Date</th>
                                            <th className="p-4 font-medium">Plan</th>
                                            <th className="p-4 font-medium">Duration</th>
                                            <th className="p-4 font-medium">Calories</th>
                                            <th className="p-4 font-medium">Rating</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((log: any, i: number) => (
                                            <tr key={i} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors">
                                                <td className="p-4 text-zinc-200">
                                                    {log.loggedAt ? new Date(log.loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                                                </td>
                                                <td className="p-4 text-zinc-400">{log.planName || 'Free workout'}</td>
                                                <td className="p-4 text-zinc-300">{log.durationMinutes || 0} min</td>
                                                <td className="p-4 text-zinc-300">{log.caloriesBurned || '-'}</td>
                                                <td className="p-4">
                                                    <div className="flex gap-0.5">
                                                        {Array.from({ length: 5 }).map((_, s) => (
                                                            <div
                                                                key={s}
                                                                className={`w-2 h-2 rounded-full ${s < (log.rating || 0) ? 'bg-amber-400' : 'bg-zinc-700'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* Log Workout Modal */}
            <Modal
                isOpen={logModal}
                onClose={() => setLogModal(false)}
                title="Log Workout"
                description="Record your workout session details"
                size="sm"
            >
                <div className="space-y-4">
                    {activePlans.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Workout Plan (optional)</label>
                            <select
                                value={logData.planId}
                                onChange={(e) => setLogData(prev => ({ ...prev, planId: e.target.value }))}
                                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                            >
                                <option value="">Free workout</option>
                                {activePlans.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name || 'Plan'}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Duration (min)</label>
                            <input
                                type="number"
                                value={logData.durationMinutes}
                                onChange={(e) => setLogData(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) || 0 }))}
                                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Calories Burned</label>
                            <input
                                type="number"
                                value={logData.caloriesBurned || ''}
                                onChange={(e) => setLogData(prev => ({ ...prev, caloriesBurned: parseInt(e.target.value) || 0 }))}
                                placeholder="Optional"
                                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 placeholder-zinc-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Rating</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setLogData(prev => ({ ...prev, rating: r }))}
                                    className={`w-10 h-10 rounded-lg border text-sm font-bold transition-all ${
                                        r <= logData.rating
                                            ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                                            : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600'
                                    }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Notes (optional)</label>
                        <textarea
                            value={logData.notes}
                            onChange={(e) => setLogData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="How did the workout feel?"
                            rows={2}
                            className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none placeholder-zinc-500"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setLogModal(false)}>
                            Cancel
                        </LoadingButton>
                        <LoadingButton loading={logLoading} icon={Check} onClick={handleLogWorkout}>
                            Log Workout
                        </LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
