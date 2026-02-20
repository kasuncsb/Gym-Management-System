"use client";

import { useEffect, useState } from "react";
import { subscriptionAPI } from "@/lib/api";
import { Loader2, BadgeCheck } from "lucide-react";

interface Plan {
    id: string;
    name: string;
    description?: string;
    price: string;
    durationDays: number;
    features?: any;
    isActive?: boolean;
}

export default function AdminPlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await subscriptionAPI.getAllPlans();
                setPlans(response.data.data || []);
            } catch (error) {
                console.error("Failed to load plans:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-red-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
                <h1 className="text-3xl font-bold text-white">Subscription Plans</h1>
                <p className="text-zinc-400 mt-1">Manage active offerings and pricing across PowerWorld branches.</p>
            </header>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {plans.length === 0 ? (
                    <div className="col-span-full rounded-2xl border border-dashed border-zinc-800 bg-black/30 p-10 text-center text-zinc-500">
                        No subscription plans found.
                    </div>
                ) : (
                    plans.map((plan) => (
                        <div key={plan.id} className="rounded-2xl border border-zinc-800 bg-black/40 p-6 backdrop-blur-md">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
                                {plan.isActive !== false && <BadgeCheck className="text-emerald-400" size={18} />}
                            </div>
                            <p className="text-sm text-zinc-400 mt-2">{plan.description || "No description available."}</p>
                            <div className="mt-4 flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-white">Rs. {Number(plan.price).toLocaleString()}</span>
                                <span className="text-xs text-zinc-500">/{plan.durationDays} days</span>
                            </div>
                            <div className="mt-4 text-xs text-zinc-500">
                                {(Array.isArray(plan.features) ? plan.features : Object.values(plan.features || {})).slice(0, 3).map((feature: any) => (
                                    <div key={feature} className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                        <span>{String(feature)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
