"use client";

import { useState, useEffect } from "react";
import { Users, Clock, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { publicService, ClassType } from "@/lib/api/public.service";

// Fallback images for classes
const classImages: Record<string, string> = {
    'yoga': 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=2069&auto=format&fit=crop',
    'hiit': 'https://images.unsplash.com/photo-1517963879466-e825c2cbd99b?q=80&w=2074&auto=format&fit=crop',
    'spin': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop',
    'boxing': 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=1974&auto=format&fit=crop',
    'pilates': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=2070&auto=format&fit=crop',
    'strength': 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop',
    'default': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop'
};

const getClassImage = (name: string): string => {
    const lower = name.toLowerCase();
    for (const [key, url] of Object.entries(classImages)) {
        if (lower.includes(key)) return url;
    }
    return classImages.default;
};

export default function ClassesPage() {
    const [classes, setClasses] = useState<ClassType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const data = await publicService.getClasses();
                setClasses(data || []);
            } catch (error) {
                console.error('Failed to fetch classes:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-indigo-400" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white">Our Classes</h2>
                <p className="text-zinc-400 mt-1">Discover sessions that fit your goals</p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.length === 0 ? (
                    <div className="col-span-full text-center text-zinc-400 py-12">
                        No classes available at the moment.
                    </div>
                ) : (
                    classes.map((cls) => (
                        <div key={cls.id} className="group flex flex-col rounded-3xl bg-black/40 border border-zinc-800 backdrop-blur-sm overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10">
                            {/* Image */}
                            <div className="h-48 relative overflow-hidden">
                                <img
                                    src={getClassImage(cls.name)}
                                    alt={cls.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = classImages.default;
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                                <div className="absolute bottom-4 left-4">
                                    <span className="px-2 py-1 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                                        {cls.type || 'Group'}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-6 flex flex-col">
                                <h3 className="text-xl font-bold text-white mb-2">{cls.name}</h3>
                                <p className="text-sm text-zinc-400 mb-6 line-clamp-2 flex-1">
                                    Join our {cls.name} sessions for an amazing workout experience.
                                </p>

                                <div className="flex items-center justify-between text-sm text-zinc-500 mb-6">
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={16} />
                                        <span>60 min</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Users size={16} />
                                        <span>Open</span>
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
                    ))
                )}
            </div>
        </div>
    );
}
