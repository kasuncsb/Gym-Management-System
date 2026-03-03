"use client";

import { useEffect, useState } from "react";
import { Clock, Plus, Trash2, CalendarDays } from "lucide-react";
import { trainerAPI, getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader, Card, EmptyState, LoadingButton, ConfirmDialog } from "@/components/ui/SharedComponents";

interface Slot {
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function TrainerAvailabilityPage() {
    const toast = useToast();
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ dayOfWeek: "Monday", startTime: "09:00", endTime: "10:00" });
    const [adding, setAdding] = useState(false);
    const [deleteSlot, setDeleteSlot] = useState<Slot | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchSlots = async () => {
        setLoading(true);
        try {
            const res = await trainerAPI.getAvailability("me");
            setSlots(res.data.data || []);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSlots(); }, []);

    const addSlot = async () => {
        if (formData.startTime >= formData.endTime) {
            toast.error("Invalid time", "End time must be after start time.");
            return;
        }
        setAdding(true);
        try {
            await trainerAPI.setAvailability(formData);
            toast.success("Slot added", `${formData.dayOfWeek} ${formData.startTime}–${formData.endTime}`);
            setShowForm(false);
            fetchSlots();
        } catch (err) {
            toast.error("Failed to add", getErrorMessage(err));
        } finally {
            setAdding(false);
        }
    };

    const removeSlot = async () => {
        if (!deleteSlot) return;
        setDeleting(true);
        try {
            await trainerAPI.removeAvailability(deleteSlot.id);
            toast.success("Slot removed", `${deleteSlot.dayOfWeek} ${deleteSlot.startTime}–${deleteSlot.endTime}`);
            setDeleteSlot(null);
            fetchSlots();
        } catch (err) {
            toast.error("Failed to remove", getErrorMessage(err));
        } finally {
            setDeleting(false);
        }
    };

    const grouped = DAYS.map((day) => ({
        day,
        slots: slots.filter((s) => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    })).filter((g) => g.slots.length > 0);

    if (loading) {
        return (
            <div className="space-y-8 page-enter">
                <div className="flex justify-between items-center"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-32 rounded-xl" /></div>
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2"><Skeleton className="h-5 w-24" /><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="h-16 rounded-xl" />)}</div></div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8 page-enter">
            <PageHeader title="My Availability" subtitle="Set your available hours for training sessions">
                <LoadingButton onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "primary"} size="sm">
                    <Plus size={16} className="mr-1.5" /> {showForm ? "Cancel" : "Add Slot"}
                </LoadingButton>
            </PageHeader>

            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

            {showForm && (
                <Card className="animate-in slide-in-from-top-2 duration-200">
                    <h3 className="text-sm font-medium text-white mb-4">New Availability Slot</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1.5">Day</label>
                            <select value={formData.dayOfWeek} onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })} className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition">
                                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1.5">Start Time</label>
                            <input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition" />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1.5">End Time</label>
                            <input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition" />
                        </div>
                        <div className="flex items-end">
                            <LoadingButton loading={adding} onClick={addSlot} className="w-full">Add Slot</LoadingButton>
                        </div>
                    </div>
                </Card>
            )}

            {grouped.length === 0 ? (
                <Card><EmptyState icon={CalendarDays} title="No availability set" description="Add your available time slots so members can book sessions." actionLabel="Add Your First Slot" onAction={() => setShowForm(true)} /></Card>
            ) : (
                <div className="space-y-6 stagger-in">
                    {grouped.map(({ day, slots: daySlots }) => (
                        <div key={day}>
                            <h3 className="text-sm font-medium text-zinc-400 mb-3">{day}</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {daySlots.map((slot) => (
                                    <div key={slot.id} className="group relative p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:border-zinc-700 transition">
                                        <div className="flex items-center gap-2 text-white text-sm font-medium">
                                            <Clock size={14} className="text-red-400" />
                                            {slot.startTime} – {slot.endTime}
                                        </div>
                                        <button
                                            onClick={() => setDeleteSlot(slot)}
                                            className="absolute top-2 right-2 p-1 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Remove"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={!!deleteSlot}
                onClose={() => setDeleteSlot(null)}
                onConfirm={removeSlot}
                title="Remove Time Slot"
                description={`Remove ${deleteSlot?.dayOfWeek} ${deleteSlot?.startTime}–${deleteSlot?.endTime}? Members will no longer be able to book this slot.`}
                confirmLabel="Remove"
                variant="danger"
                loading={deleting}
            />
        </div>
    );
}
