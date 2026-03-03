'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    CreditCard, TrendingUp, Users, Calendar,
    RefreshCw, Star, ArrowUpRight, Clock, CheckCircle2
} from 'lucide-react';
import { subscriptionAPI, reportingAPI, getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';

interface SubscriptionPlan {
    id: string;
    name: string;
    durationDays: number;
    price: string;
    features?: string;
    isActive: boolean;
}

interface UpcomingRenewal {
    memberId: string;
    memberName?: string;
    email?: string;
    planName: string;
    expiresAt: string;
    daysUntilExpiry: number;
}

interface PlanPopularity {
    planId: string;
    planName: string;
    subscriberCount: number;
    revenue: number;
}

const formatCurrency = (amount: number | string): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `Rs. ${new Intl.NumberFormat('en-LK').format(num)}`;
};

export default function ManagerSubscriptionsPage() {
    const toast = useToast();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [renewals, setRenewals] = useState<UpcomingRenewal[]>([]);
    const [popularity, setPopularity] = useState<PlanPopularity[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'renewals'>('overview');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [plansRes, renewalsRes, popularityRes] = await Promise.all([
                subscriptionAPI.getAllPlans().catch(() => ({ data: { data: [] } })),
                subscriptionAPI.getUpcomingRenewals().catch(() => ({ data: { data: [] } })),
                reportingAPI.planPopularity().catch(() => ({ data: { data: [] } })),
            ]);
            setPlans(plansRes.data.data || []);
            setRenewals(renewalsRes.data.data || []);
            setPopularity(popularityRes.data.data || []);
        } catch (e) {
            toast.error('Failed to load subscription data', getErrorMessage(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const activePlans = plans.filter(p => p.isActive);
    const totalSubscribers = popularity.reduce((sum, p) => sum + (p.subscriberCount || 0), 0);
    const totalRevenue = popularity.reduce((sum, p) => sum + (p.revenue || 0), 0);
    const urgentRenewals = renewals.filter(r => r.daysUntilExpiry <= 7).length;

    if (loading) {
        return (
            <div className="space-y-8 page-enter">
                <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64" /></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
            </div>
        );
    }

    return (
        <div className="space-y-8 page-enter">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Subscriptions</h2>
                    <p className="text-zinc-400 mt-1">Monitor subscription plans, renewals, and revenue</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition font-medium"
                >
                    <RefreshCw size={18} /> Refresh
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl border border-zinc-800 bg-black/40">
                    <div className="flex items-center gap-2 mb-2">
                        <CreditCard size={16} className="text-blue-400" />
                        <span className="text-sm text-zinc-400">Active Plans</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{activePlans.length}</div>
                </div>
                <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Users size={16} className="text-emerald-400" />
                        <span className="text-sm text-emerald-400">Subscribers</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">{totalSubscribers}</div>
                </div>
                <div className="p-5 rounded-2xl border border-green-500/20 bg-green-500/5">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-green-400" />
                        <span className="text-sm text-green-400">Total Revenue</span>
                    </div>
                    <div className="text-2xl font-bold text-green-400">{formatCurrency(totalRevenue)}</div>
                </div>
                <div className="p-5 rounded-2xl border border-orange-500/20 bg-orange-500/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-orange-400" />
                        <span className="text-sm text-orange-400">Expiring Soon</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-400">{urgentRenewals}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">within 7 days</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-zinc-900/50 border border-zinc-800 w-fit">
                {(['overview', 'plans', 'renewals'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize',
                            activeTab === t ? 'bg-red-700 text-white' : 'text-zinc-400 hover:text-white'
                        )}
                    >
                        {t === 'overview' ? 'Plan Performance' : t === 'plans' ? `All Plans (${plans.length})` : `Renewals (${renewals.length})`}
                    </button>
                ))}
            </div>

            {/* Overview / Plan Performance */}
            {activeTab === 'overview' && (
                <>
                    {popularity.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-zinc-800 bg-black/30 p-16 text-center">
                            <Star className="mx-auto mb-4 text-zinc-600" size={40} />
                            <h3 className="text-xl font-semibold text-zinc-300">No Subscription Data</h3>
                            <p className="text-zinc-500 mt-2">Plan popularity data will appear once members subscribe.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {popularity.sort((a, b) => b.subscriberCount - a.subscriberCount).map((plan, idx) => {
                                const maxSubscribers = Math.max(...popularity.map(p => p.subscriberCount), 1);
                                const widthPct = (plan.subscriberCount / maxSubscribers) * 100;
                                return (
                                    <div key={plan.planId} className="rounded-2xl border border-zinc-800 bg-black/40 p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm',
                                                    idx === 0 ? 'bg-yellow-500/10 text-yellow-400' :
                                                        idx === 1 ? 'bg-zinc-500/10 text-zinc-300' :
                                                            idx === 2 ? 'bg-orange-500/10 text-orange-400' :
                                                                'bg-zinc-800 text-zinc-500'
                                                )}>
                                                    #{idx + 1}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-white">{plan.planName}</h4>
                                                    <span className="text-xs text-zinc-500">{plan.subscriberCount} subscribers</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-green-400">{formatCurrency(plan.revenue)}</div>
                                                <span className="text-xs text-zinc-500">revenue</span>
                                            </div>
                                        </div>
                                        {/* Progress bar */}
                                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-linear-to-r from-red-600 to-red-500 rounded-full transition-all duration-700"
                                                style={{ width: `${widthPct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* All Plans */}
            {activeTab === 'plans' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plans.length === 0 ? (
                        <div className="col-span-full rounded-2xl border border-dashed border-zinc-800 bg-black/30 p-16 text-center">
                            <CreditCard className="mx-auto mb-4 text-zinc-600" size={40} />
                            <h3 className="text-xl font-semibold text-zinc-300">No Plans Available</h3>
                        </div>
                    ) : (
                        plans.map(plan => (
                            <div key={plan.id} className={cn(
                                'rounded-2xl border p-5 transition-all',
                                plan.isActive ? 'border-zinc-800 bg-black/40 hover:border-zinc-700' : 'border-zinc-800/50 bg-black/20 opacity-60'
                            )}>
                                <div className="flex items-start justify-between mb-3">
                                    <h4 className="font-semibold text-white text-lg">{plan.name}</h4>
                                    <span className={cn(
                                        'px-2 py-0.5 rounded-full text-xs font-medium border',
                                        plan.isActive
                                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                            : 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20'
                                    )}>
                                        {plan.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="text-3xl font-bold text-white mb-1">{formatCurrency(plan.price)}</div>
                                <div className="text-sm text-zinc-500 mb-4">
                                    {plan.durationDays} days
                                </div>
                                {plan.features && (
                                    <div className="pt-3 border-t border-zinc-800">
                                        <div className="text-xs text-zinc-500 space-y-1">
                                            {plan.features.split(',').map((feat, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                                    <span className="text-zinc-400">{feat.trim()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Upcoming Renewals */}
            {activeTab === 'renewals' && (
                <>
                    {renewals.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-zinc-800 bg-black/30 p-16 text-center">
                            <Calendar className="mx-auto mb-4 text-zinc-600" size={40} />
                            <h3 className="text-xl font-semibold text-zinc-300">No Upcoming Renewals</h3>
                            <p className="text-zinc-500 mt-2">Upcoming renewal data will appear here.</p>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-zinc-800 bg-black/40 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-zinc-900/50 text-zinc-400 text-xs uppercase">
                                        <tr>
                                            <th className="px-6 py-4">Member</th>
                                            <th className="px-6 py-4">Plan</th>
                                            <th className="px-6 py-4">Expires</th>
                                            <th className="px-6 py-4">Days Left</th>
                                            <th className="px-6 py-4">Urgency</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/50">
                                        {renewals.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry).map((renewal, i) => (
                                            <tr key={i} className="hover:bg-zinc-900/30">
                                                <td className="px-6 py-3">
                                                    <div className="font-medium text-white">{renewal.memberName || renewal.memberId.slice(0, 8)}</div>
                                                    {renewal.email && <div className="text-xs text-zinc-500">{renewal.email}</div>}
                                                </td>
                                                <td className="px-6 py-3 text-zinc-300">{renewal.planName}</td>
                                                <td className="px-6 py-3 text-zinc-400">
                                                    {new Date(renewal.expiresAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-3 text-white font-medium">{renewal.daysUntilExpiry}d</td>
                                                <td className="px-6 py-3">
                                                    <span className={cn(
                                                        'px-2.5 py-1 rounded-full text-xs font-medium border',
                                                        renewal.daysUntilExpiry <= 3
                                                            ? 'text-red-400 bg-red-500/10 border-red-500/20'
                                                            : renewal.daysUntilExpiry <= 7
                                                                ? 'text-orange-400 bg-orange-500/10 border-orange-500/20'
                                                                : renewal.daysUntilExpiry <= 14
                                                                    ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                                                                    : 'text-green-400 bg-green-500/10 border-green-500/20'
                                                    )}>
                                                        {renewal.daysUntilExpiry <= 3 ? 'Critical' :
                                                            renewal.daysUntilExpiry <= 7 ? 'Urgent' :
                                                                renewal.daysUntilExpiry <= 14 ? 'Soon' : 'Normal'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
