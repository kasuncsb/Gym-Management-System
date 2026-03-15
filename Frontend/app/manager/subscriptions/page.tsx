'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Plus, Pencil } from 'lucide-react';
import { PageHeader, Card, Modal, Input, Select, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

interface Plan {
    id: string;
    name: string;
    planType: string;
    price: number;
    durationDays: number;
    ptSessions: number;
    active: boolean;
    subscribers: number;
}

export default function ManagerSubscriptionsPage() {
    const toast = useToast();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        planType: 'monthly',
        price: '',
        durationDays: '',
        ptSessions: '',
        active: true,
    });

    const loadPlans = async () => {
        const rows = await opsAPI.plans();
        setPlans((rows ?? []).map((p: any) => ({
            id: p.id,
            name: p.name,
            planType: p.planType,
            price: Number(p.price ?? 0),
            durationDays: Number(p.durationDays ?? 0),
            ptSessions: Number(p.includedPtSessions ?? 0),
            active: !!p.isActive,
            subscribers: 0,
        })));
    };

    useEffect(() => {
        loadPlans().catch((err) => toast.error('Failed to load plans', getErrorMessage(err)));
    }, []);

    const openAdd = () => {
        setEditing(null);
        setForm({ name: '', planType: 'monthly', price: '', durationDays: '', ptSessions: '', active: true });
        setModalOpen(true);
    };

    const openEdit = (p: Plan) => {
        setEditing(p);
        setForm({
            name: p.name,
            planType: p.planType,
            price: String(p.price),
            durationDays: String(p.durationDays),
            ptSessions: String(p.ptSessions),
            active: p.active,
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.price || !form.durationDays) {
            toast.error('Validation Error', 'Name, price, and duration are required');
            return;
        }
        setLoading(true);
        try {
            if (editing) {
                await opsAPI.updatePlan(editing.id, {
                    name: form.name.trim(),
                    price: Number(form.price),
                    durationDays: Number(form.durationDays),
                    isActive: form.active,
                });
                toast.success('Plan Updated', `${form.name} has been updated`);
            } else {
                await opsAPI.createPlan({
                    name: form.name.trim(),
                    planType: (form.planType === 'annual' ? 'corporate' : 'individual') as 'individual' | 'couple' | 'student' | 'corporate' | 'daily_pass',
                    price: Number(form.price),
                    durationDays: Number(form.durationDays),
                    includedPtSessions: Number(form.ptSessions) || 0,
                });
                toast.success('Plan Added', `${form.name} has been added`);
            }
            await loadPlans();
            setModalOpen(false);
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="Subscription Plans"
                subtitle="Manage plans and pricing for PowerWorld Kiribathgoda"
                action={
                    <LoadingButton icon={Plus} onClick={openAdd} size="md">
                        Add Plan
                    </LoadingButton>
                }
            />

            <Card padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-700">
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Plan</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Type</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Price</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Duration</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">PT Sessions</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Subscribers</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Status</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plans.map(p => (
                                <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                    <td className="px-6 py-4 text-white font-semibold">{p.name}</td>
                                    <td className="px-6 py-4 text-zinc-400 capitalize">{p.planType}</td>
                                    <td className="px-6 py-4 text-white">Rs. {p.price.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-zinc-400">{p.durationDays} days</td>
                                    <td className="px-6 py-4 text-zinc-400">{p.ptSessions}</td>
                                    <td className="px-6 py-4 text-zinc-400">{p.subscribers}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                                            {p.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => openEdit(p)} className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-1">
                                            <Pencil size={14} /> Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Plan' : 'Add Plan'} size="md">
                <div className="space-y-4">
                    <Input id="subscriptions-plan-name" label="Plan Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Premium" required />
                    <Select
                        id="subscriptions-plan-type"
                        label="Plan Type"
                        options={[{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'annual', label: 'Annual' }]}
                        value={form.planType}
                        onChange={e => setForm(f => ({ ...f, planType: e.target.value }))}
                    />
                    <Input id="subscriptions-price" label="Price (Rs.)" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="4500" />
                    <Input id="subscriptions-duration" label="Duration (days)" type="number" value={form.durationDays} onChange={e => setForm(f => ({ ...f, durationDays: e.target.value }))} placeholder="30" />
                    <Input id="subscriptions-pt-sessions" label="Included PT Sessions" type="number" value={form.ptSessions} onChange={e => setForm(f => ({ ...f, ptSessions: e.target.value }))} placeholder="4" />
                    <Select
                        id="subscriptions-active"
                        label="Active"
                        options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
                        value={String(form.active)}
                        onChange={e => setForm(f => ({ ...f, active: e.target.value === 'true' }))}
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setModalOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleSave}>{editing ? 'Save' : 'Add Plan'}</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
