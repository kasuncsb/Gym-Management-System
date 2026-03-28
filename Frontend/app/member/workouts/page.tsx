'use client';

import { useEffect, useState } from 'react';
import { Play, Clock, Flame, Sparkles, ChevronDown, ChevronUp, Dumbbell, Library, Trash2, ClipboardCheck } from 'lucide-react';
import { PageHeader, Card, LoadingButton, Input, Modal } from '@/components/ui/SharedComponents';
import { aiAPI, getErrorMessage, opsAPI, type AiWorkoutPlanPreferencesPayload } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

type DifficultyFilter = 'beginner' | 'intermediate' | 'advanced';

const selectFieldClass =
    'w-full bg-zinc-900 text-white border border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600';

const AI_PLAN_PREF_DEFAULTS: AiWorkoutPlanPreferencesPayload = {
    primaryFocus: 'General fitness & health',
    daysPerWeek: '3 days per week',
    sessionLength: '45–55 minutes',
    equipmentAccess: 'Full gym — machines & free weights',
    emphasis: 'Balanced full body',
    avoidOrInjuries: '',
    extraNotes: '',
};

interface Plan {
    id: string;
    name: string;
    source: 'trainer_created' | 'ai_generated' | 'library';
    difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
    durationWeeks: number;
    daysPerWeek: number;
    description?: string | null;
    /** From program JSON meta — library templates & copies from library */
    coverImageUrl?: string | null;
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
    notes?: string | null;
    exercises: ProgramExercise[];
}

interface PlanDetail extends Plan {
    program?: {
        meta?: {
            focus?: string | null;
            locale?: string | null;
            coverImageUrl?: string | null;
            programIntro?: string | null;
        };
        days?: ProgramDay[];
    };
}

const difficultyColor: Record<string, string> = {
    beginner:     'bg-green-500/20 text-green-400',
    intermediate: 'bg-yellow-500/20 text-yellow-400',
    advanced:     'bg-red-500/20 text-red-400',
};

const sourceBadgeClass: Record<string, string> = {
    trainer_created: 'bg-blue-500/20 text-blue-400',
    library:         'bg-amber-500/20 text-amber-300',
};

