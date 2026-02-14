"use client";

import { useState, useEffect } from "react";
import { Check, CreditCard, Zap, Loader2, Snowflake, Clock, Calendar, Shield, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { publicService, Plan } from "@/lib/api/public.service";
import { subscriptionAPI, getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { SkeletonCard, Skeleton } from "@/components/ui/Skeleton";
import { PageHeader, Badge, Card, ErrorAlert, Modal, LoadingButton } from "@/components/ui/SharedComponents";

const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `Rs. ${new Intl.NumberFormat('en-LK').format(numAmount)}`;
};

const getMonthlyPrice = (plan: Plan): string => {
    const price = typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price;
    const monthlyPrice = plan.durationDays > 0 ? price / (plan.durationDays / 30) : price;
    return formatCurrency(Math.round(monthlyPrice));
};

export default function SubscriptionPage() {
    const toast = useToast();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [activeSub, setActiveSub] = useState<any>(null);
    const [allSubs, setAllSubs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [freezeModal, setFreezeModal] = useState(false);
    const [freezing, setFreezing] = useState(false);
    const [freezeData, setFreezeData] = useState({ start: '', end: '', reason: '' });

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const [plansData, activeRes, subsRes] = await Promise.allSettled([
                publicService.getSubscriptionPlans(),
                subscriptionAPI.getActive(),
                subscriptionAPI.getMySubscriptions(),
            ]);

            if (plansData.status === 'fulfilled') setPlans(plansData.value || []);
            if (activeRes.status === 'fulfilled') setActiveSub(activeRes.value.data.data);
            if (subsRes.status === 'fulfilled') setAllSubs(subsRes.value.data.data || []);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handlePurchase = async (planId: string) => {
        setPurchasing(planId);
        try {
            await subscriptionAPI.purchase(planId, '1');
            toast.success("Subscription purchased!", "Your new plan is now active.");
            await fetchData();
        } catch (err) {
            toast.error("Purchase failed", getErrorMessage(err));
        } finally {
            setPurchasing(null);
        }
    };

    const handleFreeze = async () => {
        if (activeSub! || !freezeData.start || !freezeData.end) return;
        setFreezing(true);
        try {
            await subscriptionAPI.freeze(activeSub.id, freezeData.start, freezeData.end, freezeData.reason);
            toast.success("Subscription frozen", "Your plan has been paused.");
            setFreezeModal(false);
            setFreezeData({ start: '', end: '', reason: '' });
            await fetchData();
        } catch (err) {
            toast.error("Freeze failed", getErrorMessage(err));
        } finally {
            setFreezing(false);
        }
    };

    const handleUnfreeze = async () => {
        if (!activeSub) return;
        try {
            await subscriptionAPI.unfreeze(activeSub.id);
            toast.success("Subscription unfrozen", "Your plan is active again.");
            await fetchData();
        } catch (err) {
            toast.error("Unfreeze failed", getErrorMessage(err));
        }
    };

    const getFeatures = (plan: Plan): string[] => {
        if (Array.isArray(plan.features)) return plan.features;
        if (typeof plan.features === 'string') {
            try { return JSON.parse(plan.features); } catch { return [plan.features]; }
        }
        return ['Access to gym floor', 'Locker usage', 'Free WiFi'];
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge variant="success">Active</Badge>;
            case 'frozen': return <Badge variant="info">Frozen</Badge>;
            case 'grace_period': return <Badge variant="warning">Grace Period</Badge>;
            case 'expired': return <Badge variant="error">Expired</Badge>;
            case 'pending': return <Badge variant="default">Pending</Badge>;
            default: return <Badge variant="default">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 page-enter">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 page-enter">
            <PageHeader
                title="My Plan"
                subtitle="Manage your membership and explore available plans"
                badge={activeSub ? activeSub.status : undefined}
                badgeColor={activeSub?.status === 'active' ? 'green' : 'amber'}
            />

            {error && <ErrorAlert message={error} onRetry={fetchData} />}

            {/* Active Subscription Card */}
            {activeSub && (
                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                                    <CreditCard className="text-red-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{activeSub.planName || 'Current Plan'}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        {getStatusBadge(activeSub.status)}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-zinc-500">Start Date</p>
                                    <p className="text-zinc-200 font-medium">
                                        {activeSub.startDate ? new Date(activeSub.startDate).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-zinc-500">End Date</p>
                                    <p className="text-zinc-200 font-medium">
                                        {activeSub.endDate ? new Date(activeSub.endDate).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                                {activeSub.personalTrainingSessions !== undefined && (
                                    <div>
                                        <p className="text-zinc-500">PT Sessions</p>
                                        <p className="text-zinc-200 font-medium">
                                            {activeSub.personalTrainingSessionsUsed || 0} / {activeSub.personalTrainingSessions || 0}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {activeSub.status === 'active' && (
                                <LoadingButton
                                    variant="secondary"
                                    size="sm"
                                    icon={Snowflake}
                                    onClick={() => setFreezeModal(true)}
                                >
                                    Freeze Plan
                                </LoadingButton>
                            )}
                            {activeSub.status === 'frozen' && (
                                <LoadingButton
                                    variant="primary"
                                    size="sm"
                                    icon={Zap}
                                    onClick={handleUnfreeze}
                                >
                                    Unfreeze
                                </LoadingButton>
                            )}
                        </div>
                    </div>
                </Card>
            )}

            {/* Available Plans */}
            <div>
                <h3 className="text-lg font-bold text-white mb-4">
                    {activeSub ? 'Available Plans' : 'Choose a Plan'}
                </h3>
                {plans.length === 0 ? (
                    <Card className="text-center py-12">
                        <CreditCard className="mx-auto text-zinc-600 mb-3" size={32} />
                        <p className="text-zinc-400">No plans available at the moment</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-in">
                        {plans.map((plan) => {
                            const isCurrent = activeSub?.planId === plan.id;
                            const features = getFeatures(plan);
                            return (
                                <div
                                    key={plan.id}
                                    className={cn(
                                        "relative rounded-2xl border p-6 transition-all duration-300 hover:border-zinc-600",
                                        isCurrent
                                            ? "bg-red-950/20 border-red-600/30 ring-1 ring-red-600/20"
                                            : "bg-zinc-900/50 border-zinc-800"
                                    )}
                                >
                                    {isCurrent && (
                                        <div className="absolute -top-3 left-6">
                                            <Badge variant="success" size="md">Current Plan</Badge>
                                        </div>
                                    )}
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                                            <p className="text-sm text-zinc-500 mt-1">{plan.durationDays} days</p>
                                        </div>
                                        <div>
                                            <span className="text-3xl font-extrabold text-white">{formatCurrency(plan.price)}</span>
                                            <span className="text-sm text-zinc-500 ml-2">({getMonthlyPrice(plan)}/mo)</span>
                                        </div>
                                        <ul className="space-y-2">
                                            {features.map((feature, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                                                    <Check className="text-emerald-400 mt-0.5 shrink-0" size={14} />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                        {isCurrent! && (
                                            <LoadingButton
                                                onClick={() => handlePurchase(plan.id)}
                                                loading={purchasing === plan.id}
                                                className="w-full"
                                                variant="primary"
                                            >
                                                {purchasing === plan.id ? 'Processing...' : 'Subscribe'}
                                            </LoadingButton>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Subscription History */}
            {allSubs.length > 1 && (
                <div>
                    <h3 className="text-lg font-bold text-white mb-4">Subscription History</h3>
                    <Card padding="none">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-800 text-zinc-500 text-left">
                                        <th className="p-4 font-medium">Plan</th>
                                        <th className="p-4 font-medium">Status</th>
                                        <th className="p-4 font-medium">Start</th>
                                        <th className="p-4 font-medium">End</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allSubs.map((sub: any) => (
                                        <tr key={sub.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors">
                                            <td className="p-4 text-zinc-200 font-medium">{sub.planName || 'Plan'}</td>
                                            <td className="p-4">{getStatusBadge(sub.status)}</td>
                                            <td className="p-4 text-zinc-400">{sub.startDate ? new Date(sub.startDate).toLocaleDateString() : 'N/A'}</td>
                                            <td className="p-4 text-zinc-400">{sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* Freeze Modal */}
            <Modal
                isOpen={freezeModal}
                onClose={() => setFreezeModal(false)}
                title="Freeze Subscription"
                description="Pause your plan temporarily. Your expiry date will be extended by the freeze duration."
                size="sm"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Start Date</label>
                        <input
                            type="date"
                            value={freezeData.start}
                            onChange={(e) => setFreezeData(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">End Date</label>
                        <input
                            type="date"
                            value={freezeData.end}
                            onChange={(e) => setFreezeData(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Reason (optional)</label>
                        <textarea
                            value={freezeData.reason}
                            onChange={(e) => setFreezeData(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder="e.g., Traveling, medical reasons..."
                            rows={2}
                            className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none placeholder-zinc-500"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setFreezeModal(false)}>
                            Cancel
                        </LoadingButton>
                        <LoadingButton
                            loading={freezing}
                            icon={Snowflake}
                            onClick={handleFreeze}
                            disabled={!freezeData.start || !freezeData.end}
                        >
                            Freeze Plan
                        </LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
