"use client";

import { useEffect, useState } from "react";
import { appointmentAPI } from "@/lib/api";
import { Loader2, Calendar, User } from "lucide-react";

interface Appointment {
    id: string;
    trainerId: string;
    startTime: string;
    endTime: string;
    type?: string;
    notes?: string;
}

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const response = await appointmentAPI.listMy();
                setAppointments(response.data.data || []);
            } catch (error) {
                console.error("Failed to load appointments:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
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
            <header>
                <h1 className="text-3xl font-bold text-white">Appointments</h1>
                <p className="text-zinc-400 mt-1">Your confirmed sessions with PowerWorld trainers.</p>
            </header>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 backdrop-blur-md overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2 text-white">
                    <Calendar size={18} className="text-red-500" />
                    Upcoming Sessions
                </div>
                {appointments.length === 0 ? (
                    <div className="p-10 text-center text-zinc-500">No appointments scheduled.</div>
                ) : (
                    <div className="divide-y divide-zinc-800">
                        {appointments.map((appointment) => (
                            <div key={appointment.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 py-4">
                                <div>
                                    <p className="text-sm font-semibold text-white">{appointment.type || "Personal Training"}</p>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        {new Date(appointment.startTime).toLocaleString("en-LK")} -{" "}
                                        {new Date(appointment.endTime).toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                    <User size={14} />
                                    Trainer ID: {appointment.trainerId}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
