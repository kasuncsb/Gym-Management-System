'use client';

import { useEffect, useState } from 'react';
import { Play, Clock, Flame, Target, Sparkles, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react';
import { PageHeader, Card, LoadingButton } from '@/components/ui/SharedComponents';
import { getErrorMessage, opsAPI } from '@/lib/api';
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
    library:         'bg-zinc-500/20 text-zinc-400',
};

export default function WorkoutsPage() {
    const toast = useToast();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [filter, setFilter] = useState<DifficultyFilter | 'all'>('all');
    const [starting, setStarting] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [exercises, setExercises] = useState<any[]>([]);
    const [loadingExercises, setLoadingExercises] = useState(false);
    const [expandedDay, setExpandedDay] = useState<number | null>(null);

    const loadPlans = () => {
        opsAPI.myWorkoutPlans()
            .then((d) => {
                const items = (d ?? []) as Plan[];
                setPlans(items);
                if (items[0] && !selected) setSelected(items[0].id);
            })
            .catch(() => toast.error('Error', 'Failed to load workout plans'));
    };

    useEffect(() => { loadPlans(); }, []);

    useEffect(() => {
        if (!selected) { setExercises([]); return; }
        setLoadingExercises(true);
        setExpandedDay(null);
        opsAPI.planExercises(selected)
            .then(data => setExercises(data ?? []))
            .catch(() => setExercises([]))
            .finally(() => setLoadingExercises(false));
    }, [selected]);

    // Fixed filter: actually filter by difficulty
    const filtered = filter === 'all'
        ? plans
        : plans.filter(p => (p.difficulty ?? 'beginner') === filter);

    const active = plans.find((p) => p.id === selected);

    const handleGenerateAiPlan = async () => {
        setGenerating(true);
        try {
            await opsAPI.generateAiWorkoutPlan();
            toast.success('Plan Generated', 'Your AI workout plan is ready! Check your notifications.');
            loadPlans();
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="Workout Plans"
                subtitle="Your curated workout programmes for PowerWorld Kiribathgoda"
            />

            {/* Filter bar + AI generate */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2 flex-wrap">
                    {(['all', 'beginner', 'intermediate', 'advanced'] as const).map(g => (
                        <button key={g} onClick={() => setFilter(g)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${filter === g ? 'bg-red-600 text-white border border-red-500' : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'}`}>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Plan list */}
                <div className="space-y-4">
                    {filtered.length === 0 && (
                        <div className="text-center py-10 text-zinc-500 text-sm">
                            <p>No plans yet.</p>
                            <p className="mt-1">Click &quot;Generate AI Plan&quot; to get started.</p>
                        </div>
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
                                    <span className="flex items-center gap-1"><Target size={11} /> Active</span>
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>

                {/* Plan detail panel */}
                {active ? (
                    <Card className="lg:col-span-2">
                        <div className="flex items-start justify-between mb-6 gap-4">
                            <div className="min-w-0">
                                <h2 className="text-xl font-bold text-white">{active.name}</h2>
                                <p className="text-zinc-500 text-sm mt-0.5">
                                    {active.durationWeeks} weeks · {active.daysPerWeek} days/week · <span className="capitalize">{active.difficulty ?? 'beginner'}</span>
                                </p>
                                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold mt-1 ${sourceBadge[active.source] ?? ''}`}>
                                    {sourceLabel[active.source] ?? active.source}
                                </span>
                            </div>
                            <LoadingButton
                                icon={Play}
                                size="sm"
                                loading={starting}
                                onClick={async () => {
                                    setStarting(true);
                                    try {
                                        await opsAPI.addWorkoutLog({
                                            planId: active.id,
                                            workoutDate: new Date().toISOString().slice(0, 10),
                                            durationMin: 45,
                                            mood: 'good',
                                        });
                                        toast.success('Workout started', 'Workout log created successfully.');
                                    } catch (err) {
                                        toast.error('Error', getErrorMessage(err));
                                    } finally {
                                        setStarting(false);
                                    }
                                }}
                            >
                                Start Workout
                            </LoadingButton>
                        </div>
                        <div className="space-y-3">
                            <div className="bg-zinc-800/30 rounded-xl p-4">
                                <p className="text-white text-sm font-semibold mb-2">Plan Description</p>
                                <p className="text-zinc-400 text-sm">
                                    {active.description ?? 'No detailed description yet. Your trainer can add plan details, or generate a new AI plan for personalised guidance.'}
                                </p>
                            </div>
                            <div className="bg-zinc-800/30 rounded-xl p-4">
                                <p className="text-white text-sm font-semibold mb-3">Programme Overview</p>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-red-400">{active.durationWeeks}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">Weeks Total</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-red-400">{active.daysPerWeek}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">Days / Week</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-red-400">{active.durationWeeks * active.daysPerWeek}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">Total Sessions</p>
                                    </div>
                                </div>
                            </div>

                            {/* Exercise list grouped by day */}
                            <div className="bg-zinc-800/30 rounded-xl p-4">
                                <p className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Dumbbell size={14} className="text-red-400" /> Exercise Programme
                                </p>
                                {loadingExercises ? (
                                    <p className="text-zinc-500 text-xs">Loading exercises…</p>
                                ) : exercises.length === 0 ? (
                                    <p className="text-zinc-500 text-xs">No exercises linked yet. Generate an AI plan to get a full exercise list.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {Array.from(new Set(exercises.map(e => e.dayNumber))).sort((a, b) => a - b).map(day => {
                                            const dayExercises = exercises.filter(e => e.dayNumber === day).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
                                            const isOpen = expandedDay === day;
                                            return (
                                                <div key={day} className="border border-zinc-700/50 rounded-lg overflow-hidden">
                                                    <button
                                                        onClick={() => setExpandedDay(isOpen ? null : day)}
                                                        className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors"
                                                    >
                                                        <span className="text-white text-sm font-medium">Day {day}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-zinc-400 text-xs">{dayExercises.length} exercises</span>
                                                            {isOpen ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
                                                        </div>
                                                    </button>
                                                    {isOpen && (
                                                        <div className="divide-y divide-zinc-800/50">
                                                            {dayExercises.map((ex, i) => (
                                                                <div key={i} className="px-4 py-3">
                                                                    <div className="flex items-start justify-between gap-3">
                                                                        <div className="min-w-0">
                                                                            <p className="text-white text-sm font-medium">{ex.exerciseName ?? 'Exercise'}</p>
                                                                            {ex.muscleGroup && <p className="text-zinc-500 text-xs capitalize">{ex.muscleGroup}</p>}
                                                                        </div>
                                                                        <div className="flex gap-2 shrink-0 text-xs">
                                                                            {ex.sets != null && <span className="bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded">{ex.sets} sets</span>}
                                                                            {ex.reps != null && <span className="bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded">{ex.reps} reps</span>}
                                                                            {ex.durationSec != null && <span className="bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded">{ex.durationSec}s</span>}
                                                                            {ex.restSec != null && <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">rest {ex.restSec}s</span>}
                                                                        </div>
                                                                    </div>
                                                                    {ex.instructions && <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed">{ex.instructions}</p>}
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
                    <div className="lg:col-span-2 flex items-center justify-center py-20 text-zinc-600 text-sm">
                        Select a plan to view details
                    </div>
                )}
            </div>
        </div>
    );
}
