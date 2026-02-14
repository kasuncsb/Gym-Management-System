"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Clock, Calendar, X, Users } from "lucide-react";
import { shiftAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Shift {
    id: string;
    staffId: string;
    branchId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    shiftType: string;
    isActive: boolean;
}

interface StaffSchedule {
    staffId: string;
    staffName: string;
    shifts: Shift[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DEFAULT_BRANCH = 'branch-colombo-001';

export default function ShiftsPage() {
    const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ staffId: '', dayOfWeek: '1', startTime: '06:00', endTime: '14:00', shiftType: 'morning' });

    useEffect(() => { fetchSchedules(); }, []);

    const fetchSchedules = async () => {
        try {
            const res = await shiftAPI.getBranchSchedules(DEFAULT_BRANCH);
            setSchedules(res.data.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await shiftAPI.create({
                staffId: form.staffId,
                branchId: DEFAULT_BRANCH,
                dayOfWeek: parseInt(form.dayOfWeek),
                startTime: form.startTime,
                endTime: form.endTime,
                shiftType: form.shiftType,
            });
            setShowForm(false);
            fetchSchedules();
        } catch (e) { console.error(e); }
        finally { setSubmitting(false); }
    };

    const handleDeactivate = async (shiftId: string) => {
        try {
            await shiftAPI.deactivate(shiftId);
            fetchSchedules();
        } catch (e) { console.error(e); }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-red-500" size={32} /></div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Staff Shifts</h2>
                    <p className="text-zinc-400 mt-1">Manage weekly staff schedules</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 bg-red-700 text-white rounded-xl hover:bg-red-600 transition font-medium">
                    {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? 'Cancel' : 'Add Shift'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-black/40 p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div><label className="block text-sm text-zinc-400 mb-1">Staff ID *</label><input required value={form.staffId} onChange={e => setForm({...form, staffId: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" placeholder="Staff ID" /></div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Day *</label>
                            <select value={form.dayOfWeek} onChange={e => setForm({...form, dayOfWeek: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none">
                                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                            </select>
                        </div>
                        <div><label className="block text-sm text-zinc-400 mb-1">Start Time</label><input type="time" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" /></div>
                        <div><label className="block text-sm text-zinc-400 mb-1">End Time</label><input type="time" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" /></div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Type</label>
                            <select value={form.shiftType} onChange={e => setForm({...form, shiftType: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none">
                                <option value="morning">Morning</option>
                                <option value="afternoon">Afternoon</option>
                                <option value="evening">Evening</option>
                                <option value="night">Night</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-red-700 text-white rounded-xl hover:bg-red-600 transition font-medium disabled:opacity-50">
                        {submitting ? 'Creating...' : 'Create Shift'}
                    </button>
                </form>
            )}

            {/* Schedule Grid */}
            {schedules.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-800 bg-black/30 p-16 text-center">
                    <Users className="mx-auto mb-4 text-zinc-600" size={40} />
                    <h3 className="text-xl font-semibold text-zinc-300">No Shifts Configured</h3>
                    <p className="text-zinc-500 mt-2">Add staff shifts to build your weekly schedule.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {schedules.map(staff => (
                        <div key={staff.staffId} className="rounded-2xl border border-zinc-800 bg-black/40 overflow-hidden">
                            <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-red-600/10 flex items-center justify-center text-red-500 text-sm font-bold">{staff.staffName?.charAt(0) || 'S'}</div>
                                <span className="text-white font-semibold">{staff.staffName || staff.staffId.slice(0, 8)}</span>
                            </div>
                            <div className="grid grid-cols-7 gap-px bg-zinc-800">
                                {DAYS.map((day, dayIdx) => {
                                    const dayShifts = staff.shifts.filter(s => s.dayOfWeek === dayIdx && s.isActive);
                                    return (
                                        <div key={dayIdx} className="bg-black/60 p-3 min-h-20">
                                            <div className="text-xs text-zinc-500 font-medium mb-2">{day}</div>
                                            {dayShifts.map(shift => (
                                                <div key={shift.id} className="text-xs p-1.5 rounded-lg bg-red-600/10 border border-red-600/20 text-red-300 mb-1 flex items-center justify-between">
                                                    <span>{shift.startTime}-{shift.endTime}</span>
                                                    <button onClick={() => handleDeactivate(shift.id)} className="text-zinc-500 hover:text-red-400 ml-1"><X size={10} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
