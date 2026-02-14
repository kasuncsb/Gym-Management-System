"use client";

import { useEffect, useState } from "react";
import { Loader2, Clock, Plus, Trash2, Calendar } from "lucide-react";
import { trainerAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Slot {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TrainerAvailabilityPage() {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ dayOfWeek: 1, startTime: '08:00', endTime: '12:00' });
    const [submitting, setSubmitting] = useState(false);

    const fetchSlots = async () => {
        setLoading(true);
        try {
            const res = await trainerAPI.getAvailability('me');
            setSlots(res?.data?.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchSlots(); }, []);

    const addSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await trainerAPI.setAvailability({
                dayOfWeek: form.dayOfWeek,
                startTime: form.startTime,
                endTime: form.endTime,
            });
            fetchSlots();
        } catch (e) { console.error(e); }
        finally { setSubmitting(false); }
    };

    const removeSlot = async (slotId: string) => {
        try {
            await trainerAPI.removeAvailability(slotId);
            fetchSlots();
        } catch (e) { console.error(e); }
    };

    const groupedByDay = DAYS.map((name, i) => ({
        name,
        day: i,
        slots: slots.filter(s => s.dayOfWeek === i).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }));

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div><h2 className="text-3xl font-bold text-white">My Availability</h2><p className="text-zinc-400 mt-1">Manage your weekly availability schedule</p></div>

            {/* Add Slot Form */}
            <form onSubmit={addSlot} className="rounded-2xl border border-zinc-800 bg-black/40 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Plus size={18} /> Add Availability Slot</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Day</label>
                        <select value={form.dayOfWeek} onChange={e => setForm({...form, dayOfWeek: parseInt(e.target.value)})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none">
                            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Start Time</label>
                        <input type="time" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">End Time</label>
                        <input type="time" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" />
                    </div>
                    <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-red-700 text-white rounded-xl hover:bg-red-600 transition font-medium disabled:opacity-50">
                        {submitting ? 'Adding...' : 'Add Slot'}
                    </button>
                </div>
            </form>

            {/* Weekly Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-zinc-400" size={24} /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {groupedByDay.map(day => (
                        <div key={day.day} className={cn('rounded-2xl border p-4', day.slots.length > 0 ? 'border-green-500/20 bg-green-500/5' : 'border-zinc-800 bg-black/40')}>
                            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                <Calendar size={14} className={day.slots.length > 0 ? 'text-green-400' : 'text-zinc-500'} />
                                {day.name}
                                <span className="text-xs text-zinc-500">({day.slots.length} slots)</span>
                            </h4>
                            {day.slots.length === 0 ? (
                                <p className="text-xs text-zinc-600">No availability</p>
                            ) : (
                                <div className="space-y-2">
                                    {day.slots.map(slot => (
                                        <div key={slot.id} className="flex items-center justify-between bg-zinc-900/50 rounded-lg px-3 py-2">
                                            <span className="text-sm text-zinc-300 flex items-center gap-1"><Clock size={12} /> {slot.startTime} – {slot.endTime}</span>
                                            <button onClick={() => removeSlot(slot.id)} className="text-red-400 hover:text-red-300 transition"><Trash2 size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
