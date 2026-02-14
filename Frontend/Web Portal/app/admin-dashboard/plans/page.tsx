"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { subscriptionAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Plan {
    id: string;
    name: string;
    price: string;
    durationDays: number;
    features: any;
    isActive: boolean;
    maxFreezeCount: number | null;
    maxFreezeDays: number | null;
    includedPtSessions: number | null;
    sortOrder: number | null;
}

export default function PlansManagementPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ name: '', price: '', durationDays: '30', features: '', maxFreezeCount: '', maxFreezeDays: '', includedPtSessions: '', sortOrder: '0' });

    useEffect(() => { fetchPlans(); }, []);

    const fetchPlans = async () => {
        try {
            const res = await subscriptionAPI.getAllPlans();
            setPlans(res.data.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openCreate = () => {
        setEditingPlan(null);
        setForm({ name: '', price: '', durationDays: '30', features: '', maxFreezeCount: '', maxFreezeDays: '', includedPtSessions: '', sortOrder: '0' });
        setShowForm(true);
    };

    const openEdit = (plan: Plan) => {
        setEditingPlan(plan);
        const features = Array.isArray(plan.features) ? plan.features.join('\n') : typeof plan.features === 'string' ? plan.features : '';
        setForm({
            name: plan.name,
            price: plan.price,
            durationDays: plan.durationDays.toString(),
            features,
            maxFreezeCount: plan.maxFreezeCount?.toString() || '',
            maxFreezeDays: plan.maxFreezeDays?.toString() || '',
            includedPtSessions: plan.includedPtSessions?.toString() || '',
            sortOrder: plan.sortOrder?.toString() || '0',
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const featuresArr = form.features.split('\n').map(f => f.trim()).filter(Boolean);
            const payload: any = {
                name: form.name,
                price: form.price,
                durationDays: parseInt(form.durationDays),
                features: featuresArr,
                sortOrder: parseInt(form.sortOrder) || 0,
            };
            if (form.maxFreezeCount) payload.maxFreezeCount = parseInt(form.maxFreezeCount);
            if (form.maxFreezeDays) payload.maxFreezeDays = parseInt(form.maxFreezeDays);
            if (form.includedPtSessions) payload.includedPtSessions = parseInt(form.includedPtSessions);

            if (editingPlan) {
                await subscriptionAPI.updatePlan(editingPlan.id, payload);
            } else {
                await subscriptionAPI.createPlan(payload);
            }
            setShowForm(false);
            fetchPlans();
        } catch (e) { console.error(e); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this plan?')) return;
        try {
            await subscriptionAPI.deletePlan(id);
            fetchPlans();
        } catch (e) { console.error(e); }
    };

    const formatCurrency = (amount: string) => `Rs. ${new Intl.NumberFormat('en-LK').format(parseFloat(amount))}`;

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-red-500" size={32} /></div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Subscription Plans</h2>
                    <p className="text-zinc-400 mt-1">Create and manage membership plans</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-red-700 text-white rounded-xl hover:bg-red-600 transition font-medium">
                    <Plus size={18} /> New Plan
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-black/40 p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-white">{editingPlan ? 'Edit Plan' : 'New Plan'}</h3>
                        <button type="button" onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-white"><X size={20} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="block text-sm text-zinc-400 mb-1">Plan Name *</label><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" /></div>
                        <div><label className="block text-sm text-zinc-400 mb-1">Price (LKR) *</label><input required value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" placeholder="5000" /></div>
                        <div><label className="block text-sm text-zinc-400 mb-1">Duration (days) *</label><input required type="number" value={form.durationDays} onChange={e => setForm({...form, durationDays: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" /></div>
                        <div><label className="block text-sm text-zinc-400 mb-1">Max Freeze Count</label><input type="number" value={form.maxFreezeCount} onChange={e => setForm({...form, maxFreezeCount: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" /></div>
                        <div><label className="block text-sm text-zinc-400 mb-1">Max Freeze Days</label><input type="number" value={form.maxFreezeDays} onChange={e => setForm({...form, maxFreezeDays: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" /></div>
                        <div><label className="block text-sm text-zinc-400 mb-1">Included PT Sessions</label><input type="number" value={form.includedPtSessions} onChange={e => setForm({...form, includedPtSessions: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" /></div>
                    </div>
                    <div><label className="block text-sm text-zinc-400 mb-1">Features (one per line)</label><textarea value={form.features} onChange={e => setForm({...form, features: e.target.value})} rows={4} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" placeholder="Access to gym floor&#10;Locker usage&#10;Free WiFi" /></div>
                    <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-red-700 text-white rounded-xl hover:bg-red-600 transition font-medium disabled:opacity-50">
                        {submitting ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
                    </button>
                </form>
            )}

            {/* Plans Table */}
            <div className="rounded-2xl border border-zinc-800 bg-black/40 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-900/50 text-zinc-400 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">Plan</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Duration</th>
                                <th className="px-6 py-4">PT Sessions</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {plans.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-500">No plans configured yet.</td></tr>
                            ) : plans.map(plan => (
                                <tr key={plan.id} className="hover:bg-zinc-900/30 transition">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{plan.name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-white">{formatCurrency(plan.price)}</td>
                                    <td className="px-6 py-4 text-zinc-300">{plan.durationDays} days</td>
                                    <td className="px-6 py-4 text-zinc-300">{plan.includedPtSessions || '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn("px-2 py-1 rounded-full text-xs border", plan.isActive ? "text-green-400 border-green-500/20 bg-green-500/10" : "text-red-400 border-red-500/20 bg-red-500/10")}>
                                            {plan.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                        <button onClick={() => openEdit(plan)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"><Pencil size={16} /></button>
                                        <button onClick={() => handleDelete(plan.id)} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
