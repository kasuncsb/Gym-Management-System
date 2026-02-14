"use client";

import { useEffect, useState } from "react";
import { Dumbbell, Loader2, Calendar, Clock, Target, Sparkles, BookOpen, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { workoutAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Exercise {
    id: string;
    exerciseName: string;
    dayNumber: number;
    exerciseOrder: number;
    sets: number | null;
    reps: string | null;
    restSeconds: number | null;
    notes: string | null;
    equipment: string | null;
    muscleGroups: string[] | null;
}

interface WorkoutPlan {
    id: string;
    planName: string;
    planDescription: string | null;
    source: string;
    durationWeeks: number;
    daysPerWeek: number;
    difficulty: string | null;
    isActive: boolean;
    createdAt: string;
    exercises?: Exercise[];
}

type Tab = 'plans' | 'library' | 'log';

export default function WorkoutsPage() {
    const [plans, setPlans] = useState<WorkoutPlan[]>([]);
    const [library, setLibrary] = useState<WorkoutPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>('plans');
    const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
    const [planDetails, setPlanDetails] = useState<Record<string, WorkoutPlan>>({});
    const [generating, setGenerating] = useState(false);
    const [logForm, setLogForm] = useState({ exerciseName: '', setsCompleted: '', repsCompleted: '', weightUsed: '', durationMinutes: '', notes: '' });
    const [submittingLog, setSubmittingLog] = useState(false);

    useEffect(() => {
        const fetcher = async () => {
            try {
                const [plansRes, libRes] = await Promise.all([
                    workoutAPI.getMyPlans().catch(() => ({ data: { data: [] } })),
                    workoutAPI.getLibrary().catch(() => ({ data: { data: [] } })),
                ]);
                setPlans(plansRes.data.data || []);
                setLibrary(libRes.data.data || []);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetcher();
    }, []);

    const togglePlan = async (planId: string) => {
        if (expandedPlan === planId) { setExpandedPlan(null); return; }
        setExpandedPlan(planId);
        if (!planDetails[planId]) {
            try {
                const res = await workoutAPI.getPlan(planId);
                setPlanDetails(prev => ({ ...prev, [planId]: res.data.data }));
            } catch (e) { console.error(e); }
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            await workoutAPI.generateAIPlan();
            const res = await workoutAPI.getMyPlans();
            setPlans(res.data.data || []);
        } catch (e) { console.error(e); }
        finally { setGenerating(false); }
    };

    const handleLogWorkout = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingLog(true);
        try {
            const payload: Record<string, unknown> = { exerciseName: logForm.exerciseName };
            if (logForm.setsCompleted) payload.setsCompleted = parseInt(logForm.setsCompleted);
            if (logForm.repsCompleted) payload.repsCompleted = parseInt(logForm.repsCompleted);
            if (logForm.weightUsed) payload.weightUsed = logForm.weightUsed;
            if (logForm.durationMinutes) payload.durationMinutes = parseInt(logForm.durationMinutes);
            if (logForm.notes) payload.notes = logForm.notes;
            await workoutAPI.logWorkout(payload);
            setLogForm({ exerciseName: '', setsCompleted: '', repsCompleted: '', weightUsed: '', durationMinutes: '', notes: '' });
            setTab('plans');
        } catch (e) { console.error(e); }
        finally { setSubmittingLog(false); }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-red-500" size={32} /></div>;
    }

    const renderPlanCard = (plan: WorkoutPlan) => {
        const isExpanded = expandedPlan === plan.id;
        const details = planDetails[plan.id];
        return (
            <div key={plan.id} className="rounded-2xl border border-zinc-800 bg-black/40 overflow-hidden">
                <button onClick={() => togglePlan(plan.id)} className="w-full p-6 text-left flex items-center justify-between hover:bg-zinc-900/30 transition">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-bold text-white">{plan.planName}</h3>
                            {plan.difficulty && (
                                <span className={cn("text-xs px-2 py-0.5 rounded-full border",
                                    plan.difficulty === 'beginner' ? 'text-green-400 border-green-500/30 bg-green-500/10' :
                                    plan.difficulty === 'intermediate' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
                                    'text-red-400 border-red-500/30 bg-red-500/10'
                                )}>{plan.difficulty}</span>
                            )}
                        </div>
                        {plan.planDescription && <p className="text-sm text-zinc-500">{plan.planDescription}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {plan.durationWeeks} weeks</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {plan.daysPerWeek} days/week</span>
                            <span className="capitalize">{plan.source.replace('_', ' ')}</span>
                        </div>
                    </div>
                    {isExpanded ? <ChevronUp size={20} className="text-zinc-400" /> : <ChevronDown size={20} className="text-zinc-400" />}
                </button>
                {isExpanded && details?.exercises && (
                    <div className="border-t border-zinc-800">
                        {Array.from(new Set(details.exercises.map(e => e.dayNumber))).sort().map(day => (
                            <div key={day}>
                                <div className="px-6 py-2 bg-zinc-900/50 text-xs font-semibold text-zinc-400 uppercase">Day {day}</div>
                                <div className="divide-y divide-zinc-800/50">
                                    {details.exercises!.filter(e => e.dayNumber === day).sort((a, b) => a.exerciseOrder - b.exerciseOrder).map(ex => (
                                        <div key={ex.id} className="px-6 py-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium text-sm">{ex.exerciseName}</p>
                                                {ex.muscleGroups && <p className="text-xs text-zinc-600">{ex.muscleGroups.join(', ')}</p>}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-zinc-400">
                                                {ex.sets && ex.reps && <span>{ex.sets} &times; {ex.reps}</span>}
                                                {ex.restSeconds && <span className="text-xs text-zinc-600">{ex.restSeconds}s rest</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">My Workouts</h2>
                    <p className="text-zinc-400 mt-1">Your workout plans, curated library, and logging</p>
                </div>
                <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-purple-600 to-red-600 text-white rounded-xl hover:opacity-90 transition font-medium disabled:opacity-50">
                    <Sparkles size={18} /> {generating ? 'Generating...' : 'AI Generate Plan'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-zinc-900/50 border border-zinc-800 w-fit">
                {([{ key: 'plans' as Tab, label: 'My Plans', icon: Dumbbell }, { key: 'library' as Tab, label: 'Library', icon: BookOpen }, { key: 'log' as Tab, label: 'Log Workout', icon: Plus }]).map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition", tab === t.key ? 'bg-red-700 text-white' : 'text-zinc-400 hover:text-white')}>
                        <t.icon size={16} /> {t.label}
                    </button>
                ))}
            </div>

            {tab === 'plans' && (
                plans.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-800 bg-black/30 p-16 text-center">
                        <Target className="mx-auto mb-4 text-zinc-600" size={40} />
                        <h3 className="text-xl font-semibold text-zinc-300 mb-2">No Workout Plans Yet</h3>
                        <p className="text-zinc-500 max-w-md mx-auto mb-6">Generate an AI plan or ask your trainer to assign one.</p>
                        <button onClick={handleGenerate} disabled={generating} className="px-6 py-2.5 bg-linear-to-r from-purple-600 to-red-600 text-white rounded-xl font-medium">
                            <Sparkles size={16} className="inline mr-2" /> Generate AI Plan
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">{plans.map(p => renderPlanCard(p))}</div>
                )
            )}

            {tab === 'library' && (
                library.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-800 bg-black/30 p-16 text-center">
                        <BookOpen className="mx-auto mb-4 text-zinc-600" size={40} />
                        <h3 className="text-xl font-semibold text-zinc-300">Library is empty</h3>
                        <p className="text-zinc-500 mt-2">The curated library will be populated by trainers.</p>
                    </div>
                ) : (
                    <div className="space-y-4">{library.map(p => renderPlanCard(p))}</div>
                )
            )}

            {tab === 'log' && (
                <form onSubmit={handleLogWorkout} className="rounded-2xl border border-zinc-800 bg-black/40 p-6 space-y-4 max-w-xl">
                    <h3 className="text-lg font-bold text-white mb-2">Log a Workout</h3>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Exercise Name *</label>
                        <input required type="text" value={logForm.exerciseName} onChange={e => setLogForm({...logForm, exerciseName: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" placeholder="Bench Press" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm text-zinc-400 mb-1">Sets</label><input type="number" value={logForm.setsCompleted} onChange={e => setLogForm({...logForm, setsCompleted: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" /></div>
                        <div><label className="block text-sm text-zinc-400 mb-1">Reps</label><input type="number" value={logForm.repsCompleted} onChange={e => setLogForm({...logForm, repsCompleted: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" /></div>
                        <div><label className="block text-sm text-zinc-400 mb-1">Weight</label><input type="text" value={logForm.weightUsed} onChange={e => setLogForm({...logForm, weightUsed: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" placeholder="60kg" /></div>
                        <div><label className="block text-sm text-zinc-400 mb-1">Duration (min)</label><input type="number" value={logForm.durationMinutes} onChange={e => setLogForm({...logForm, durationMinutes: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" /></div>
                    </div>
                    <div><label className="block text-sm text-zinc-400 mb-1">Notes</label><textarea value={logForm.notes} onChange={e => setLogForm({...logForm, notes: e.target.value})} rows={2} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" /></div>
                    <button type="submit" disabled={submittingLog} className="px-6 py-2.5 bg-red-700 text-white rounded-xl hover:bg-red-600 transition font-medium disabled:opacity-50">
                        {submittingLog ? 'Logging...' : 'Log Workout'}
                    </button>
                </form>
            )}
        </div>
    );
}
