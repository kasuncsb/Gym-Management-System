'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { PageHeader, Card, Modal, Input, Select, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

interface Plan {
    id: string;
    name: string;
    planType: string;
    price: number;
    durationDays: number;
    active: boolean;
    subscribers: number;
}

interface SubRow {
    id: string;
    memberId: string;
    memberName: string;
    memberCode?: string;
    planId: string;
    planName: string;
    planType: string;
    status: string;
    startDate: string;
    endDate: string;
    pricePaid: number;
}

const statusStyle: Record<string, string> = {
    active:          'bg-emerald-500/20 text-emerald-400',
    expired:         'bg-zinc-500/20 text-zinc-400',
    cancelled:       'bg-red-500/20 text-red-400',
    grace_period:    'bg-amber-500/20 text-amber-400',
    pending_payment: 'bg-yellow-500/20 text-yellow-400',
};

const PLAN_TYPE_OPTIONS = [
    { value: 'individual', label: 'Individual' },
    { value: 'couple', label: 'Couple' },
    { value: 'student', label: 'Student' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'daily_pass', label: 'Daily Pass' },
];

export default function ManagerSubscriptionsPage() {
    const toast = useToast();
    const [tab, setTab] = useState<'plans' | 'subscriptions'>('plans');
    const [plans, setPlans] = useState<Plan[]>([]);
    const [subs, setSubs] = useState<SubRow[]>([]);
    const [subsFilter, setSubsFilter] = useState<string>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        planType: 'individual',
        price: '',
        durationDays: '',
        active: true,
    });

    const loadPlans = async () => {
        const [rows, allSubs] = await Promise.all([
            opsAPI.plans({ includeInactive: true }),
            opsAPI.allSubscriptions(),
        ]);

        const subCounts = new Map<string, number>();
        (allSubs ?? []).forEach((s: any) => {
            if (s.status === 'active' || s.status === 'grace_period') {
                subCounts.set(s.planId, (subCounts.get(s.planId) ?? 0) + 1);
            }
        });

        setPlans((rows ?? []).map((p: any) => ({
            id: p.id,
            name: p.name,
            planType: p.planType,
            price: Number(p.price ?? 0),
            durationDays: Number(p.durationDays ?? 0),
            active: !!p.isActive,
            subscribers: subCounts.get(p.id) ?? 0,
        })));

        setSubs((allSubs ?? []).map((s: any) => ({
            id: s.id,
            memberId: s.memberId,
            memberName: s.memberName ?? s.memberId,
            memberCode: s.memberCode,
            planId: s.planId,
            planName: s.planName ?? '—',
            planType: s.planType ?? '—',
            status: s.status,
            startDate: String(s.startDate).slice(0, 10),
            endDate: String(s.endDate).slice(0, 10),
            pricePaid: Number(s.pricePaid ?? 0),
        })));
    };

    useEffect(() => {
        loadPlans().catch(err => toast.error('Failed to load subscriptions', getErrorMessage(err)));
    }, []);

    const openAdd = () => {
        setEditing(null);
        setForm({ name: '', planType: 'individual', price: '', durationDays: '', active: true });
        setModalOpen(true);
    };

    const openEdit = (p: Plan) => {
        setEditing(p);
        setForm({
            name: p.name,
            planType: p.planType,
            price: String(p.price),
            durationDays: String(p.durationDays),
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
                    planType: form.planType as 'individual' | 'couple' | 'student' | 'corporate' | 'daily_pass',
                    price: Number(form.price),
                    durationDays: Number(form.durationDays),
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

    const filteredSubs = subsFilter === 'all' ? subs : subs.filter(s => s.status === subsFilter);

    return (
        <div className="space-y-8">
            <PageHeader
                title="Subscriptions"
                subtitle="Manage plans and member subscriptions for GymSphere"
                action={tab === 'plans' ? (
                    <LoadingButton icon={Plus} onClick={openAdd} size="md">Add Plan</LoadingButton>
                ) : undefined}
            />

            <div className="flex gap-2">
                {(['plans', 'subscriptions'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-red-600 text-white' : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'}`}>
                        {t === 'plans' ? 'Subscription Plans' : 'All Subscriptions'}
                    </button>
                ))}
            </div>

            {tab === 'plans' && (
                <Card padding="none">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-700">
                                    <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Plan</th>
                                    <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Type</th>
                                    <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Price</th>
                                    <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Duration</th>
                                    <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Active Subs</th>
                                    <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Status</th>
                                    <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plans.map(p => (
                                    <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                        <td className="px-6 py-4 text-white font-semibold">{p.name}</td>
                                        <td className="px-6 py-4 text-zinc-400 capitalize">{p.planType.replace('_', ' ')}</td>
                                        <td className="px-6 py-4 text-white">${p.price.toLocaleString('en-US')}</td>
                                        <td className="px-6 py-4 text-zinc-400">{p.durationDays} days</td>
                                        <td className="px-6 py-4 text-zinc-300 font-semibold">{p.subscribers}</td>
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
                                {plans.length === 0 && (
                                    <tr><td colSpan={7} className="px-6 py-10 text-center text-zinc-500">No plans yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {tab === 'subscriptions' && (
                <div className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                        {(['all', 'active', 'pending_payment', 'expired', 'cancelled', 'grace_period'] as const).map(f => (
                            <button key={f} onClick={() => setSubsFilter(f)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${subsFilter === f ? 'bg-red-600 text-white border border-red-500' : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'}`}>
                                {f.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    <Card padding="none">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-zinc-700">
                                        <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-5 py-4">Member</th>
                                        <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-5 py-4">Plan</th>
                                        <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-5 py-4">Status</th>
                                        <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-5 py-4">Start</th>
                                        <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-5 py-4">End</th>
                                        <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-5 py-4">Paid</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSubs.map(s => (
                                        <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                            <td className="px-5 py-3">
                                                <p className="text-white font-semibold text-sm">{s.memberName}</p>
                                                {s.memberCode && <p className="text-zinc-600 text-xs">{s.memberCode}</p>}
                                            </td>
                                            <td className="px-5 py-3 text-zinc-300 text-sm">{s.planName}</td>
                                            <td className="px-5 py-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${statusStyle[s.status] ?? 'bg-zinc-500/20 text-zinc-400'}`}>
                                                    {s.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-zinc-400 text-sm">{s.startDate}</td>
                                            <td className="px-5 py-3 text-zinc-400 text-sm">{s.endDate}</td>
                                            <td className="px-5 py-3 text-zinc-300 text-sm">${s.pricePaid.toLocaleString('en-US')}</td>
                                        </tr>
                                    ))}
                                    {filteredSubs.length === 0 && (
                                        <tr><td colSpan={6} className="px-6 py-10 text-center text-zinc-500">No subscriptions found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Plan' : 'Add Plan'} size="md">
                <div className="space-y-4">
                    <Input id="subscriptions-plan-name" label="Plan Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Premium" required />
                    {!editing && (
                        <Select
                            id="subscriptions-plan-type"
                            label="Plan Type"
                            options={PLAN_TYPE_OPTIONS}
                            value={form.planType}
                            onChange={e => setForm(f => ({ ...f, planType: e.target.value }))}
                        />
                    )}
                    <Input id="subscriptions-price" label="Price (USD)" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="50" />
                    <Input id="subscriptions-duration" label="Duration (days)" type="number" value={form.durationDays} onChange={e => setForm(f => ({ ...f, durationDays: e.target.value }))} placeholder="30" />
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
