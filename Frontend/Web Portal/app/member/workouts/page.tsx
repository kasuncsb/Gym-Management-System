"use client";

import { useEffect, useState } from "react";
import { Dumbbell, Loader2, Calendar, Clock, Target } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface WorkoutPlan {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    exercises: {
        id: string;
        exerciseName: string;
        sets?: number;
        reps?: number;
        weight?: string;
        durationMinutes?: number;
        notes?: string;
    }[];
}

export default function WorkoutsPage() {
    const { user } = useAuth();
    const [plans, setPlans] = useState<WorkoutPlan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: Fetch workout plans from API when endpoint is ready
        const fetchPlans = async () => {
            try {
                // Placeholder — will connect to workoutPlans API in Phase 2
                setPlans([]);
            } catch (error) {
                console.error("Failed to fetch workout plans:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-red-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">My Workouts</h2>
                    <p className="text-zinc-400 mt-1">Your personalized workout plans from PowerWorld trainers</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-xs text-zinc-400">
                    <Dumbbell size={16} className="text-red-500" />
                    Trainer-assigned plans
                </div>
            </div>

            {plans.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-800 bg-black/30 p-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-6">
                        <Target className="text-zinc-600" size={32} />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-300 mb-2">No Workout Plans Yet</h3>
                    <p className="text-zinc-500 max-w-md mx-auto">
                        Your trainer will create personalized workout plans for you. Check back soon or speak to a trainer at the gym.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {plans.map((plan) => (
                        <div key={plan.id} className="rounded-2xl border border-zinc-800 bg-black/40 backdrop-blur-sm overflow-hidden">
                            <div className="p-6 border-b border-zinc-800">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                                        <Calendar size={14} />
                                        {new Date(plan.createdAt).toLocaleDateString('en-LK')}
                                    </span>
                                </div>
                                {plan.description && <p className="text-zinc-400 mt-2">{plan.description}</p>}
                            </div>
                            <div className="divide-y divide-zinc-800/50">
                                {plan.exercises.map((ex) => (
                                    <div key={ex.id} className="px-6 py-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">{ex.exerciseName}</p>
                                            {ex.notes && <p className="text-xs text-zinc-500 mt-1">{ex.notes}</p>}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-zinc-400">
                                            {ex.sets && ex.reps && <span>{ex.sets} &times; {ex.reps}</span>}
                                            {ex.weight && <span>{ex.weight}</span>}
                                            {ex.durationMinutes && (
                                                <span className="flex items-center gap-1">
                                                    <Clock size={14} /> {ex.durationMinutes}m
                                                </span>
                                            )}
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
}
