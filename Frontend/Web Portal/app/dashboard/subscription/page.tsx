"use client";

import { useState, useEffect } from "react";
import { Check, CreditCard, Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { publicService, Plan } from "@/lib/api/public.service";
import { subscriptionAPI } from "@/lib/api";

// Format currency in LKR
const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `Rs. ${new Intl.NumberFormat('en-LK').format(numAmount)}`;
};

// Calculate monthly price from plan
const getMonthlyPrice = (plan: Plan): string => {
    const price = typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price;
    const monthlyPrice = plan.durationDays > 0 ? price / (plan.durationDays / 30) : price;
    return formatCurrency(Math.round(monthlyPrice));
};

const planColors: Record<string, string> = {
    'monthly': 'zinc',
    'annual': 'red',
    'gold': 'purple',
    'default': 'zinc'
};

const getPlanColor = (name: string): string => {
    const lower = name.toLowerCase();
    for (const [key, color] of Object.entries(planColors)) {
        if (lower.includes(key)) return color;
    }
    return planColors.default;
};

export default function SubscriptionPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [plansData, activeSubResponse] = await Promise.all([
                    publicService.getSubscriptionPlans(),
                    subscriptionAPI.getActive().catch(() => null)
                ]);
                setPlans(plansData || []);
                if (activeSubResponse?.data?.data?.planId) {
                    setCurrentPlanId(activeSubResponse.data.data.planId);
                }
            } catch (error) {
                console.error('Failed to fetch plans:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-red-500" size={32} />
            </div>
        );
    }

    const getFeatures = (plan: Plan): string[] => {
        if (Array.isArray(plan.features)) {
            return plan.features;
        }
        if (typeof plan.features === 'string') {
            try {
                return JSON.parse(plan.features);
            } catch {
                return [plan.features];
            }
        }
        return ['Access to gym floor', 'Locker usage', 'Free WiFi'];
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold text-white">My Plan</h2>
                <p className="text-zinc-400 mt-1">Manage your membership and unlock more perks</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                {plans.length === 0 ? (
                    <div className="col-span-full text-center text-zinc-400 py-12">
                        No plans available at the moment.
                    </div>
                ) : (
                    plans.slice(0, 3).map((plan, index) => {
                        const isCurrent = plan.id === currentPlanId;
                        const isPopular = index === 1 || plan.name.toLowerCase().includes('gold');
                        const features = getFeatures(plan);

                        return (
                            <div
                                key={plan.id}
                                className={cn(
                                    "relative p-8 rounded-3xl border backdrop-blur-md transition-all duration-300 flex flex-col h-full",
                                    isCurrent
                                        ? "bg-black/80 border-red-600 shadow-2xl shadow-red-600/20 scale-105 z-10"
                                        : "bg-black/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40"
                                )}
                            >
                                {isPopular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-red-600 to-purple-500 text-xs font-bold text-white uppercase tracking-wide shadow-lg">
                                        Most Popular
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className={cn("text-lg font-bold mb-2", isCurrent ? "text-white" : "text-zinc-300")}>
                                        {plan.name}
                                    </h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className={cn("text-4xl font-bold", isCurrent ? "text-white" : "text-zinc-200")}>
                                            {getMonthlyPrice(plan)}
                                        </span>
                                        <span className="text-sm text-zinc-500">/month</span>
                                    </div>
                                    {isCurrent && (
                                        <div className="mt-4 py-2 px-3 rounded-lg bg-red-600/10 border border-red-600/20 text-red-500 text-sm font-semibold flex items-center justify-center gap-2">
                                            <Check size={16} /> Current Plan
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 mb-8 flex-1">
                                    {features.map((feature, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <div className={cn(
                                                "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                                isCurrent ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
                                            )}>
                                                <Check size={12} />
                                            </div>
                                            <span className={cn("text-sm", isCurrent ? "text-zinc-200" : "text-zinc-400")}>
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    className={cn(
                                        "w-full py-3.5 rounded-xl font-bold transition-all",
                                        isCurrent
                                            ? "bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700"
                                            : "bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/5"
                                    )}
                                    disabled={isCurrent}
                                >
                                    {isCurrent ? "Active" : "Upgrade"}
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-blue-400">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white">Billing History</h4>
                        <p className="text-sm text-zinc-500">View past payments and invoices</p>
                    </div>
                </div>
                <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <Zap size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white">Refer a Friend</h4>
                        <p className="text-sm text-zinc-500">Get 1 month free for every referral</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
