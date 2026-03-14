'use client';

import { useState } from 'react';
import { CreditCard, Plus, Edit2, X, Check } from 'lucide-react';

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
    { id: 1, name: 'Basic',       price: 2900,  billing: 'monthly', members: 456, active: true,  features: ['Gym Access', 'Locker Room', 'Basic Equipment'] },
    { id: 2, name: 'Premium',     price: 4900,  billing: 'monthly', members: 389, active: true,  features: ['Everything in Basic', '2 Personal Training Sessions/mo', 'Nutrition Guidance', 'Priority Booking'] },
    { id: 3, name: 'Elite',       price: 7900,  billing: 'monthly', members: 244, active: true,  features: ['Everything in Premium', 'Unlimited Personal Training', 'Body Composition Analysis', '24/7 Access'] },
    { id: 4, name: 'Annual Basic',price: 29900, billing: 'annual',  members: 123, active: true,  features: ['Basic Plan Features', '2 Months Free', 'Membership Card'] },
];

export default function AdminPlansPage() {
    const [plans, setPlans] = useState<Plan[]>(initialPlans);
    const [showAdd, setShowAdd] = useState(false);

    const toggleActive = (id: number) => setPlans(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                        <CreditCard size={28} className="text-green-400" /> Subscription Plans
                    </h1>
                    <p className="text-zinc-400">Manage membership plans for PowerWorld Kiribathgoda</p>
                </div>
                <button onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-all">
                    <Plus size={16} /> Add Plan
                </button>
            </div>

            {/* Plans grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {plans.map(plan => (
                    <div key={plan.id} className={`bg-zinc-900/50 border rounded-2xl p-5 transition-all ${plan.active ? 'border-zinc-800' : 'border-zinc-800/30 opacity-50'}`}>
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
                                    <Check size={12} className="text-green-500 flex-shrink-0" /> {f}
                                </li>
                            ))}
                        </ul>
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-500 text-xs">{plan.members} members</span>
                            <div className="flex gap-2">
                                <button className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-all">
                                    <Edit2 size={14} />
                                </button>
                                <button onClick={() => toggleActive(plan.id)}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${plan.active ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'}`}>
                                    {plan.active ? 'Disable' : 'Enable'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add plan modal */}
            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
                    <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md mx-4">
                        <div className="flex justify-between mb-5">
                            <h2 className="text-white font-bold text-lg">Add New Plan</h2>
                            <button onClick={() => setShowAdd(false)} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            {['Plan Name', 'Price (Rs.)', 'Billing Period', 'Features (one per line)'].map(label => (
                                <div key={label}>
                                    <label className="block text-sm text-zinc-400 mb-1">{label}</label>
                                    {label === 'Features (one per line)' ? (
                                        <textarea rows={3} className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 resize-none" />
                                    ) : label === 'Billing Period' ? (
                                        <select className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500">
                                            <option>monthly</option><option>annual</option>
                                        </select>
                                    ) : (
                                        <input type={label.includes('Price') ? 'number' : 'text'} className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500" />
                                    )}
                                </div>
                            ))}
                            <button onClick={() => setShowAdd(false)} className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-all">Create Plan</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
