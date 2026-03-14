'use client';

import { useState } from 'react';
import { Dumbbell, ChevronDown, Play, Clock, Flame, Target } from 'lucide-react';
import { PageHeader, Card, LoadingButton } from '@/components/ui/SharedComponents';

type Goal = 'fat_loss' | 'muscle_gain' | 'endurance' | 'flexibility';

const goalLabels: Record<Goal, string> = {
    fat_loss:   'Fat Loss',
    muscle_gain:'Muscle Gain',
    endurance:  'Endurance',
    flexibility:'Flexibility',
};

const plans = [
    {
        id: 1,
        name: 'Full Body Power',
        goal: 'muscle_gain' as Goal,
        duration: '45 min',
        calories: 380,
        difficulty: 'Intermediate',
        selected: true,
        exercises: [
            { name: 'Barbell Squat',    sets: 4, reps: '8–10', rest: '90s', muscle: 'Legs' },
            { name: 'Bench Press',      sets: 4, reps: '8–10', rest: '90s', muscle: 'Chest' },
            { name: 'Deadlift',         sets: 3, reps: '6–8',  rest: '120s',muscle: 'Back' },
            { name: 'Pull-ups',         sets: 3, reps: '8–12', rest: '60s', muscle: 'Back' },
            { name: 'Shoulder Press',   sets: 3, reps: '10–12',rest: '60s', muscle: 'Shoulders' },
        ],
    },
    {
        id: 2,
        name: 'Cardio Blast',
        goal: 'fat_loss' as Goal,
        duration: '30 min',
        calories: 450,
        difficulty: 'Beginner',
        selected: false,
        exercises: [
            { name: 'Treadmill Run',    sets: 1, reps: '20 min', rest: '—',  muscle: 'Cardio' },
            { name: 'Jump Rope',        sets: 3, reps: '3 min',  rest: '60s',muscle: 'Cardio' },
            { name: 'Burpees',          sets: 3, reps: '15',     rest: '30s',muscle: 'Full Body' },
            { name: 'Mountain Climbers',sets: 3, reps: '30',     rest: '30s',muscle: 'Core' },
        ],
    },
    {
        id: 3,
        name: 'Flexibility & Recovery',
        goal: 'flexibility' as Goal,
        duration: '40 min',
        calories: 150,
        difficulty: 'Beginner',
        selected: false,
        exercises: [
            { name: 'Dynamic Warm-up', sets: 1, reps: '10 min', rest: '—',  muscle: 'Full Body' },
            { name: 'Hip Flexor Stretch', sets: 2, reps: '60s',rest: '—',   muscle: 'Hips' },
            { name: 'Yoga Flow',        sets: 1, reps: '20 min', rest: '—',  muscle: 'Full Body' },
        ],
    },
];

const difficultyColor: Record<string, string> = {
    Beginner:     'bg-green-500/20 text-green-400',
    Intermediate: 'bg-yellow-500/20 text-yellow-400',
    Advanced:     'bg-red-500/20 text-red-400',
};

export default function WorkoutsPage() {
    const [selected, setSelected] = useState(1);
    const [expanded, setExpanded] = useState<number | null>(1);
    const [filter, setFilter] = useState<Goal | 'all'>('all');

    const filtered = filter === 'all' ? plans : plans.filter(p => p.goal === filter);
    const active = plans.find(p => p.id === selected);

    return (
        <div className="space-y-8">
            <PageHeader
                title="Workout Plans"
                subtitle="Your curated workout programmes for PowerWorld Kiribathgoda"
            />

            <div className="flex gap-2 flex-wrap">
                {(['all', 'fat_loss', 'muscle_gain', 'endurance', 'flexibility'] as const).map(g => (
                    <button key={g} onClick={() => setFilter(g)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${filter === g ? 'bg-red-600 text-white border border-red-500' : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'}`}>
                        {g === 'all' ? 'All Goals' : goalLabels[g]}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Plan cards */}
                <div className="space-y-4">
                    {filtered.map(plan => (
                        <div key={plan.id} onClick={() => { setSelected(plan.id); setExpanded(null); }}>
                            <Card padding="md"
                                className={`cursor-pointer transition-all hover:scale-[1.01] ${selected === plan.id ? 'border-red-600/60 bg-red-600/5' : 'hover:border-zinc-700/50'}`}>
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="text-white font-semibold">{plan.name}</p>
                                    <p className="text-zinc-500 text-xs mt-0.5">{goalLabels[plan.goal]}</p>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${difficultyColor[plan.difficulty]}`}>{plan.difficulty}</span>
                            </div>
                            <div className="flex gap-4 text-xs text-zinc-500">
                                <span className="flex items-center gap-1"><Clock size={11} /> {plan.duration}</span>
                                <span className="flex items-center gap-1"><Flame size={11} /> {plan.calories} kcal</span>
                                <span className="flex items-center gap-1"><Target size={11} /> {plan.exercises.length} exercises</span>
                            </div>
                            </Card>
                        </div>
                    ))}
                </div>

                {active && (
                    <Card className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white">{active.name}</h2>
                                <p className="text-zinc-500 text-sm">{active.duration} · {active.calories} kcal · {active.difficulty}</p>
                            </div>
                            <LoadingButton icon={Play} size="sm">
                                Start Workout
                            </LoadingButton>
                        </div>
                        <div className="space-y-3">
                            {active.exercises.map((ex, i) => (
                                <div key={i}
                                    onClick={() => setExpanded(expanded === i ? null : i)}
                                    className="bg-zinc-800/30 rounded-xl p-4 cursor-pointer hover:bg-zinc-800/50 transition">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 bg-red-600/20 rounded-lg flex items-center justify-center text-red-400 text-xs font-bold">{i + 1}</div>
                                            <div>
                                                <p className="text-white text-sm font-semibold">{ex.name}</p>
                                                <p className="text-zinc-500 text-xs">{ex.muscle}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right text-xs text-zinc-400">
                                                <p>{ex.sets} sets × {ex.reps}</p>
                                                <p>Rest {ex.rest}</p>
                                            </div>
                                            <ChevronDown size={14} className={`text-zinc-600 transition-transform ${expanded === i ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
