"use client";

import { Dumbbell, Users, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

const classTypes = [
    {
        id: "yoga",
        name: "Zen Yoga",
        description: "Find your balance and inner peace with our expert-led yoga sessions.",
        image: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=2069&auto=format&fit=crop",
        duration: "60 min",
        intensity: "Low",
        members: "12/20"
    },
    {
        id: "hiit",
        name: "HIIT Burn",
        description: "High-intensity interval training to torch calories and build endurance.",
        image: "https://images.unsplash.com/photo-1517963879466-e825c2cbd99b?q=80&w=2074&auto=format&fit=crop",
        duration: "45 min",
        intensity: "High",
        members: "18/25"
    },
    {
        id: "spin",
        name: "Cycle Soul",
        description: "Ride to the rhythm in our immersive cycling studio experience.",
        image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop",
        duration: "50 min",
        intensity: "Med-High",
        members: "25/30"
    },
    {
        id: "boxing",
        name: "Box & Kick",
        description: "Master the art of boxing while getting a full-body workout.",
        image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=1974&auto=format&fit=crop",
        duration: "60 min",
        intensity: "High",
        members: "8/15"
    },
    {
        id: "pilates",
        name: "Core Pilates",
        description: "Strengthen your core and improve posture with controlled movements.",
        image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=2070&auto=format&fit=crop",
        duration: "55 min",
        intensity: "Low-Med",
        members: "10/12"
    },
    {
        id: "strength",
        name: "Power Lift",
        description: "Focus on heavy lifting and technique to build pure strength.",
        image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop", // Reusing image for demo
        duration: "75 min",
        intensity: "Very High",
        members: "6/10"
    }
];

export default function ClassesPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white">Our Classes</h2>
                <p className="text-zinc-400 mt-1">Discover sessions that fit your goals</p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classTypes.map((cls) => (
                    <div key={cls.id} className="group flex flex-col rounded-3xl bg-black/40 border border-zinc-800 backdrop-blur-sm overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10">
                        {/* Image */}
                        <div className="h-48 relative overflow-hidden">
                            <img
                                src={cls.image}
                                alt={cls.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                            <div className="absolute bottom-4 left-4">
                                <span className="px-2 py-1 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                                    {cls.intensity} Intensity
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6 flex flex-col">
                            <h3 className="text-xl font-bold text-white mb-2">{cls.name}</h3>
                            <p className="text-sm text-zinc-400 mb-6 line-clamp-2 flex-1">{cls.description}</p>

                            <div className="flex items-center justify-between text-sm text-zinc-500 mb-6">
                                <div className="flex items-center gap-1.5">
                                    <Clock size={16} />
                                    <span>{cls.duration}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Users size={16} />
                                    <span>{cls.members}</span>
                                </div>
                            </div>

                            <Link
                                href="/dashboard/schedule"
                                className="w-full py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-medium hover:bg-indigo-600 hover:border-indigo-500 transition-all flex items-center justify-center gap-2 group-hover:translate-x-1"
                            >
                                View Schedule <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