/** Shown only when it adds context; AI-generated plans omit a label to avoid repetition. */
function PlanSourceTag({ source, listTab, onDark }: { source: Plan['source']; listTab: 'mine' | 'library'; onDark?: boolean }) {
    if (source === 'ai_generated') return null;
    if (listTab === 'mine' && source === 'library') return null;
    const label = source === 'trainer_created' ? 'Trainer' : 'Library';
    const cls = sourceBadgeClass[source] ?? 'bg-zinc-700 text-zinc-300';
    const dark = onDark ? 'border border-white/20 shadow-sm' : '';
    return (
        <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-semibold mt-0.5 ${cls} ${dark}`}>
            {label}
        </span>
    );
}

function PlanCardWithHero({
    plan,
    listTab,
    selected,
    onSelect,
}: {
    plan: Plan;
    listTab: 'mine' | 'library';
    selected: boolean;
    onSelect: () => void;
}) {
    const [coverFailed, setCoverFailed] = useState(false);
    const cover = plan.coverImageUrl?.trim();
    useEffect(() => {
        setCoverFailed(false);
    }, [plan.id, cover]);

    /** Library tab: text-only list; hero image only on detail. My programmes may show hero in list when assigned plan has cover. */
    if (cover && listTab === 'mine' && !coverFailed) {
        return (
            <div onClick={onSelect} className="cursor-pointer">
                <Card
                    padding="none"
                    className={`overflow-hidden transition-all hover:scale-[1.01] ${
                        selected ? 'border-red-600/60 bg-red-600/5 ring-1 ring-red-500/35' : 'hover:border-zinc-700/50'
                    }`}
                >
                    <div className="relative h-44 sm:h-48">
                        <img
                            src={cover}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover object-center"
                            onError={() => setCoverFailed(true)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/5" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 pt-14">
                            <p className="text-xl sm:text-2xl font-bold text-white leading-snug drop-shadow-md">{plan.name}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/90 tabular-nums">
                                <span className={`rounded-full px-2 py-0.5 font-semibold capitalize ${difficultyColor[plan.difficulty ?? 'beginner']}`}>
                                    {plan.difficulty ?? 'beginner'}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock size={12} className="opacity-90" /> {plan.durationWeeks} wk
                                </span>
                                <span className="flex items-center gap-1">
                                    <Flame size={12} className="opacity-90" /> {plan.daysPerWeek}×/wk
                                </span>
                                <PlanSourceTag source={plan.source} listTab={listTab} onDark />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }
    return (
        <div onClick={onSelect}>
            <Card
                padding="md"
                className={`cursor-pointer transition-all hover:scale-[1.01] ${selected ? 'border-red-600/60 bg-red-600/5' : 'hover:border-zinc-700/50'}`}
            >
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 mr-2">
                        <p className="text-white font-semibold truncate">{plan.name}</p>
                        <PlanSourceTag source={plan.source} listTab={listTab} />
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
    );
}

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
    const [planToRemove, setPlanToRemove] = useState<{ id: string; name: string } | null>(null);
    const [logOpen, setLogOpen] = useState(false);
    const [logDuration, setLogDuration] = useState('');
    const [logMood, setLogMood] = useState<'great' | 'good' | 'okay' | 'tired' | 'poor'>('good');
    const [logging, setLogging] = useState(false);
    const [heroImageError, setHeroImageError] = useState(false);
    const [aiPlanModalOpen, setAiPlanModalOpen] = useState(false);
    const [aiPrefs, setAiPrefs] = useState<AiWorkoutPlanPreferencesPayload>(() => ({ ...AI_PLAN_PREF_DEFAULTS }));

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
            await aiAPI.workoutPlan({ preferences: aiPrefs });
            toast.success('Plan ready', 'New programme added to My programmes.');
            loadPlans();
            setAiPlanModalOpen(false);
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setGenerating(false);
        }
    };

    const openAiPlanModal = () => {
        setAiPrefs({ ...AI_PLAN_PREF_DEFAULTS });
        setAiPlanModalOpen(true);
    };

    const days = active?.program?.days ?? [];
    const detailCoverUrl = active?.program?.meta?.coverImageUrl?.trim() ?? '';

    useEffect(() => {
        setHeroImageError(false);
    }, [selected, detailCoverUrl]);

    const useProgramHero = Boolean(detailCoverUrl) && !heroImageError;
    const hideExerciseThumbs = useProgramHero;
    const programIntro = active?.program?.meta?.programIntro?.trim();

    const confirmRemovePlan = async () => {
        if (!planToRemove) return;
        setRemoving(true);
        try {
            await opsAPI.removeMyWorkoutPlan(planToRemove.id);
            toast.success('Plan removed', 'This programme is no longer in My programmes.');
            if (selected === planToRemove.id) setSelected(null);
            loadPlans();
            setPlanDetail(null);
            setPlanToRemove(null);
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
        <div className="flex min-h-0 flex-1 flex-col gap-8">
            <div className="flex shrink-0 flex-col gap-8">
            <PageHeader
                title="Workout Plans"
                subtitle="Day-by-day programmes, exercises, and progress at PowerWorld Kiribathgoda"
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
                    onClick={openAiPlanModal}
                >
                    Generate plan
                </LoadingButton>
            </div>
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
                                ? 'Use Generate plan above or ask your trainer to assign one.'
                                : 'Try again later or contact support if programmes should appear here.'}
                    </p>
                </Card>
            ) : (
            <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
                <div className="grid min-h-0 grid-cols-1 gap-6 lg:h-full lg:grid-cols-3">
                <div className="min-h-0 space-y-4 lg:overflow-y-auto lg:pr-1">
                    {filtered.map(plan => (
                        <PlanCardWithHero
                            key={plan.id}
                            plan={plan}
                            listTab={listTab}
                            selected={selected === plan.id}
                            onSelect={() => setSelected(plan.id)}
                        />
                    ))}
                </div>

                <div className="min-h-0 lg:col-span-2 lg:overflow-y-auto lg:pr-1">
                {loadingDetail && selected ? (
                    <Card className="flex items-center justify-center min-h-[320px] text-zinc-500 text-sm">
                        Loading programme…
                    </Card>
                ) : active ? (
                    <Card className="overflow-hidden p-0">
                        {useProgramHero ? (
                            <div className="relative min-h-[220px] sm:min-h-[280px] md:min-h-[300px]">
                                <img
                                    src={detailCoverUrl}
                                    alt=""
                                    className="absolute inset-0 h-full w-full object-cover object-center"
                                    onError={() => setHeroImageError(true)}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10" />
                                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                    <div className="min-w-0 pr-2">
                                        <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight leading-tight drop-shadow-lg">{active.name}</h2>
                                        <p className="mt-1.5 text-sm text-white/85">
                                            {active.durationWeeks} weeks · {active.daysPerWeek} days/week · <span className="capitalize">{active.difficulty ?? 'beginner'}</span>
                                            {active.program?.meta?.focus && (
                                                <span> · {active.program.meta.focus}</span>
                                            )}
                                        </p>
                                        <div className="mt-2">
                                            <PlanSourceTag source={active.source} listTab={listTab} onDark />
                                        </div>
                                    </div>
                                    {isAssignedPlan && (
                                        <div className="flex flex-wrap gap-2 shrink-0">
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
                                            <LoadingButton icon={ClipboardCheck} size="sm" variant="secondary" onClick={() => setLogOpen((o) => !o)}>
                                                Log completed
                                            </LoadingButton>
                                            <LoadingButton icon={Trash2} size="sm" variant="secondary" onClick={() => setPlanToRemove({ id: active.id, name: active.name })}>
                                                Remove
                                            </LoadingButton>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 pb-0">
                                <div className="flex items-start justify-between mb-6 gap-4">
                                    <div className="min-w-0">
                                        <h2 className="text-xl font-bold text-white">{active.name}</h2>
                                        <p className="text-zinc-500 text-sm mt-0.5">
                                            {active.durationWeeks} weeks · {active.daysPerWeek} days/week · <span className="capitalize">{active.difficulty ?? 'beginner'}</span>
                                            {active.program?.meta?.focus && (
                                                <span> · {active.program.meta.focus}</span>
                                            )}
                                        </p>
                                        <div className="mt-1">
                                            <PlanSourceTag source={active.source} listTab={listTab} />
                                        </div>
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
                                                <LoadingButton icon={ClipboardCheck} size="sm" variant="secondary" onClick={() => setLogOpen((o) => !o)}>
                                                    Log completed
                                                </LoadingButton>
                                                <LoadingButton icon={Trash2} size="sm" variant="secondary" onClick={() => setPlanToRemove({ id: active.id, name: active.name })}>
                                                    Remove
                                                </LoadingButton>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-6">

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

                        <div className="mb-6 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const detail = { role: 'member' as const, message: `Explain my plan "${active.name}" and what I should focus on this week.` };
                                    window.dispatchEvent(new CustomEvent('pw:ai-chat-prefill', { detail }));
                                }}
                                className="text-xs px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                            >
                                Ask about this plan
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-zinc-800/30 rounded-xl p-4">
                                <p className="text-white text-sm font-semibold mb-2">Plan overview</p>
                                {programIntro ? (
                                    <p className="text-zinc-300 text-sm mb-3 leading-relaxed whitespace-pre-wrap">{programIntro}</p>
                                ) : null}
                                {active.description ? (
                                    <p className="text-zinc-400 text-sm leading-relaxed">{active.description}</p>
                                ) : !programIntro ? (
                                    <p className="text-zinc-500 text-sm">No detailed description.</p>
                                ) : null}
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
                                                            {day.notes ? (
                                                                <p className="px-4 py-3 text-xs text-zinc-400 bg-zinc-900/35 border-b border-zinc-800/60 leading-relaxed">{day.notes}</p>
                                                            ) : null}
                                                            {exs.map((ex, i) => (
                                                                <div key={i} className="px-4 py-3">
                                                                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                                                        {!hideExerciseThumbs && ex.imageUrl && (
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
                        </div>
                    </Card>
                ) : (
                    <Card className="flex flex-col items-center justify-center min-h-[280px] text-zinc-500 text-sm text-center px-6">
                        <p className="text-zinc-400">Choose a programme from the list to see exercises and actions.</p>
                    </Card>
                )}
                </div>
                </div>
            </div>
            )}

            <Modal
                isOpen={aiPlanModalOpen}
                onClose={() => { if (!generating) setAiPlanModalOpen(false); }}
                title="Quick questions from your AI coach"
                description="Answer below — each new plan uses your latest answers so training stays relevant."
                size="lg"
            >
                <div className="space-y-5">
                    <div>
                        <p className="text-xs font-medium text-zinc-400 mb-1.5">What should we focus on in this block?</p>
                        <select
                            className={selectFieldClass}
                            value={aiPrefs.primaryFocus ?? ''}
                            onChange={(e) => setAiPrefs((p) => ({ ...p, primaryFocus: e.target.value }))}
                        >
                            <option>General fitness & health</option>
                            <option>Fat loss & conditioning</option>
                            <option>Muscle & size (hypertrophy)</option>
                            <option>Strength</option>
                            <option>Athletic performance & power</option>
                            <option>Moving better / mobility support</option>
                        </select>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-zinc-400 mb-1.5">How many days per week can you train?</p>
                        <select
                            className={selectFieldClass}
                            value={aiPrefs.daysPerWeek ?? ''}
                            onChange={(e) => setAiPrefs((p) => ({ ...p, daysPerWeek: e.target.value }))}
                        >
                            <option>3 days per week</option>
                            <option>4 days per week</option>
                            <option>5 days per week</option>
                        </select>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-zinc-400 mb-1.5">Typical session length?</p>
                        <select
                            className={selectFieldClass}
                            value={aiPrefs.sessionLength ?? ''}
                            onChange={(e) => setAiPrefs((p) => ({ ...p, sessionLength: e.target.value }))}
                        >
                            <option>~30–40 minutes</option>
                            <option>45–55 minutes</option>
                            <option>60+ minutes</option>
                        </select>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-zinc-400 mb-1.5">What equipment will you use at the club?</p>
                        <select
                            className={selectFieldClass}
                            value={aiPrefs.equipmentAccess ?? ''}
                            onChange={(e) => setAiPrefs((p) => ({ ...p, equipmentAccess: e.target.value }))}
                        >
                            <option>Full gym — machines & free weights</option>
                            <option>Mostly machines & cables</option>
                            <option>Dumbbells & cables / busy floor</option>
                            <option>Minimal kit — small space or travel days</option>
                        </select>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-zinc-400 mb-1.5">Where do you want a little extra emphasis?</p>
                        <select
                            className={selectFieldClass}
                            value={aiPrefs.emphasis ?? ''}
                            onChange={(e) => setAiPrefs((p) => ({ ...p, emphasis: e.target.value }))}
                        >
                            <option>Balanced full body</option>
                            <option>Upper body</option>
                            <option>Lower body & glutes</option>
                            <option>Core & conditioning</option>
                        </select>
                    </div>
                    <Input
                        label="Injuries, pain, or movements to avoid? (optional)"
                        placeholder="e.g. sore shoulder — limit overhead pressing"
                        value={aiPrefs.avoidOrInjuries ?? ''}
                        onChange={(e) => setAiPrefs((p) => ({ ...p, avoidOrInjuries: e.target.value }))}
                    />
                    <Input
                        label="Anything else the coach should know? (optional)"
                        placeholder="e.g. prefer machines after leg day"
                        value={aiPrefs.extraNotes ?? ''}
                        onChange={(e) => setAiPrefs((p) => ({ ...p, extraNotes: e.target.value }))}
                    />
                    <div className="flex flex-wrap justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" disabled={generating} onClick={() => setAiPlanModalOpen(false)}>
                            Cancel
                        </LoadingButton>
                        <LoadingButton
                            icon={Sparkles}
                            loading={generating}
                            onClick={() => void handleGenerateAiPlan()}
                        >
                            Generate my plan
                        </LoadingButton>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={!!planToRemove}
                onClose={() => { if (!removing) setPlanToRemove(null); }}
                title="Remove programme?"
                description={
                    planToRemove
                        ? `“${planToRemove.name}” will be removed from My programmes. You can ask your trainer to assign it again later.`
                        : undefined
                }
                size="sm"
            >
                <div className="flex flex-wrap justify-end gap-3 pt-2">
                    <LoadingButton variant="secondary" disabled={removing} onClick={() => setPlanToRemove(null)}>
                        Cancel
                    </LoadingButton>
                    <LoadingButton variant="danger" loading={removing} onClick={() => void confirmRemovePlan()}>
                        Remove
                    </LoadingButton>
                </div>
            </Modal>
        </div>
    );
}
