"use client";

import { useState } from "react";
import { Dumbbell, Clock, Flame, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for workout plans
const workouts = [
    {
        id: 1,
        title: "Full Body Crush",
        duration: "45 min",
        level: "Intermediate",
        calories: "320 kcal",
        image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop",
        tags: ["Strength", "Cardio"]
    },
    {
        id: 2,
        title: "HIIT Intensity",
        duration: "30 min",
        level: "Advanced",
        calories: "450 kcal",
        image: "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?q=80&w=1925&auto=format&fit=crop",
        tags: ["HIIT", "Endurance"]
    },
    {
        id: 3,
        title: "Yoga Flow",
        duration: "60 min",
        level: "Beginner",
        calories: "180 kcal",
        image: "https://images.unsplash.com/photo-1544367563-12123d8965cd?q=80&w=2071&auto=format&fit=crop",
        tags: ["Flexibility", "Wellness"]
    },
    {
        id: 4,
        title: "Upper Body Power",
        duration: "50 min",
        level: "Advanced",
        calories: "380 kcal",
        image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop",
        tags: ["Strength", "Muscle"]
    },
    {
        id: 5,
        title: "Leg Day Destruction",
        duration: "55 min",
        level: "Intermediate",
        calories: "410 kcal",
        image: "https://images.unsplash.com/photo-1434608519344-49d77a699ded?q=80&w=2074&auto=format&fit=crop",
        tags: ["Strength", "Legs"]
    },
    {
        id: 6,
        title: "Core Blaster",
        duration: "20 min",
        level: "Beginner",
        calories: "150 kcal",
        image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop",
        tags: ["Core", "Abs"]
    }
];

export default function WorkoutsPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Workouts</h2>
                    <p className="text-zinc-400 mt-1">Explore guided sessions and track your progress</p>
                </div>
                <button className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-700 shadow-lg shadow-red-600/20 transition font-medium">
                    Create Custom Plan
                </button>
            </div>

            {/* Featured Hero (Optional, skipped for grid focus) */}

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800">
                {["All", "Strength", "HIIT", "Cardio", "Flexibility", "Custom"].map((tab, i) => (
                    <button
                        key={tab}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                            i === 0
                                ? "bg-white text-black"
                                : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workouts.map((workout) => (
                    <div
                        key={workout.id}
                        className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-black/40 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-zinc-700"
                    >
                        {/* Image Background */}
                        <div className="absolute inset-0 z-0">
                            <img
                                src={workout.image}
                                alt={workout.title}
                                className="h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10 flex h-full flex-col justify-end p-6">
                            <div className="mb-4 flex flex-wrap gap-2">
                                {workout.tags.map(tag => (
                                    <span key={tag} className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <h3 className="mb-2 text-xl font-bold text-white">{workout.title}</h3>

                            <div className="mb-6 flex items-center gap-4 text-sm text-zinc-300">
                                <div className="flex items-center gap-1.5">
                                    <Clock size={16} className="text-red-500" />
                                    <span>{workout.duration}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Flame size={16} className="text-red-600" />
                                    <span>{workout.calories}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Dumbbell size={16} className="text-blue-400" />
                                    <span>{workout.level}</span>
                                </div>
                            </div>

                            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-3 font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20 group-hover:bg-red-700 group-hover:shadow-lg group-hover:shadow-red-600/20">
                                <Play size={18} fill="currentColor" />
                                Start Workout
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
