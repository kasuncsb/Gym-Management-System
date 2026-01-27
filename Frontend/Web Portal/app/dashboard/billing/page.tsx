"use client";

import { useState, useEffect } from "react";
import { CreditCard, Download, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { subscriptionAPI } from "@/lib/api";

interface Subscription {
    id: string;
    planName: string;
    status: string;
    startDate: string;
    endDate: string;
    amount?: number;
}

// Format currency in LKR
const formatCurrency = (amount: number): string => {
    return `Rs. ${new Intl.NumberFormat('en-LK').format(amount)}`;
};

// Format date
const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function BillingPage() {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubscription = async () => {
            try {
                const response = await subscriptionAPI.getActive();
                if (response.data?.data) {
                    setSubscription(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch subscription:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSubscription();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-indigo-400" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white">Billing & Subscription</h2>
                <p className="text-zinc-400 mt-1">Manage your plan and payment history</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Current Plan Card */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-900/40 via-black to-black border border-indigo-500/30 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-start gap-6">
                            <div>
                                <div className={cn(
                                    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-4",
                                    subscription?.status === 'active'
                                        ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-400"
                                        : "bg-zinc-500/20 border border-zinc-500/30 text-zinc-400"
                                )}>
                                    <CheckCircle size={12} /> {subscription?.status || 'No Active Plan'}
                                </div>
                                <h3 className="text-4xl font-bold text-white mb-2">
                                    {subscription?.planName || 'No Plan'}
                                </h3>
                                <p className="text-zinc-400 max-w-md">
                                    {subscription
                                        ? "Unlimited access to all gym facilities, group classes, and recovery zones."
                                        : "Subscribe to a plan to access gym facilities."}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-white">
                                    {subscription?.amount ? formatCurrency(subscription.amount) : '--'}
                                    <span className="text-lg text-zinc-500 font-medium">/mo</span>
                                </p>
                                <p className="text-sm text-zinc-500 mt-1">
                                    {subscription?.endDate
                                        ? <>Next billing: <span className="text-white">{formatDate(subscription.endDate)}</span></>
                                        : 'No active subscription'}
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 mt-8 flex flex-wrap gap-4">
                            <button className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition shadow-lg shadow-white/10">
                                Upgrade Plan
                            </button>
                            {subscription && (
                                <button className="px-6 py-3 bg-black/40 border border-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-800 transition">
                                    Cancel Subscription
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Payment Method Placeholder */}
                    <div className="p-6 rounded-2xl bg-black/40 border border-zinc-800 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white">Payment Method</h3>
                            <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">Add</button>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                            <div className="w-12 h-8 rounded bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                <CreditCard size={18} className="text-zinc-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-medium">No payment method on file</p>
                                <p className="text-xs text-zinc-500">Add a payment method to auto-renew</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Invoice History */}
                <div className="lg:col-span-1">
                    <div className="p-6 rounded-2xl bg-black/40 border border-zinc-800 backdrop-blur-md h-full">
                        <h3 className="text-lg font-bold text-white mb-6">Billing History</h3>
                        <div className="space-y-4">
                            <div className="text-sm text-zinc-400 text-center py-8">
                                No billing history available yet.
                            </div>
                        </div>
                        <button className="w-full mt-6 py-2.5 text-sm font-medium text-zinc-400 hover:text-white border border-zinc-800 rounded-xl hover:bg-zinc-800 transition">
                            View All Invoices
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
