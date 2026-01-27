"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CalendarCheck, Loader2, MapPin, Tag, Users } from "lucide-react";
import { publicService, ClassType } from "@/lib/api/public.service";
import { appointmentAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Appointment {
    id: string;
    trainerName?: string;
    startTime: string;
    endTime: string;
    type?: string;
    notes?: string;
}

const getTodayLabel = () =>
    new Date().toLocaleDateString("en-LK", { weekday: "long", month: "long", day: "numeric" });

const getTimeRange = (startTime: string, endTime: string) => {
    const start = new Date(startTime).toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit" });
    const end = new Date(endTime).toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit" });
    return `${start} - ${end}`;
};

export default function SchedulePage() {
    const [classes, setClasses] = useState<ClassType[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    const todayLabel = useMemo(() => getTodayLabel(), []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [classData, appointmentRes] = await Promise.all([
                    publicService.getClasses(),
                    appointmentAPI.listMy().catch(() => ({ data: { data: [] } })),
                ]);
                setClasses(classData || []);
                setAppointments(appointmentRes.data.data || []);
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
                    <h2 className="text-3xl font-bold text-white">Class Schedule</h2>
                    <p className="text-zinc-400 mt-1">Your curated fitness sessions for {todayLabel}</p>
                </div>
                <div className="flex items-center gap-2 text-zinc-300 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800">
                    <CalendarCheck size={18} className="text-red-500" />
                    <span className="text-sm font-medium">Live data from PowerWorld</span>
                </div>
            </div>

            <section className="grid gap-4 lg:grid-cols-[1.2fr_2fr]">
                <div className="rounded-2xl border border-zinc-800 bg-black/40 backdrop-blur-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                            <CalendarDays size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Upcoming Appointments</h3>
                            <p className="text-xs text-zinc-500">Personal training and booked sessions</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {appointments.length > 0 ? (
                            appointments.map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            <p className="text-sm text-zinc-400">Session</p>
                                            <p className="text-base font-semibold text-white">
                                                {appointment.type || "Personal Training"}
                                            </p>
                                        </div>
                                        <span className="text-xs text-zinc-500">
                                            {getTimeRange(appointment.startTime, appointment.endTime)}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                                        <Users size={12} className="text-zinc-600" />
                                        <span>{appointment.trainerName || "Assigned Trainer"}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-xl border border-dashed border-zinc-800 bg-black/20 p-6 text-center">
                                <p className="text-sm text-zinc-500">No upcoming appointments yet.</p>
                                <p className="text-xs text-zinc-600 mt-2">
                                    Book through the front desk or ask a trainer to schedule.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-black/40 backdrop-blur-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Available Classes</h3>
                            <p className="text-xs text-zinc-500">Updated by the PowerWorld operations team</p>
                        </div>
                        <span className="text-xs text-zinc-500">{classes.length} active programs</span>
                    </div>
                    {classes.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {classes.map((gymClass) => (
                                <div
                                    key={gymClass.id}
                                    className={cn(
                                        "group rounded-2xl border border-zinc-800 bg-gradient-to-br from-black/80 to-zinc-900/50 p-5 transition",
                                        "hover:border-red-600/40 hover:shadow-lg hover:shadow-red-600/10"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h4 className="text-lg font-semibold text-white">{gymClass.name}</h4>
                                            <p className="text-xs text-zinc-500 mt-1">
                                                Class category curated for Sri Lankan gym members.
                                            </p>
                                        </div>
                                        <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-400">
                                            {gymClass.type || "Group"}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                                        <MapPin size={14} className="text-zinc-600" />
                                        <span>PowerWorld main floor</span>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                                        <div className="flex items-center gap-2">
                                            <Tag size={12} className="text-zinc-600" />
                                            <span>Walk-in friendly</span>
                                        </div>
                                        <span className="text-red-400">Check daily timetable</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-zinc-800 bg-black/20 p-6 text-center">
                            <p className="text-sm text-zinc-500">No classes have been published yet.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
