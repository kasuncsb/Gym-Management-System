"use client";

import { useEffect, useState } from "react";
import { Loader2, UserCheck, Calendar, Clock, Star, ChevronRight } from "lucide-react";
import { trainerAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Trainer {
    id: string;
    specialization: string | null;
    bio: string | null;
    users: { fullName: string; email: string } | null;
}

interface AvailabilitySlot {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    isBooked: boolean;
}

export default function TrainersPage() {
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
    const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [bookingSlot, setBookingSlot] = useState<string | null>(null);
    const [bookForm, setBookForm] = useState({ sessionType: 'personal_training', notes: '' });

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await trainerAPI.list();
                setTrainers(res.data.data || []);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    const selectTrainer = async (trainer: Trainer) => {
        setSelectedTrainer(trainer);
        setLoadingSlots(true);
        try {
            const res = await trainerAPI.getAvailability(trainer.id);
            setAvailability(res.data.data || []);
        } catch (e) { console.error(e); }
        finally { setLoadingSlots(false); }
    };

    const bookSession = async (slot: AvailabilitySlot) => {
        setBookingSlot(slot.id);
        try {
            await trainerAPI.bookSession({
                trainerId: selectedTrainer!.id,
                scheduledDate: slot.date,
                startTime: slot.startTime,
                endTime: slot.endTime,
                sessionType: bookForm.sessionType,
                notes: bookForm.notes || undefined,
            });
            // Refresh availability
            const res = await trainerAPI.getAvailability(selectedTrainer!.id);
            setAvailability(res.data.data || []);
        } catch (e) { console.error(e); }
        finally { setBookingSlot(null); }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-red-500" size={32} /></div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h2 className="text-3xl font-bold text-white">Trainers</h2>
                <p className="text-zinc-400 mt-1">Browse our expert trainers and book personal training sessions</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trainer List */}
                <div className="lg:col-span-1 space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider px-1">Available Trainers</h3>
                    {trainers.length === 0 ? (
                        <p className="text-zinc-500 text-sm">No trainers available at the moment.</p>
                    ) : (
                        trainers.map(t => (
                            <button
                                key={t.id}
                                onClick={() => selectTrainer(t)}
                                className={cn(
                                    "w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-4",
                                    selectedTrainer?.id === t.id
                                        ? "border-red-600/50 bg-red-600/5"
                                        : "border-zinc-800 bg-black/40 hover:border-zinc-700"
                                )}
                            >
                                <div className="w-12 h-12 rounded-full bg-linear-to-br from-red-600 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                                    {t.users?.fullName?.charAt(0) || 'T'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-white truncate">{t.users?.fullName || 'Trainer'}</p>
                                    <p className="text-xs text-zinc-500 truncate">{t.specialization || 'General Fitness'}</p>
                                </div>
                                <ChevronRight size={16} className="text-zinc-600" />
                            </button>
                        ))
                    )}
                </div>

                {/* Trainer Details & Booking */}
                <div className="lg:col-span-2">
                    {!selectedTrainer ? (
                        <div className="rounded-2xl border border-dashed border-zinc-800 bg-black/30 p-16 text-center">
                            <UserCheck className="mx-auto mb-4 text-zinc-600" size={40} />
                            <p className="text-zinc-500">Select a trainer to view their availability and book a session</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Trainer Bio */}
                            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-6">
                                <h3 className="text-xl font-bold text-white mb-2">{selectedTrainer.users?.fullName}</h3>
                                <p className="text-sm text-red-400 mb-3">{selectedTrainer.specialization || 'General Fitness'}</p>
                                {selectedTrainer.bio && <p className="text-zinc-400 text-sm">{selectedTrainer.bio}</p>}
                            </div>

                            {/* Availability */}
                            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-6">
                                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Calendar size={18} className="text-red-400" /> Available Slots
                                </h4>
                                {loadingSlots ? (
                                    <Loader2 className="animate-spin text-red-500" size={24} />
                                ) : availability.length === 0 ? (
                                    <p className="text-zinc-500 text-sm">No available slots this week. Check back later!</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {availability.filter(s => !s.isBooked).map(slot => (
                                            <div key={slot.id} className="p-4 rounded-xl border border-zinc-700 bg-zinc-900/30 flex items-center justify-between">
                                                <div>
                                                    <p className="text-white font-medium text-sm">{new Date(slot.date).toLocaleDateString('en-LK', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                                    <p className="text-xs text-zinc-500 flex items-center gap-1"><Clock size={12} /> {slot.startTime} – {slot.endTime}</p>
                                                </div>
                                                <button
                                                    onClick={() => bookSession(slot)}
                                                    disabled={bookingSlot === slot.id}
                                                    className="px-3 py-1.5 bg-red-700 text-white text-xs rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                                                >
                                                    {bookingSlot === slot.id ? 'Booking...' : 'Book'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
