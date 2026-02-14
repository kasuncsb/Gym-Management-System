"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CalendarCheck, Loader2, Users, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface TrainingSession {
    id: string;
    trainerName?: string;
    scheduledAt: string;
    durationMinutes: number;
    status: string;
    notes?: string;
}

const getTodayLabel = () =>
    new Date().toLocaleDateString("en-LK", { weekday: "long", month: "long", day: "numeric" });

export default function SchedulePage() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<TrainingSession[]>([]);
    const [loading, setLoading] = useState(true);

    const todayLabel = useMemo(() => getTodayLabel(), []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // TODO: Connect to training sessions API in Phase 2
                setSessions([]);
            } catch (error) {
                console.error("Failed to fetch schedule data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
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
                    <h2 className="text-3xl font-bold text-white">Training Schedule</h2>
                    <p className="text-zinc-400 mt-1">Your sessions for {todayLabel}</p>
                </div>
                <div className="flex items-center gap-2 text-zinc-300 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800">
                    <CalendarCheck size={18} className="text-red-500" />
                    <span className="text-sm font-medium">PowerWorld Kiribathgoda</span>
                </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 backdrop-blur-md p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                        <CalendarDays size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Upcoming Training Sessions</h3>
                        <p className="text-xs text-zinc-500">Personal training sessions booked with your trainer</p>
                    </div>
                </div>

                {sessions.length > 0 ? (
                    <div className="space-y-3">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <p className="text-base font-semibold text-white">
                                            Personal Training
                                        </p>
                                        <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                                            <span className="flex items-center gap-1">
                                                <Users size={12} /> {session.trainerName || "Assigned Trainer"}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} /> {session.durationMinutes} min
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-zinc-300">
                                            {new Date(session.scheduledAt).toLocaleDateString('en-LK', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                            {new Date(session.scheduledAt).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                {session.notes && (
                                    <p className="mt-2 text-xs text-zinc-500 border-t border-zinc-800 pt-2">{session.notes}</p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-zinc-800 bg-black/20 p-10 text-center">
                        <div className="w-14 h-14 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                            <CalendarDays className="text-zinc-600" size={28} />
                        </div>
                        <p className="text-zinc-400 font-medium mb-2">No upcoming sessions</p>
                        <p className="text-xs text-zinc-600 max-w-sm mx-auto">
                            Speak to a trainer at PowerWorld Kiribathgoda to book personal training sessions.
                            Sessions with included PT credits from your plan are scheduled here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
