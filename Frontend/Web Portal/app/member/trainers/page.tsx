"use client";

import { useEffect, useState } from "react";
import { UserCheck, Calendar, Clock, ChevronRight, Star, MessageSquare } from "lucide-react";
import { trainerAPI, getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader, Card, EmptyState, ErrorAlert, Modal, LoadingButton, Badge } from "@/components/ui/SharedComponents";
import { cn } from "@/lib/utils";

interface Trainer {
    id: string;
    specialization: string | null;
    bio: string | null;
    experienceYears?: number | null;
    rating?: number | null;
    users: { fullName: string; email: string } | null;
}

interface AvailabilitySlot {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    isBooked: boolean;
}

const inputClass = "w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all";

export default function TrainersPage() {
    const toast = useToast();
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
    const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [bookingSlot, setBookingSlot] = useState<string | null>(null);
    const [showBookModal, setShowBookModal] = useState(false);
    const [pendingSlot, setPendingSlot] = useState<AvailabilitySlot | null>(null);
    const [bookForm, setBookForm] = useState({ sessionType: "personal_training", notes: "" });

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await trainerAPI.list();
                setTrainers(res.data.data || []);
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const selectTrainer = async (trainer: Trainer) => {
        setSelectedTrainer(trainer);
        setLoadingSlots(true);
        try {
            const res = await trainerAPI.getAvailability(trainer.id);
            setAvailability(res.data.data || []);
        } catch (err) {
            toast.error("Failed to load", getErrorMessage(err));
        } finally {
            setLoadingSlots(false);
        }
    };

    const openBooking = (slot: AvailabilitySlot) => {
        setPendingSlot(slot);
        setBookForm({ sessionType: "personal_training", notes: "" });
        setShowBookModal(true);
    };

    const bookSession = async () => {
        if (!pendingSlot || !selectedTrainer) return;
        setBookingSlot(pendingSlot.id);
        try {
            await trainerAPI.bookSession({
                trainerId: selectedTrainer.id,
                scheduledDate: pendingSlot.date,
                startTime: pendingSlot.startTime,
                endTime: pendingSlot.endTime,
                sessionType: bookForm.sessionType,
                notes: bookForm.notes || undefined,
            });
            toast.success("Session booked!", `Your session with ${selectedTrainer.users?.fullName} has been confirmed.`);
            setShowBookModal(false);
            const res = await trainerAPI.getAvailability(selectedTrainer.id);
            setAvailability(res.data.data || []);
        } catch (err) {
            toast.error("Booking failed", getErrorMessage(err));
        } finally {
            setBookingSlot(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 page-enter">
                <div className="space-y-2"><Skeleton className="h-8 w-40" /><Skeleton className="h-4 w-64" /></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                    </div>
                    <div className="lg:col-span-2"><Skeleton className="h-96 w-full rounded-2xl" /></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 page-enter">
            <PageHeader
                title="Trainers"
                subtitle="Browse our expert trainers and book personal training sessions"
                badge={`${trainers.length} available`}
                badgeColor="green"
            />

            {error && <ErrorAlert message={error} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trainer List */}
                <div className="space-y-3">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">Available Trainers</p>
                    {trainers.length === 0 ? (
                        <Card><EmptyState icon={UserCheck} title="No trainers available" description="Check back later for available trainers." /></Card>
                    ) : (
                        <div className="space-y-2 stagger-in">
                            {trainers.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => selectTrainer(t)}
                                    className={cn(
                                        "w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-4 group",
                                        selectedTrainer?.id === t.id
                                            ? "border-red-600/50 bg-red-600/5 shadow-lg shadow-red-900/10"
                                            : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50"
                                    )}
                                >
                                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-red-700 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-red-900/20">
                                        {t.users?.fullName?.charAt(0) || "T"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-white truncate">{t.users?.fullName || "Trainer"}</p>
                                        <p className="text-xs text-zinc-500 truncate">{t.specialization || "General Fitness"}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Trainer Details & Booking */}
                <div className="lg:col-span-2">
                    {!selectedTrainer ? (
                        <Card padding="none" className="py-20">
                            <EmptyState icon={UserCheck} title="Select a trainer" description="Choose a trainer from the list to view availability and book sessions" />
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {/* Trainer Bio */}
                            <Card className="relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
                                <div className="relative flex items-start gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-red-700 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-red-900/20 shrink-0">
                                        {selectedTrainer.users?.fullName?.charAt(0) || "T"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-bold text-white">{selectedTrainer.users?.fullName}</h3>
                                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                            <Badge variant="info">{selectedTrainer.specialization || "General Fitness"}</Badge>
                                            {selectedTrainer.experienceYears && <Badge variant="default">{selectedTrainer.experienceYears} years exp</Badge>}
                                            {selectedTrainer.rating && (
                                                <div className="flex items-center gap-1 text-xs text-amber-400">
                                                    <Star size={12} className="fill-amber-400" />
                                                    {selectedTrainer.rating.toFixed(1)}
                                                </div>
                                            )}
                                        </div>
                                        {selectedTrainer.bio && <p className="text-zinc-400 text-sm mt-3 leading-relaxed">{selectedTrainer.bio}</p>}
                                    </div>
                                </div>
                            </Card>

                            {/* Availability */}
                            <Card>
                                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Calendar size={18} className="text-red-400" /> Available Slots
                                </h4>
                                {loadingSlots ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                                    </div>
                                ) : availability.filter((s) => !s.isBooked).length === 0 ? (
                                    <EmptyState icon={Calendar} title="No open slots" description="No available slots this week. Check back later!" />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {availability.filter((s) => !s.isBooked).map((slot) => (
                                            <div key={slot.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-center justify-between hover:border-zinc-700 transition-colors">
                                                <div>
                                                    <p className="text-white font-medium text-sm">
                                                        {new Date(slot.date).toLocaleDateString("en-LK", { weekday: "short", month: "short", day: "numeric" })}
                                                    </p>
                                                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                                                        <Clock size={12} /> {slot.startTime} – {slot.endTime}
                                                    </p>
                                                </div>
                                                <LoadingButton
                                                    loading={bookingSlot === slot.id}
                                                    size="sm"
                                                    onClick={() => openBooking(slot)}
                                                >
                                                    Book
                                                </LoadingButton>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {/* Booking Confirmation Modal */}
            <Modal isOpen={showBookModal} onClose={() => setShowBookModal(false)} title="Book Session" description={`Session with ${selectedTrainer?.users?.fullName}`}>
                <div className="space-y-5">
                    {pendingSlot && (
                        <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50">
                            <div className="flex items-center gap-3">
                                <Calendar size={16} className="text-red-400" />
                                <span className="text-white font-medium">{new Date(pendingSlot.date).toLocaleDateString("en-LK", { weekday: "long", month: "long", day: "numeric" })}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                                <Clock size={16} className="text-zinc-500" />
                                <span className="text-zinc-400 text-sm">{pendingSlot.startTime} – {pendingSlot.endTime}</span>
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Session Type</label>
                        <select
                            value={bookForm.sessionType}
                            onChange={(e) => setBookForm({ ...bookForm, sessionType: e.target.value })}
                            className={inputClass}
                        >
                            <option value="personal_training">Personal Training</option>
                            <option value="group_session">Group Session</option>
                            <option value="consultation">Consultation</option>
                            <option value="assessment">Assessment</option>
                        </select>
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1.5">
                            <MessageSquare size={14} className="text-zinc-500" /> Notes (optional)
                        </label>
                        <textarea
                            value={bookForm.notes}
                            onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })}
                            rows={2}
                            className={inputClass + " resize-none"}
                            placeholder="Any specific goals or areas to focus on..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                        <button onClick={() => setShowBookModal(false)} className="px-4 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors">Cancel</button>
                        <LoadingButton loading={!!bookingSlot} onClick={bookSession}>Confirm Booking</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
