"use client";

import { Check, CreditCard, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
    {
        name: "Basic",
        price: "$29",
        features: ["Access to gym floor", "Locker usage", "Free WiFi"],
        current: false,
        color: "zinc"
    },
    {
        name: "Premium",
        price: "$49",
        features: ["All Basic features", "Unlimited Group Classes", "Sauna access", "Guest pass (1/mo)"],
        current: true, // Intentionally using uppercase for visual pop in my mind, but valid JS is true. I'll fix case.
        isPopular: true,
        color: "indigo"
    },
    {
        name: "Elite",
        price: "$89",
        features: ["All Premium features", "Personal Training (2x/mo)", "Nutrition Plan", "Private Locker"],
        current: false,
        color: "purple"
    }
];

export default function SubscriptionPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold text-white">My Plan</h2>
                <p className="text-zinc-400 mt-1">Manage your membership and unlock more perks</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                {plans.map((plan) => (
                    <div
                        key={plan.name}
                        className={cn(
                            "relative p-8 rounded-3xl border backdrop-blur-md transition-all duration-300 flex flex-col h-full",
                            plan.current
                                ? "bg-black/80 border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-105 z-10"
                                : "bg-black/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40"
                        )}
                    >
                        {plan.isPopular && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-xs font-bold text-white uppercase tracking-wide shadow-lg">
                                Most Popular
                            </div>
                        )}

                        <div className="mb-8">
                            <h3 className={cn("text-lg font-bold mb-2", plan.current ? "text-white" : "text-zinc-300")}>
                                {plan.name}
                            </h3>
                            <div className="flex items-baseline gap-1">
                                <span className={cn("text-4xl font-bold", plan.current ? "text-white" : "text-zinc-200")}>{plan.price}</span>
                                <span className="text-sm text-zinc-500">/month</span>
                            </div>
                            {plan.current && (
                                <div className="mt-4 py-2 px-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold flex items-center justify-center gap-2">
                                    <Check size={16} /> Current Plan
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 mb-8 flex-1">
                            {plan.features.map((feature) => (
                                <div key={feature} className="flex items-start gap-3">
                                    <div className={cn(
                                        "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                        plan.current ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-400"
                                    )}>
                                        <Check size={12} />
                                    </div>
                                    <span className={cn("text-sm", plan.current ? "text-zinc-200" : "text-zinc-400")}>
                                        {feature}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <button
                            className={cn(
                                "w-full py-3.5 rounded-xl font-bold transition-all",
                                plan.current
                                    ? "bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700"
                                    : "bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/5"
                            )}
                            disabled={plan.current}
                        >
                            {plan.current ? "Active" : "Upgrade"}
                        </button>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
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
