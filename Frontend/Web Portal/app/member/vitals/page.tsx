"use client";

import { useEffect, useState } from "react";
import { Heart, Loader2, Plus, TrendingUp, Weight, Ruler, Activity, X } from "lucide-react";
import { vitalsAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

interface VitalRecord {
    id: string;
    weightKg: string | null;
    heightCm: string | null;
    bmi: string | null;
    bodyFatPercentage: string | null;
    bloodPressureSystolic: number | null;
    bloodPressureDiastolic: number | null;
    restingHeartRate: number | null;
    notes: string | null;
    createdAt: string;
}

export default function VitalsPage() {
    const [vitals, setVitals] = useState<VitalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ weightKg: '', heightCm: '', bodyFatPercentage: '', bloodPressureSystolic: '', bloodPressureDiastolic: '', restingHeartRate: '', notes: '' });

    useEffect(() => { fetchVitals(); }, []);

    const fetchVitals = async () => {
        try {
            const res = await vitalsAPI.getOwnHistory(30);
            setVitals(res.data.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload: any = {};
            if (form.weightKg) payload.weightKg = parseFloat(form.weightKg);
            if (form.heightCm) payload.heightCm = parseFloat(form.heightCm);
            if (form.bodyFatPercentage) payload.bodyFatPercentage = parseFloat(form.bodyFatPercentage);
            if (form.bloodPressureSystolic) payload.bloodPressureSystolic = parseInt(form.bloodPressureSystolic);
            if (form.bloodPressureDiastolic) payload.bloodPressureDiastolic = parseInt(form.bloodPressureDiastolic);
            if (form.restingHeartRate) payload.restingHeartRate = parseInt(form.restingHeartRate);
            if (form.notes) payload.notes = form.notes;

            await vitalsAPI.recordOwn(payload);
            setShowForm(false);
            setForm({ weightKg: '', heightCm: '', bodyFatPercentage: '', bloodPressureSystolic: '', bloodPressureDiastolic: '', restingHeartRate: '', notes: '' });
            fetchVitals();
        } catch (e) { console.error(e); }
        finally { setSubmitting(false); }
    };

    const latest = vitals[0];

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-red-500" size={32} /></div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">My Vitals</h2>
                    <p className="text-zinc-400 mt-1">Track your body metrics and progress over time</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 bg-red-700 text-white rounded-xl hover:bg-red-600 transition font-medium">
                    {showForm ? <X size={18} /> : <Plus size={18} />}
                    {showForm ? 'Cancel' : 'Record Vitals'}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-black/40 p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Weight (kg)</label>
                            <input type="number" step="0.1" value={form.weightKg} onChange={e => setForm({...form, weightKg: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" placeholder="75.5" />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Height (cm)</label>
                            <input type="number" step="0.1" value={form.heightCm} onChange={e => setForm({...form, heightCm: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" placeholder="175" />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Body Fat %</label>
                            <input type="number" step="0.1" value={form.bodyFatPercentage} onChange={e => setForm({...form, bodyFatPercentage: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" placeholder="18.5" />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">BP Systolic</label>
                            <input type="number" value={form.bloodPressureSystolic} onChange={e => setForm({...form, bloodPressureSystolic: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" placeholder="120" />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">BP Diastolic</label>
                            <input type="number" value={form.bloodPressureDiastolic} onChange={e => setForm({...form, bloodPressureDiastolic: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" placeholder="80" />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Resting Heart Rate</label>
                            <input type="number" value={form.restingHeartRate} onChange={e => setForm({...form, restingHeartRate: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" placeholder="65" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Notes</label>
                        <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" placeholder="Any notes about how you're feeling..." />
                    </div>
                    <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-red-700 text-white rounded-xl hover:bg-red-600 transition font-medium disabled:opacity-50">
                        {submitting ? 'Saving...' : 'Save Record'}
                    </button>
                </form>
            )}

            {/* Latest stats cards */}
            {latest && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {latest.weightKg && (
                        <div className="p-4 rounded-2xl border border-zinc-800 bg-black/40">
                            <div className="flex items-center gap-2 mb-2"><Weight size={16} className="text-blue-400" /><span className="text-xs text-zinc-500">Weight</span></div>
                            <div className="text-2xl font-bold text-white">{parseFloat(latest.weightKg).toFixed(1)}<span className="text-sm text-zinc-500 ml-1">kg</span></div>
                        </div>
                    )}
                    {latest.heightCm && (
                        <div className="p-4 rounded-2xl border border-zinc-800 bg-black/40">
                            <div className="flex items-center gap-2 mb-2"><Ruler size={16} className="text-green-400" /><span className="text-xs text-zinc-500">Height</span></div>
                            <div className="text-2xl font-bold text-white">{parseFloat(latest.heightCm).toFixed(0)}<span className="text-sm text-zinc-500 ml-1">cm</span></div>
                        </div>
                    )}
                    {latest.bmi && (
                        <div className="p-4 rounded-2xl border border-zinc-800 bg-black/40">
                            <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-yellow-400" /><span className="text-xs text-zinc-500">BMI</span></div>
                            <div className="text-2xl font-bold text-white">{parseFloat(latest.bmi).toFixed(1)}</div>
                        </div>
                    )}
                    {latest.restingHeartRate && (
                        <div className="p-4 rounded-2xl border border-zinc-800 bg-black/40">
                            <div className="flex items-center gap-2 mb-2"><Activity size={16} className="text-red-400" /><span className="text-xs text-zinc-500">Resting HR</span></div>
                            <div className="text-2xl font-bold text-white">{latest.restingHeartRate}<span className="text-sm text-zinc-500 ml-1">bpm</span></div>
                        </div>
                    )}
                </div>
            )}

            {/* History */}
            <div className="rounded-2xl border border-zinc-800 bg-black/40 overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800"><h3 className="text-lg font-semibold text-white">History</h3></div>
                {vitals.length === 0 ? (
                    <div className="p-12 text-center">
                        <Heart className="mx-auto mb-4 text-zinc-600" size={40} />
                        <p className="text-zinc-500">No vitals recorded yet. Click &quot;Record Vitals&quot; to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-900/50 text-zinc-400 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Weight</th>
                                    <th className="px-6 py-3">BMI</th>
                                    <th className="px-6 py-3">Body Fat</th>
                                    <th className="px-6 py-3">BP</th>
                                    <th className="px-6 py-3">HR</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {vitals.map(v => (
                                    <tr key={v.id} className="hover:bg-zinc-900/30">
                                        <td className="px-6 py-3 text-zinc-300">{new Date(v.createdAt).toLocaleDateString('en-LK')}</td>
                                        <td className="px-6 py-3 text-white">{v.weightKg ? `${parseFloat(v.weightKg).toFixed(1)} kg` : '—'}</td>
                                        <td className="px-6 py-3 text-white">{v.bmi ? parseFloat(v.bmi).toFixed(1) : '—'}</td>
                                        <td className="px-6 py-3 text-white">{v.bodyFatPercentage ? `${parseFloat(v.bodyFatPercentage).toFixed(1)}%` : '—'}</td>
                                        <td className="px-6 py-3 text-white">{v.bloodPressureSystolic ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}` : '—'}</td>
                                        <td className="px-6 py-3 text-white">{v.restingHeartRate ? `${v.restingHeartRate} bpm` : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
