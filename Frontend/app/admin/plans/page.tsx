'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Plus, Edit2, Check } from 'lucide-react';
import {
    PageHeader,
    Card,
    LoadingButton,
    Modal,
    Input,
    Textarea,
    Select,
} from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

interface Plan {
    id: string;
    name: string;
    price: number | string;
    billing: 'monthly' | 'annual' | 'daily_pass' | 'other';
    features: string[];
    members: number;
    active: boolean;
    durationDays: number;
    planType: 'individual' | 'couple' | 'student' | 'corporate' | 'daily_pass';
}

const BILLING_OPTIONS = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'annual', label: 'Annual' },
];

export default function AdminPlansPage() {
    const toast = useToast();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        billing: 'monthly' as 'monthly' | 'annual',
        features: '',
        planType: 'individual' as 'individual' | 'couple' | 'student' | 'corporate' | 'daily_pass',
        includedPtSessions: '0',
    });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    const loadPlans = async () => {
        const data = await opsAPI.plans({ includeInactive: true });
        const mapped: Plan[] = (data ?? []).map((p: any) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price ?? 0),
            billing: Number(p.durationDays) >= 360 ? 'annual' : Number(p.durationDays) <= 1 ? 'daily_pass' : 'monthly',
            features: p.description ? String(p.description).split('\n').map((line: string) => line.trim()).filter(Boolean) : ['Gym Access'],
            members: p.activeSubscribers ?? 0,
            active: !!p.isActive,
            durationDays: Number(p.durationDays ?? 30),
            planType: p.planType ?? 'individual',
        }));
        setPlans(mapped);
    };

    useEffect(() => {
        loadPlans()
            .catch((err) => toast.error('Failed to load plans', getErrorMessage(err)))
            .finally(() => setPageLoading(false));
    }, []);

    const openAdd = () => {
        setEditingPlan(null);
        setFormData({ name: '', price: '', billing: 'monthly', features: '', planType: 'individual', includedPtSessions: '0' });
        setModalOpen(true);
    };

    const openEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name,
            price: String(plan.price),
            billing: plan.durationDays >= 360 ? 'annual' : 'monthly',
            features: plan.features.join('\n'),
            planType: plan.planType ?? 'individual',
            includedPtSessions: '0',
        });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error('Validation Error', 'Plan name is required');
            return;
        }
        const price = parseInt(formData.price, 10);
        if (isNaN(price) || price < 0) {
            toast.error('Validation Error', 'Please enter a valid price');
            return;
        }
        setSubmitLoading(true);
        try {
            const features = formData.features.split('\n').map(f => f.trim()).filter(Boolean);
            if (editingPlan) {
                await opsAPI.updatePlan(editingPlan.id, {
                    name: formData.name.trim(),
                    price,
                    durationDays: formData.billing === 'annual' ? 365 : 30,
                });
                toast.success('Plan Updated', `${formData.name} has been updated successfully`);
            } else {
                await opsAPI.createPlan({
                    name: formData.name.trim(),
                    description: features.join('\n'),
                    planType: formData.planType,
                    price,
                    durationDays: formData.billing === 'annual' ? 365 : formData.planType === 'daily_pass' ? 1 : 30,
                    includedPtSessions: Number(formData.includedPtSessions) || 0,
                });
                toast.success('Plan Created', `${formData.name} has been added successfully`);
            }
            await loadPlans();
            setModalOpen(false);
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setSubmitLoading(false);
        }
    };

    const toggleActive = async (id: string) => {
        const plan = plans.find(p => p.id === id);
        if (!plan) return;
        try {
            await opsAPI.updatePlan(id, { isActive: !plan.active });
            await loadPlans();
            toast.success(plan.active ? 'Plan Disabled' : 'Plan Enabled', `${plan.name} has been ${plan.active ? 'disabled' : 'enabled'}`);
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="Subscription Plans"
                subtitle="Manage membership plans for PowerWorld Kiribathgoda"
                action={
                    <LoadingButton icon={Plus} onClick={openAdd} size="md">
                        Add Plan
                    </LoadingButton>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {plans.map(plan => (
                    <Card
                        key={plan.id}
                        padding="md"
                        className={`transition-all hover:border-zinc-700/50 ${!plan.active ? 'opacity-60 border-zinc-800/50' : ''}`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="text-white font-bold text-lg">{plan.name}</p>
                                <p className="text-zinc-500 text-xs capitalize">{plan.billing} billing</p>
                            </div>
                            <div className="text-right">
                                <p className="text-white font-bold">Rs.{Number(plan.price).toLocaleString()}</p>
                                <p className="text-zinc-500 text-xs">/ {plan.durationDays >= 360 ? 'year' : 'month'}</p>
                            </div>
                        </div>
                        <ul className="space-y-1 mb-4">
                            {plan.features.map((f, i) => (
                                <li key={i} className="flex items-center gap-2 text-zinc-400 text-xs">
                                    <Check size={12} className="text-red-500 flex-shrink-0" /> {f}
                                </li>
                            ))}
                        </ul>
                        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                            <span className="text-zinc-500 text-xs">{plan.members} members</span>
                            <div className="flex gap-2">
                                <LoadingButton
                                    variant="ghost"
                                    size="sm"
                                    icon={Edit2}
                                    onClick={() => openEdit(plan)}
                                />
                                <button
                                    onClick={() => { toggleActive(plan.id).catch(() => undefined); }}
                                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${plan.active
                                        ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30'
                                        : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30'
                                        }`}
                                >
                                    {plan.active ? 'Disable' : 'Enable'}
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {plans.length === 0 && (
                <Card padding="md">
                    <p className="text-zinc-500 text-sm text-center">{pageLoading ? 'Loading plans...' : 'No plans found.'}</p>
                </Card>
            )}

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingPlan ? 'Edit Plan' : 'Add New Plan'}
                description={editingPlan ? `Editing ${editingPlan.name}` : 'Create a new subscription plan'}
                size="md"
            >
                <div className="space-y-4">
                    <Input
                        id="plan-name"
                        label="Plan Name"
                        placeholder="e.g. Premium"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                    />
                    <Input
                        id="plan-price"
                        label="Price (Rs.)"
                        type="number"
                        placeholder="3500"
                        value={formData.price}
                        onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        min={0}
                    />
                    <Select
                        id="plan-billing"
                        label="Billing Period"
                        options={BILLING_OPTIONS}
                        value={formData.billing}
                        onChange={e => setFormData(prev => ({ ...prev, billing: e.target.value as 'monthly' | 'annual' }))}
                    />
                    {!editingPlan && (
                        <>
                            <Select
                                label="Plan Type"
                                options={[
                                    { value: 'individual', label: 'Individual' },
                                    { value: 'couple', label: 'Couple' },
                                    { value: 'student', label: 'Student' },
                                    { value: 'corporate', label: 'Corporate' },
                                    { value: 'daily_pass', label: 'Daily Pass' },
                                ]}
                                value={formData.planType}
                                onChange={e => setFormData(prev => ({ ...prev, planType: e.target.value as typeof formData.planType }))}
                            />
                            <Input
                                label="Included PT Sessions"
                                type="number"
                                value={formData.includedPtSessions}
                                onChange={e => setFormData(prev => ({ ...prev, includedPtSessions: e.target.value }))}
                                min="0"
                            />
                        </>
                    )}
                    <Textarea
                        label="Features (one per line)"
                        placeholder={'Gym Access\nLocker Room\nFree Wi-Fi'}
                        value={formData.features}
                        onChange={e => setFormData(prev => ({ ...prev, features: e.target.value }))}
                        rows={4}
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </LoadingButton>
                        <LoadingButton loading={submitLoading} onClick={handleSubmit}>
                            {editingPlan ? 'Save Changes' : 'Create Plan'}
                        </LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
