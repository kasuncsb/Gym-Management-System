"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Dumbbell, MapPin, Tag, Users, Loader2 } from "lucide-react";
import { publicService, ClassType } from "@/lib/api/public.service";

const workoutImages: Record<string, string> = {
    yoga: "https://images.unsplash.com/photo-1544367563-12123d8965cd?q=80&w=2071&auto=format&fit=crop",
    hiit: "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?q=80&w=1925&auto=format&fit=crop",
    strength: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop",
    boxing: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=1974&auto=format&fit=crop",
    cardio: "https://images.unsplash.com/photo-1434608519344-49d77a699ded?q=80&w=2074&auto=format&fit=crop",
    default: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop",
};

const getWorkoutImage = (name: string) => {
    const lower = name.toLowerCase();
    for (const [key, url] of Object.entries(workoutImages)) {
        if (lower.includes(key)) return url;
    }
    return workoutImages.default;
};

export default function WorkoutsPage() {
    const [classes, setClasses] = useState<ClassType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const data = await publicService.getClasses();
                setClasses(data || []);
            } catch (error) {
                console.error("Failed to fetch workouts:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
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
                    <h2 className="text-3xl font-bold text-white">Workout Programs</h2>
                    <p className="text-zinc-400 mt-1">PowerWorld-curated sessions powered by live class data</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-xs text-zinc-400">
                    <Dumbbell size={16} className="text-red-500" />
                    Live from class catalog
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.length === 0 ? (
                    <div className="col-span-full rounded-2xl border border-dashed border-zinc-800 bg-black/30 p-10 text-center text-zinc-500">
                        No workout programs available yet. Check back after the next timetable update.
                    </div>
                ) : (
                    classes.map((workout) => (
                        <div
                            key={workout.id}
                            className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-black/40 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-zinc-700"
                        >
                            <div className="absolute inset-0 z-0">
                                <img
                                    src={getWorkoutImage(workout.name)}
                                    alt={workout.name}
                                    className="h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110"
                                    onError={(event) => {
                                        (event.target as HTMLImageElement).src = workoutImages.default;
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                            </div>

                            <div className="relative z-10 flex h-full flex-col justify-end p-6">
                                <div className="mb-4 flex flex-wrap gap-2">
                                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
                                        {workout.type || "Group"}
                                    </span>
                                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
                                        PowerWorld Program
                                    </span>
                                </div>

                                <h3 className="mb-2 text-xl font-bold text-white">{workout.name}</h3>
                                <p className="mb-6 text-sm text-zinc-300">
                                    Instructor-led training built for Sri Lankan members seeking structured progress.
                                </p>

                                <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-zinc-300">
                                    <div className="flex items-center gap-1.5">
                                        <Users size={16} className="text-red-500" />
                                        <span>Coach-led</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={16} className="text-red-500" />
                                        <span>Main studio</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Tag size={16} className="text-red-500" />
                                        <span>Walk-in ready</span>
                                    </div>
                                </div>

                                <Link
                                    href="/dashboard/schedule"
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-3 font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20 group-hover:bg-red-700 group-hover:shadow-lg group-hover:shadow-red-600/20"
                                >
                                    View Schedule
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
