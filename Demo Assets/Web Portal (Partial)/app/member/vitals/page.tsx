"use client";

import { useEffect, useState } from "react";
import { Heart, Plus, TrendingUp, Weight, Ruler, Activity, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { vitalsAPI, getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { PageHeader, Card, EmptyState, ErrorAlert, Modal, LoadingButton } from "@/components/ui/SharedComponents";

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

const inputClass = "w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all";

export default function VitalsPage() {
    const toast = useToast();
    const [vitals, setVitals] = useState<VitalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        weightKg: "", heightCm: "", bodyFatPercentage: "",
        bloodPressureSystolic: "", bloodPressureDiastolic: "",
        restingHeartRate: "", notes: "",
    });

    useEffect(() => { fetchVitals(); }, []);

    const fetchVitals = async () => {
        setLoading(true);
        try {
            const res = await vitalsAPI.getOwnHistory(30);
            setVitals(res.data.data || []);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        const payload: any = {};
        if (form.weightKg) payload.weightKg = parseFloat(form.weightKg);
        if (form.heightCm) payload.heightCm = parseFloat(form.heightCm);
        if (form.bodyFatPercentage) payload.bodyFatPercentage = parseFloat(form.bodyFatPercentage);
        if (form.bloodPressureSystolic) payload.bloodPressureSystolic = parseInt(form.bloodPressureSystolic);
        if (form.bloodPressureDiastolic) payload.bloodPressureDiastolic = parseInt(form.bloodPressureDiastolic);
        if (form.restingHeartRate) payload.restingHeartRate = parseInt(form.restingHeartRate);
        if (form.notes) payload.notes = form.notes;

        if (Object.keys(payload).length === 0) {
            toast.warning("Empty record", "Please fill in at least one metric.");
            return;
        }

        setSubmitting(true);
        try {
            await vitalsAPI.recordOwn(payload);
            toast.success("Vitals recorded", "Your metrics have been saved.");
            setShowForm(false);
            setForm({ weightKg: "", heightCm: "", bodyFatPercentage: "", bloodPressureSystolic: "", bloodPressureDiastolic: "", restingHeartRate: "", notes: "" });
            fetchVitals();
        } catch (err) {
            toast.error("Failed to save", getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const latest = vitals[0];
    const prev = vitals[1];

    const getDelta = (curr: string | number | null, previous: string | number | null) => {
        if (!curr || !previous) return null;
        const c = typeof curr === "string" ? parseFloat(curr) : curr;
        const p = typeof previous === "string" ? parseFloat(previous) : previous;
        if (c === null || p === null || isNaN(c) || isNaN(p) || p === 0) return null;
        return ((c - p) / p) * 100;
    };

    if (loading) {
        return (
            <div className="space-y-8 page-enter">
                <div className="space-y-2"><Skeleton className="h-8 w-40" /><Skeleton className="h-4 w-64" /></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-8 page-enter">
            <PageHeader
                title="My Vitals"
                subtitle="Track your body metrics and progress over time"
                badge={vitals.length > 0 ? `${vitals.length} records` : undefined}
                badgeColor="blue"
                actions={
                    <LoadingButton icon={Plus} onClick={() => setShowForm(true)}>
                        Record Vitals
                    </LoadingButton>
                }
            />

            {error && <ErrorAlert message={error} onRetry={fetchVitals} />}

            {/* Latest Stats Cards */}
            {latest && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-in">
                    {[
                        { icon: Weight, color: "blue", label: "Weight", value: latest.weightKg ? `${parseFloat(latest.weightKg).toFixed(1)}` : null, unit: "kg", delta: getDelta(latest.weightKg, prev?.weightKg) },
                        { icon: Ruler, color: "green", label: "BMI", value: latest.bmi ? parseFloat(latest.bmi).toFixed(1) : null, unit: "", delta: getDelta(latest.bmi, prev?.bmi) },
                        { icon: TrendingUp, color: "purple", label: "Body Fat", value: latest.bodyFatPercentage ? `${parseFloat(latest.bodyFatPercentage).toFixed(1)}` : null, unit: "%", delta: getDelta(latest.bodyFatPercentage, prev?.bodyFatPercentage) },
                        { icon: Activity, color: "red", label: "Resting HR", value: latest.restingHeartRate ? `${latest.restingHeartRate}` : null, unit: "bpm", delta: getDelta(latest.restingHeartRate, prev?.restingHeartRate) },
                    ].map(({ icon: Icon, color, label, value, unit, delta }, i) => (
                        value && (
                            <Card key={i} className="relative overflow-hidden">
                                <div className={`absolute top-0 right-0 w-20 h-20 bg-${color}-500/5 rounded-full blur-2xl`} />
                                <div className="relative">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={`w-8 h-8 rounded-lg bg-${color}-500/10 flex items-center justify-center`}>
                                            <Icon size={16} className={`text-${color}-400`} />
                                        </div>
                                        <span className="text-xs text-zinc-500 font-medium">{label}</span>
                                    </div>
                                    <div className="flex items-end gap-1">
                                        <span className="text-2xl font-bold text-white">{value}</span>
                                        {unit && <span className="text-sm text-zinc-500 mb-0.5">{unit}</span>}
                                    </div>
                                    {delta !== null && (
                                        <div className={`flex items-center gap-1 mt-2 text-xs ${delta > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                                            {delta > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                            {Math.abs(delta).toFixed(1)}% from last
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )
                    ))}
                    {latest.bloodPressureSystolic && (
                        <Card className="relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full blur-2xl" />
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                        <Heart size={16} className="text-rose-400" />
                                    </div>
                                    <span className="text-xs text-zinc-500 font-medium">Blood Pressure</span>
                                </div>
                                <div className="flex items-end gap-1">
                                    <span className="text-2xl font-bold text-white">{latest.bloodPressureSystolic}/{latest.bloodPressureDiastolic}</span>
                                    <span className="text-sm text-zinc-500 mb-0.5">mmHg</span>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* History Table */}
            <Card padding="none" className="overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800">
                    <h3 className="text-lg font-semibold text-white">History</h3>
                </div>
                {vitals.length === 0 ? (
                    <EmptyState
                        icon={Heart}
                        title="No vitals recorded"
                        description="Start tracking your metrics to see trends over time."
                        action={
                            <LoadingButton icon={Plus} onClick={() => setShowForm(true)} variant="secondary" size="sm">
                                Record Now
                            </LoadingButton>
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-900/50 text-zinc-400 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Date</th>
                                    <th className="px-6 py-3 font-medium">Weight</th>
                                    <th className="px-6 py-3 font-medium">BMI</th>
                                    <th className="px-6 py-3 font-medium">Body Fat</th>
                                    <th className="px-6 py-3 font-medium">BP</th>
                                    <th className="px-6 py-3 font-medium">HR</th>
                                    <th className="px-6 py-3 font-medium">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {vitals.map((v) => (
                                    <tr key={v.id} className="hover:bg-zinc-900/30 transition-colors">
                                        <td className="px-6 py-3 text-zinc-300 whitespace-nowrap">
                                            {new Date(v.createdAt).toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" })}
                                        </td>
                                        <td className="px-6 py-3 text-white font-medium">{v.weightKg ? `${parseFloat(v.weightKg).toFixed(1)} kg` : "—"}</td>
                                        <td className="px-6 py-3 text-white">{v.bmi ? parseFloat(v.bmi).toFixed(1) : "—"}</td>
                                        <td className="px-6 py-3 text-white">{v.bodyFatPercentage ? `${parseFloat(v.bodyFatPercentage).toFixed(1)}%` : "—"}</td>
                                        <td className="px-6 py-3 text-white">{v.bloodPressureSystolic ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}` : "—"}</td>
                                        <td className="px-6 py-3 text-white">{v.restingHeartRate ? `${v.restingHeartRate} bpm` : "—"}</td>
                                        <td className="px-6 py-3 text-zinc-400 text-xs max-w-50 truncate">{v.notes || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Record Vitals Modal */}
            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Record Vitals" description="Enter your current body metrics" size="lg">
                <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Weight (kg)</label>
                            <input type="number" step="0.1" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} className={inputClass} placeholder="75.5" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Height (cm)</label>
                            <input type="number" step="0.1" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} className={inputClass} placeholder="175" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Body Fat %</label>
                            <input type="number" step="0.1" value={form.bodyFatPercentage} onChange={(e) => setForm({ ...form, bodyFatPercentage: e.target.value })} className={inputClass} placeholder="18.5" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1.5">BP Systolic</label>
                            <input type="number" value={form.bloodPressureSystolic} onChange={(e) => setForm({ ...form, bloodPressureSystolic: e.target.value })} className={inputClass} placeholder="120" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1.5">BP Diastolic</label>
                            <input type="number" value={form.bloodPressureDiastolic} onChange={(e) => setForm({ ...form, bloodPressureDiastolic: e.target.value })} className={inputClass} placeholder="80" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Resting Heart Rate</label>
                            <input type="number" value={form.restingHeartRate} onChange={(e) => setForm({ ...form, restingHeartRate: e.target.value })} className={inputClass} placeholder="65" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Notes</label>
                        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={inputClass + " resize-none"} placeholder="How are you feeling today?" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                        <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors">Cancel</button>
                        <LoadingButton loading={submitting} onClick={handleSubmit}>Save Record</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
