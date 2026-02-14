"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, CreditCard } from "lucide-react";
import { subscriptionAPI, getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader, Card, EmptyState, ErrorAlert, Badge, Modal, LoadingButton, ConfirmDialog } from "@/components/ui/SharedComponents";

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

const formatCurrency = (amount: string) => `Rs. ${new Intl.NumberFormat("en-LK").format(parseFloat(amount))}`;

const EMPTY_FORM = { name: "", price: "", durationDays: "30", features: "", maxFreezeCount: "", maxFreezeDays: "", includedPtSessions: "", sortOrder: "0" };

export default function PlansManagementPage() {
    const toast = useToast();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [deletePlan, setDeletePlan] = useState<Plan | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const res = await subscriptionAPI.getAllPlans();
            setPlans(res.data.data || []);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPlans(); }, []);

    const openCreate = () => {
        setEditingPlan(null);
        setForm(EMPTY_FORM);
        setShowForm(true);
    };

    const openEdit = (plan: Plan) => {
        setEditingPlan(plan);
        const features = Array.isArray(plan.features) ? plan.features.join("\n") : typeof plan.features === "string" ? plan.features : "";
        setForm({
            name: plan.name, price: plan.price, durationDays: plan.durationDays.toString(), features,
            maxFreezeCount: plan.maxFreezeCount?.toString() || "", maxFreezeDays: plan.maxFreezeDays?.toString() || "",
            includedPtSessions: plan.includedPtSessions?.toString() || "", sortOrder: plan.sortOrder?.toString() || "0",
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const featuresArr = form.features.split("\n").map(f => f.trim()).filter(Boolean);
            const payload: any = { name: form.name, price: form.price, durationDays: parseInt(form.durationDays), features: featuresArr, sortOrder: parseInt(form.sortOrder) || 0 };
            if (form.maxFreezeCount) payload.maxFreezeCount = parseInt(form.maxFreezeCount);
            if (form.maxFreezeDays) payload.maxFreezeDays = parseInt(form.maxFreezeDays);
            if (form.includedPtSessions) payload.includedPtSessions = parseInt(form.includedPtSessions);

            if (editingPlan) {
                await subscriptionAPI.updatePlan(editingPlan.id, payload);
                toast.success("Plan updated", `${form.name} has been updated.`);
            } else {
                await subscriptionAPI.createPlan(payload);
                toast.success("Plan created", `${form.name} is now available.`);
            }
            setShowForm(false);
            fetchPlans();
        } catch (err) {
            toast.error("Save failed", getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletePlan) return;
        setDeleting(true);
        try {
            await subscriptionAPI.deletePlan(deletePlan.id);
            toast.success("Plan deleted", `${deletePlan.name} has been removed.`);
            setDeletePlan(null);
            fetchPlans();
        } catch (err) {
            toast.error("Delete failed", getErrorMessage(err));
        } finally {
            setDeleting(false);
        }
    };

    const inputCls = "w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition";

    if (loading) {
        return (
            <div className="space-y-8 page-enter">
                <div className="flex justify-between"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-32 rounded-xl" /></div>
                <Skeleton className="h-96 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-8 page-enter">
            <PageHeader title="Subscription Plans" subtitle="Create and manage membership plans">
                <LoadingButton onClick={openCreate} size="sm"><Plus size={16} className="mr-1.5" /> New Plan</LoadingButton>
            </PageHeader>

            {error && <ErrorAlert message={error} onRetry={fetchPlans} />}

            {/* Form Modal */}
            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingPlan ? "Edit Plan" : "New Plan"} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="block text-xs text-zinc-400 mb-1.5">Plan Name *</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} /></div>
                        <div><label className="block text-xs text-zinc-400 mb-1.5">Price (LKR) *</label><input required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className={inputCls} placeholder="5000" /></div>
                        <div><label className="block text-xs text-zinc-400 mb-1.5">Duration (days) *</label><input required type="number" value={form.durationDays} onChange={e => setForm({ ...form, durationDays: e.target.value })} className={inputCls} /></div>
                        <div><label className="block text-xs text-zinc-400 mb-1.5">Max Freeze Count</label><input type="number" value={form.maxFreezeCount} onChange={e => setForm({ ...form, maxFreezeCount: e.target.value })} className={inputCls} /></div>
                        <div><label className="block text-xs text-zinc-400 mb-1.5">Max Freeze Days</label><input type="number" value={form.maxFreezeDays} onChange={e => setForm({ ...form, maxFreezeDays: e.target.value })} className={inputCls} /></div>
                        <div><label className="block text-xs text-zinc-400 mb-1.5">Included PT Sessions</label><input type="number" value={form.includedPtSessions} onChange={e => setForm({ ...form, includedPtSessions: e.target.value })} className={inputCls} /></div>
                    </div>
                    <div><label className="block text-xs text-zinc-400 mb-1.5">Features (one per line)</label><textarea value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} rows={4} className={`${inputCls} resize-none`} placeholder={"Access to gym floor\nLocker usage\nFree WiFi"} /></div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancel</button>
                        <LoadingButton loading={submitting} type="submit">{editingPlan ? "Update Plan" : "Create Plan"}</LoadingButton>
                    </div>
                </form>
            </Modal>

            {/* Plans Table */}
            {plans.length === 0 ? (
                <Card><EmptyState icon={CreditCard} title="No plans configured" description="Create your first subscription plan." actionLabel="New Plan" onAction={openCreate} /></Card>
            ) : (
                <Card padding="none" className="overflow-hidden">
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
                                {plans.map(plan => (
                                    <tr key={plan.id} className="hover:bg-zinc-900/30 transition">
                                        <td className="px-6 py-4 font-medium text-white">{plan.name}</td>
                                        <td className="px-6 py-4 text-white">{formatCurrency(plan.price)}</td>
                                        <td className="px-6 py-4 text-zinc-300">{plan.durationDays} days</td>
                                        <td className="px-6 py-4 text-zinc-300">{plan.includedPtSessions || "—"}</td>
                                        <td className="px-6 py-4"><Badge variant={plan.isActive ? "success" : "error"}>{plan.isActive ? "Active" : "Inactive"}</Badge></td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(plan)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"><Pencil size={16} /></button>
                                                <button onClick={() => setDeletePlan(plan)} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Delete Confirmation (replaces confirm()) */}
            <ConfirmDialog
                isOpen={!!deletePlan}
                onClose={() => setDeletePlan(null)}
                onConfirm={handleDelete}
                title="Delete Plan"
                description={`Are you sure you want to delete "${deletePlan?.name}"? This action cannot be undone.`}
                confirmLabel="Delete Plan"
                variant="danger"
                loading={deleting}
            />
        </div>
    );
}
