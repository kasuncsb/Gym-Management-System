'use client';

import { useEffect, useState } from 'react';
import { Play, Clock, Flame, Target } from 'lucide-react';
import { PageHeader, Card, LoadingButton } from '@/components/ui/SharedComponents';
import { getErrorMessage, opsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

type Goal = 'fat_loss' | 'muscle_gain' | 'endurance' | 'flexibility';

const goalLabels: Record<Goal, string> = {
    fat_loss:   'Fat Loss',
    muscle_gain:'Muscle Gain',
    endurance:  'Endurance',
    flexibility:'Flexibility',
};

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
    Beginner:     'bg-green-500/20 text-green-400',
    Intermediate: 'bg-yellow-500/20 text-yellow-400',
    Advanced:     'bg-red-500/20 text-red-400',
};

export default function WorkoutsPage() {
    const toast = useToast();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [filter, setFilter] = useState<Goal | 'all'>('all');
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        opsAPI.myWorkoutPlans()
            .then((d) => {
                const items = (d ?? []) as Plan[];
                setPlans(items);
                if (items[0]) setSelected(items[0].id);
            })
            .catch(() => toast.error('Error', 'Failed to load workout plans'));
    }, []);

    const filtered = filter === 'all' ? plans : plans;
    const active = plans.find((p) => p.id === selected);

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
                        <div key={plan.id} onClick={() => { setSelected(plan.id); }}>
                            <Card padding="md"
                                className={`cursor-pointer transition-all hover:scale-[1.01] ${selected === plan.id ? 'border-red-600/60 bg-red-600/5' : 'hover:border-zinc-700/50'}`}>
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="text-white font-semibold">{plan.name}</p>
                                    <p className="text-zinc-500 text-xs mt-0.5">{plan.source.replace('_', ' ')}</p>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${difficultyColor[(plan.difficulty ?? 'beginner').replace(/^./, (c) => c.toUpperCase())]}`}>
                                    {(plan.difficulty ?? 'beginner').replace(/^./, (c) => c.toUpperCase())}
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

                {active && (
                    <Card className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white">{active.name}</h2>
                                <p className="text-zinc-500 text-sm">{active.durationWeeks} weeks · {active.daysPerWeek} days/week · {active.difficulty ?? 'beginner'}</p>
                            </div>
                            <LoadingButton
                                icon={Play}
                                size="sm"
                                loading={starting}
                                onClick={async () => {
                                    setStarting(true);
                                    try {
                                        await opsAPI.addWorkoutLog({ planId: active.id, workoutDate: new Date().toISOString().slice(0, 10), durationMin: 45, mood: 'good' });
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
                                <p className="text-zinc-400 text-sm">{active.description ?? 'No detailed description yet. Trainer can add plan details later.'}</p>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
