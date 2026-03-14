'use client';

import { useState } from 'react';
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

interface Plan {
    id: number;
    name: string;
    price: number;
    billing: 'monthly' | 'annual';
    features: string[];
    members: number;
    active: boolean;
}

const initialPlans: Plan[] = [
    { id: 1, name: 'Basic', price: 2900, billing: 'monthly', members: 456, active: true, features: ['Gym Access', 'Locker Room', 'Basic Equipment'] },
    { id: 2, name: 'Premium', price: 4900, billing: 'monthly', members: 389, active: true, features: ['Everything in Basic', '2 Personal Training Sessions/mo', 'Nutrition Guidance', 'Priority Booking'] },
    { id: 3, name: 'Elite', price: 7900, billing: 'monthly', members: 244, active: true, features: ['Everything in Premium', 'Unlimited Personal Training', 'Body Composition Analysis', '24/7 Access'] },
    { id: 4, name: 'Annual Basic', price: 29900, billing: 'annual', members: 123, active: true, features: ['Basic Plan Features', '2 Months Free', 'Membership Card'] },
];

const BILLING_OPTIONS = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'annual', label: 'Annual' },
];

export default function AdminPlansPage() {
    const toast = useToast();
    const [plans, setPlans] = useState<Plan[]>(initialPlans);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        billing: 'monthly' as 'monthly' | 'annual',
        features: '',
    });
    const [submitLoading, setSubmitLoading] = useState(false);

    const openAdd = () => {
        setEditingPlan(null);
        setFormData({ name: '', price: '', billing: 'monthly', features: '' });
        setModalOpen(true);
    };

    const openEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name,
            price: plan.price.toString(),
            billing: plan.billing,
            features: plan.features.join('\n'),
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
            await new Promise(r => setTimeout(r, 600));
            const features = formData.features.split('\n').map(f => f.trim()).filter(Boolean);
            if (editingPlan) {
                setPlans(prev => prev.map(p => p.id === editingPlan.id
                    ? { ...p, name: formData.name, price, billing: formData.billing, features }
                    : p));
                toast.success('Plan Updated', `${formData.name} has been updated successfully`);
            } else {
                const newPlan: Plan = {
                    id: Math.max(...plans.map(p => p.id), 0) + 1,
                    name: formData.name,
                    price,
                    billing: formData.billing,
                    features: features.length ? features : ['Gym Access'],
                    members: 0,
                    active: true,
                };
                setPlans(prev => [newPlan, ...prev]);
                toast.success('Plan Created', `${formData.name} has been added successfully`);
            }
            setModalOpen(false);
        } catch {
            toast.error('Error', 'Failed to save plan');
        } finally {
            setSubmitLoading(false);
        }
    };

    const toggleActive = (id: number) => {
        setPlans(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
        const plan = plans.find(p => p.id === id);
        if (plan) {
            toast.success(plan.active ? 'Plan Disabled' : 'Plan Enabled', `${plan.name} has been ${plan.active ? 'disabled' : 'enabled'}`);
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
                                <p className="text-white font-bold">Rs.{plan.price.toLocaleString()}</p>
                                <p className="text-zinc-500 text-xs">/ {plan.billing === 'annual' ? 'year' : 'month'}</p>
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
                                    onClick={() => toggleActive(plan.id)}
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

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingPlan ? 'Edit Plan' : 'Add New Plan'}
                description={editingPlan ? `Editing ${editingPlan.name}` : 'Create a new subscription plan'}
                size="md"
            >
                <div className="space-y-4">
                    <Input
                        label="Plan Name"
                        placeholder="e.g. Premium"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                    />
                    <Input
                        label="Price (Rs.)"
                        type="number"
                        placeholder="3500"
                        value={formData.price}
                        onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        min={0}
                    />
                    <Select
                        label="Billing Period"
                        options={BILLING_OPTIONS}
                        value={formData.billing}
                        onChange={e => setFormData(prev => ({ ...prev, billing: e.target.value as 'monthly' | 'annual' }))}
                    />
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
