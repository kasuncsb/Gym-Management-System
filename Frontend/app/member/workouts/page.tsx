'use client';

import { useEffect, useState } from 'react';
import { Play, Clock, Flame, Sparkles, ChevronDown, ChevronUp, Dumbbell, Library, Trash2, ClipboardCheck } from 'lucide-react';
import { PageHeader, Card, LoadingButton, Input } from '@/components/ui/SharedComponents';
import { aiAPI, getErrorMessage, opsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

type DifficultyFilter = 'beginner' | 'intermediate' | 'advanced';

interface Plan {
    id: string;
    name: string;
    source: 'trainer_created' | 'ai_generated' | 'library';
    difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
    durationWeeks: number;
    daysPerWeek: number;
    description?: string | null;
}

interface ProgramExercise {
    name: string;
    sets?: number | null;
    reps?: number | null;
    durationSec?: number | null;
    restSec?: number | null;
    instructions?: string | null;
    muscleGroup?: string | null;
    imageUrl?: string | null;
    videoUrl?: string | null;
    equipment?: string | null;
}

interface ProgramDay {
    dayNumber: number;
    title?: string | null;
    exercises: ProgramExercise[];
}

interface PlanDetail extends Plan {
    program?: { meta?: { focus?: string | null; locale?: string | null }; days?: ProgramDay[] };
}

const difficultyColor: Record<string, string> = {
    beginner:     'bg-green-500/20 text-green-400',
    intermediate: 'bg-yellow-500/20 text-yellow-400',
    advanced:     'bg-red-500/20 text-red-400',
};

const sourceLabel: Record<string, string> = {
    trainer_created: 'Trainer',
    ai_generated:    'AI Generated',
    library:         'Library',
};

const sourceBadge: Record<string, string> = {
    trainer_created: 'bg-blue-500/20 text-blue-400',
    ai_generated:    'bg-purple-500/20 text-purple-400',
    library:         'bg-amber-500/20 text-amber-300',
};

export default function WorkoutsPage() {
    const toast = useToast();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [libraryPlans, setLibraryPlans] = useState<Plan[]>([]);
    const [listTab, setListTab] = useState<'mine' | 'library'>('mine');
    const [selected, setSelected] = useState<string | null>(null);
    const [planDetail, setPlanDetail] = useState<PlanDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [filter, setFilter] = useState<DifficultyFilter | 'all'>('all');
    const [starting, setStarting] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [expandedDay, setExpandedDay] = useState<number | null>(null);
    const [activeSession, setActiveSession] = useState<any | null>(null);
    const [removing, setRemoving] = useState(false);
    const [logOpen, setLogOpen] = useState(false);
    const [logDuration, setLogDuration] = useState('');
    const [logMood, setLogMood] = useState<'great' | 'good' | 'okay' | 'tired' | 'poor'>('good');
    const [logging, setLogging] = useState(false);

    const loadPlans = () => {
        opsAPI.myWorkoutPlans()
            .then((d) => {
                const items = (d ?? []) as Plan[];
                setPlans(items);
                if (items.length === 0 && listTab === 'mine') setSelected(null);
                if (items[0] && listTab === 'mine' && !selected) setSelected(items[0].id);
            })
            .catch(() => toast.error('Error', 'Failed to load workout plans'));
    };

    useEffect(() => {
        loadPlans();
        opsAPI.workoutLibrary()
            .then((d) => setLibraryPlans((d ?? []) as Plan[]))
            .catch(() => setLibraryPlans([]));
    }, []);

    useEffect(() => {
        opsAPI.activeWorkoutSession().then(setActiveSession).catch(() => setActiveSession(null));
    }, []);

    useEffect(() => {
        setLogOpen(false);
    }, [selected]);

    useEffect(() => {
        const src = listTab === 'mine' ? plans : libraryPlans;
        const ids = src.map(p => p.id);
        if (ids.length === 0) {
            setSelected(null);
            return;
        }
        if (selected && ids.includes(selected)) return;
        setSelected(ids[0]);
    }, [listTab, plans, libraryPlans, selected]);

    useEffect(() => {
        if (!selected) {
            setPlanDetail(null);
            return;
        }
        setLoadingDetail(true);
        setExpandedDay(null);
        opsAPI.getWorkoutPlan(selected)
            .then((d) => setPlanDetail(d as PlanDetail))
            .catch(() => {
                setPlanDetail(null);
                toast.error('Error', 'Could not load programme details');
            })
            .finally(() => setLoadingDetail(false));
    }, [selected]);

    const listSource = listTab === 'mine' ? plans : libraryPlans;
    const filtered = filter === 'all'
        ? listSource
        : listSource.filter(p => (p.difficulty ?? 'beginner') === filter);

    const noProgrammesInTab = listSource.length === 0;
    const filterExcludesAll = listSource.length > 0 && filtered.length === 0;
    const listEmpty = noProgrammesInTab || filterExcludesAll;
    const active = planDetail;
    const isAssignedPlan = plans.some(p => p.id === selected);

    const handleGenerateAiPlan = async () => {
        setGenerating(true);
        try {
            await aiAPI.workoutPlan();
            toast.success('Plan Generated', 'Your AI workout plan is ready! Check your notifications.');
            loadPlans();
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setGenerating(false);
        }
    };

    const days = active?.program?.days ?? [];

    const handleRemovePlan = async () => {
        if (!active || !isAssignedPlan) return;
        if (!globalThis.confirm(`Remove “${active.name}” from My programmes? You can ask your trainer to assign it again later.`)) return;
        setRemoving(true);
        try {
            await opsAPI.removeMyWorkoutPlan(active.id);
            toast.success('Plan removed', 'This programme is no longer in My programmes.');
            if (selected === active.id) setSelected(null);
            loadPlans();
            setPlanDetail(null);
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setRemoving(false);
        }
    };

    const handleLogCompleted = async () => {
        if (!active) return;
        const today = new Date().toISOString().slice(0, 10);
        const durationMin = logDuration.trim() ? Math.max(1, Number(logDuration)) : undefined;
        if (logDuration.trim() && Number.isNaN(durationMin!)) {
            toast.error('Error', 'Enter a valid duration in minutes.');
            return;
        }
        setLogging(true);
        try {
            await opsAPI.addWorkoutLog({
                planId: isAssignedPlan ? active.id : undefined,
                workoutDate: today,
                durationMin,
                mood: logMood,
                notes: `Completed workout — ${active.name}`,
            });
            toast.success('Workout logged', 'Your session was saved to your history.');
            setLogOpen(false);
            setLogDuration('');
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setLogging(false);
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="Workout Plans"
                subtitle="Your programmes and the PowerWorld Kiribathgoda library — day-by-day sessions with media"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2 flex-wrap items-center">
                    <button
                        type="button"
                        onClick={() => { setListTab('mine'); const p = plans[0]; if (p) setSelected(p.id); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${listTab === 'mine' ? 'bg-red-600 text-white border border-red-500' : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'}`}
                    >
                        My programmes
                    </button>
                    <button
                        type="button"
                        onClick={() => { setListTab('library'); const p = libraryPlans[0]; if (p) setSelected(p.id); }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${listTab === 'library' ? 'bg-red-600 text-white border border-red-500' : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'}`}
                    >
                        <Library size={14} /> Library
                    </button>
                    <span className="text-zinc-600 hidden sm:inline">|</span>
                    {(['all', 'beginner', 'intermediate', 'advanced'] as const).map(g => (
                        <button key={g} onClick={() => setFilter(g)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${filter === g ? 'bg-zinc-700 text-white border border-zinc-600' : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'}`}>
                            {g === 'all' ? 'All Levels' : g.charAt(0).toUpperCase() + g.slice(1)}
                        </button>
                    ))}
                </div>
                <LoadingButton
                    icon={Sparkles}
                    size="sm"
                    variant="secondary"
                    loading={generating}
                    onClick={handleGenerateAiPlan}
                >
                    Generate AI Plan
                </LoadingButton>
            </div>

            {listEmpty ? (
                <Card className="p-8 text-center max-w-xl mx-auto">
                    <p className="text-white font-semibold mb-2">
                        {filterExcludesAll
                            ? 'No programmes match this difficulty'
                            : listTab === 'mine'
                                ? 'No programmes in My programmes'
                                : 'No library programmes loaded'}
                    </p>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                        {filterExcludesAll
                            ? 'Switch to All Levels or pick another difficulty to see programmes again.'
                            : listTab === 'mine'
                                ? 'Use Generate AI Plan or ask your trainer to assign a programme. Library templates are available under Library when you want ideas.'
                                : 'Try again later or contact support if programmes should appear here.'}
                    </p>
                </Card>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                    {listTab === 'library' && (
                        <p className="text-zinc-500 text-xs leading-relaxed px-1">
                            Preview club programmes. Ask your trainer to assign one to your account for tracking and sessions.
                        </p>
                    )}
                    {filtered.map(plan => (
                        <div key={plan.id} onClick={() => setSelected(plan.id)}>
                            <Card padding="md"
                                className={`cursor-pointer transition-all hover:scale-[1.01] ${selected === plan.id ? 'border-red-600/60 bg-red-600/5' : 'hover:border-zinc-700/50'}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0 mr-2">
                                        <p className="text-white font-semibold truncate">{plan.name}</p>
                                        <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-semibold mt-0.5 ${sourceBadge[plan.source] ?? 'bg-zinc-700 text-zinc-300'}`}>
                                            {sourceLabel[plan.source] ?? plan.source}
                                        </span>
                                    </div>
                                    <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${difficultyColor[plan.difficulty ?? 'beginner']}`}>
                                        {plan.difficulty ?? 'beginner'}
                                    </span>
                                </div>
                                <div className="flex gap-4 text-xs text-zinc-500">
                                    <span className="flex items-center gap-1"><Clock size={11} /> {plan.durationWeeks} weeks</span>
                                    <span className="flex items-center gap-1"><Flame size={11} /> {plan.daysPerWeek} days/week</span>
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>

                {loadingDetail && selected ? (
                    <Card className="lg:col-span-2 flex items-center justify-center min-h-[320px] text-zinc-500 text-sm">
                        Loading programme…
                    </Card>
                ) : active ? (
                    <Card className="lg:col-span-2">
                        <div className="flex items-start justify-between mb-6 gap-4">
                            <div className="min-w-0">
                                <h2 className="text-xl font-bold text-white">{active.name}</h2>
                                <p className="text-zinc-500 text-sm mt-0.5">
                                    {active.durationWeeks} weeks · {active.daysPerWeek} days/week · <span className="capitalize">{active.difficulty ?? 'beginner'}</span>
                                    {active.program?.meta?.focus && (
                                        <span> · {active.program.meta.focus}</span>
                                    )}
                                </p>
                                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold mt-1 ${sourceBadge[active.source] ?? ''}`}>
                                    {sourceLabel[active.source] ?? active.source}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-end">
                            {isAssignedPlan && (
                                <>
                                <LoadingButton
                                    icon={Play}
                                    size="sm"
                                    loading={starting}
                                    onClick={async () => {
                                        setStarting(true);
                                        try {
                                            if (activeSession?.id) {
                                                await opsAPI.stopWorkoutSession(activeSession.id, { complete: true, mood: 'good' });
                                                toast.success('Workout completed', 'Session saved — nice work.');
                                                setActiveSession(null);
                                                opsAPI.activeWorkoutSession().then(setActiveSession).catch(() => setActiveSession(null));
                                            } else {
                                                const s = await opsAPI.startWorkoutSession({ planId: active.id, notes: `Started from plan: ${active.name}` });
                                                toast.success('Workout started', 'Session is live — tap Complete when you are done.');
                                                setActiveSession(s);
                                            }
                                        } catch (err) {
                                            toast.error('Error', getErrorMessage(err));
                                        } finally {
                                            setStarting(false);
                                        }
                                    }}
                                >
                                    {activeSession?.id ? 'Complete session' : 'Start workout'}
                                </LoadingButton>
                                <LoadingButton
                                    icon={ClipboardCheck}
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setLogOpen((o) => !o)}
                                >
                                    Log completed
                                </LoadingButton>
                                <LoadingButton
                                    icon={Trash2}
                                    size="sm"
                                    variant="secondary"
                                    loading={removing}
                                    onClick={handleRemovePlan}
                                >
                                    Remove
                                </LoadingButton>
                                </>
                            )}
                            </div>
                        </div>

                        {isAssignedPlan && logOpen && (
                            <div className="mb-4 rounded-xl border border-zinc-700/80 bg-zinc-900/50 p-4 space-y-3">
                                <p className="text-white text-sm font-medium">Log a completed workout</p>
                                <p className="text-zinc-500 text-xs">Saves to your history without using a live timer. Optional duration refines your log.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Input
                                        label="Duration (minutes)"
                                        type="number"
                                        min={1}
                                        value={logDuration}
                                        onChange={(e) => setLogDuration(e.target.value)}
                                        placeholder="e.g. 45"
                                    />
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">How it felt</label>
                                        <select
                                            value={logMood}
                                            onChange={(e) => setLogMood(e.target.value as typeof logMood)}
                                            className="w-full bg-zinc-900 text-white border border-zinc-700 rounded-xl px-3 py-2.5 text-sm"
                                        >
                                            {(['great', 'good', 'okay', 'tired', 'poor'] as const).map((m) => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <LoadingButton size="sm" loading={logging} onClick={handleLogCompleted}>Save log</LoadingButton>
                                    <button type="button" onClick={() => setLogOpen(false)} className="text-xs px-3 py-2 text-zinc-400 hover:text-white">Cancel</button>
                                </div>
                            </div>
                        )}

                        {listTab === 'library' && (
                            <p className="text-amber-200/80 text-xs mb-4 border border-amber-500/20 bg-amber-500/5 rounded-lg px-3 py-2">
                                Library preview — start sessions from <strong className="text-white">My programmes</strong> after your trainer assigns a plan.
                            </p>
                        )}

                        <div className="mb-6 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const detail = { role: 'member' as const, message: `Explain my plan "${active.name}" and what I should focus on this week.` };
                                    window.dispatchEvent(new CustomEvent('pw:ai-chat-prefill', { detail }));
                                }}
                                className="text-xs px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                            >
                                Ask AI About This Plan
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-zinc-800/30 rounded-xl p-4">
                                <p className="text-white text-sm font-semibold mb-2">Plan Description</p>
                                <p className="text-zinc-400 text-sm">
                                    {active.description ?? 'No detailed description.'}
                                </p>
                            </div>
                            <div className="bg-zinc-800/30 rounded-xl p-4">
                                <p className="text-white text-sm font-semibold mb-3">Programme Overview</p>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-red-400">{active.durationWeeks}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">Weeks</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-red-400">{active.daysPerWeek}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">Days / Week</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-red-400">{days.length}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">Training days</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-zinc-800/30 rounded-xl p-4">
                                <p className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Dumbbell size={14} className="text-red-400" /> Exercise Programme
                                </p>
                                {days.length === 0 ? (
                                    <p className="text-zinc-500 text-xs">No structured days in this programme yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {days.map(day => {
                                            const isOpen = expandedDay === day.dayNumber;
                                            const exs = day.exercises ?? [];
                                            return (
                                                <div key={day.dayNumber} className="border border-zinc-700/50 rounded-lg overflow-hidden">
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedDay(isOpen ? null : day.dayNumber)}
                                                        className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors"
                                                    >
                                                        <span className="text-white text-sm font-medium">{day.title ?? `Day ${day.dayNumber}`}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-zinc-400 text-xs">{exs.length} exercises</span>
                                                            {isOpen ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
                                                        </div>
                                                    </button>
                                                    {isOpen && (
                                                        <div className="divide-y divide-zinc-800/50">
                                                            {exs.map((ex, i) => (
                                                                <div key={i} className="px-4 py-3">
                                                                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                                                        {ex.imageUrl && (
                                                                            <img src={ex.imageUrl} alt="" className="w-full sm:w-28 h-20 object-cover rounded-lg border border-zinc-700/50 shrink-0" />
                                                                        )}
                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="flex items-start justify-between gap-3">
                                                                                <div>
                                                                                    <p className="text-white text-sm font-medium">{ex.name}</p>
                                                                                    {ex.muscleGroup && <p className="text-zinc-500 text-xs capitalize">{ex.muscleGroup}</p>}
                                                                                    {ex.equipment && <p className="text-zinc-600 text-[10px] mt-0.5">Equipment: {ex.equipment}</p>}
                                                                                </div>
                                                                                <div className="flex flex-wrap gap-2 shrink-0 text-xs justify-end">
                                                                                    {ex.sets != null && <span className="bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded">{ex.sets} sets</span>}
                                                                                    {ex.reps != null && <span className="bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded">{ex.reps} reps</span>}
                                                                                    {ex.durationSec != null && <span className="bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded">{ex.durationSec}s</span>}
                                                                                    {ex.restSec != null && <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">rest {ex.restSec}s</span>}
                                                                                </div>
                                                                            </div>
                                                                            {ex.instructions && <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed">{ex.instructions}</p>}
                                                                            {ex.videoUrl && (
                                                                                <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" className="text-red-400 text-xs mt-2 inline-block hover:underline">
                                                                                    Watch demo →
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                ) : (
                    <Card className="lg:col-span-2 flex flex-col items-center justify-center min-h-[280px] text-zinc-500 text-sm text-center px-6">
                        <p className="text-zinc-400">Choose a programme from the list to see exercises and actions.</p>
                    </Card>
                )}
            </div>
            )}
        </div>
    );
}
