"use client";

import { useState, useEffect } from "react";
import { CreditCard, CheckCircle } from "lucide-react";
import { subscriptionAPI, getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader, Card, Badge, LoadingButton } from "@/components/ui/SharedComponents";
import { cn } from "@/lib/utils";

interface Subscription {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    plan?: { name: string; price: string };
}

const formatCurrency = (amount: number) => `Rs. ${new Intl.NumberFormat("en-LK").format(amount)}`;
const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function BillingPage() {
    const toast = useToast();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await subscriptionAPI.getActive();
                setSubscription(res.data?.data || null);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) {
        return (
            <div className="space-y-8 page-enter">
                <div className="space-y-2"><Skeleton className="h-8 w-52" /><Skeleton className="h-4 w-72" /></div>
                <Skeleton className="h-64 rounded-2xl" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><Skeleton className="lg:col-span-2 h-48 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" /></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 page-enter">
            <PageHeader title="Billing & Subscription" subtitle="Manage your plan and payment history" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Current Plan Card */}
                    <div className="p-8 rounded-3xl bg-linear-to-br from-red-900/40 via-black to-black border border-red-600/30 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-700/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-start gap-6">
                            <div>
                                <Badge variant={subscription?.status === "active" ? "error" : "default"} className="mb-4">
                                    <CheckCircle size={12} className="mr-1" /> {subscription?.status || "No Active Plan"}
                                </Badge>
                                <h3 className="text-4xl font-bold text-white mb-2">{subscription?.plan?.name || "No Plan"}</h3>
                                <p className="text-zinc-400 max-w-md">
                                    {subscription ? "Unlimited access to all gym facilities, group classes, and recovery zones." : "Subscribe to a plan to access gym facilities."}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-white">
                                    {subscription?.plan?.price ? formatCurrency(Number(subscription.plan.price)) : "--"}
                                    <span className="text-lg text-zinc-500 font-medium">/mo</span>
                                </p>
                                <p className="text-sm text-zinc-500 mt-1">
                                    {subscription?.endDate ? <>Next billing: <span className="text-white">{formatDate(subscription.endDate)}</span></> : "No active subscription"}
                                </p>
                            </div>
                        </div>
                        <div className="relative z-10 mt-8 flex flex-wrap gap-4">
                            <LoadingButton
                                onClick={() => toast.info("Coming soon", "Plan upgrades will be available in a future update.")}
                                className="bg-white text-black hover:bg-zinc-200 font-bold shadow-lg shadow-white/10"
                            >
                                Upgrade Plan
                            </LoadingButton>
                            {subscription && (
                                <LoadingButton
                                    variant="secondary"
                                    onClick={() => toast.info("Coming soon", "Subscription cancellation will be available in a future update.")}
                                >
                                    Cancel Subscription
                                </LoadingButton>
                            )}
                        </div>
                    </div>

                    {/* Payment Method */}
                    <Card>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white">Payment Method</h3>
                            <button
                                onClick={() => toast.info("Coming soon", "Payment methods will be available in a future update.")}
                                className="text-sm text-red-500 hover:text-red-400 font-medium"
                            >
                                Add
                            </button>
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
                    </Card>
                </div>

                {/* Invoice History */}
                <div className="lg:col-span-1">
                    <Card className="h-full flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-6">Billing History</h3>
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-sm text-zinc-500 text-center py-8">No billing history available yet.</p>
                        </div>
                        <button
                            onClick={() => toast.info("Coming soon", "Invoice history will be available in a future update.")}
                            className="w-full mt-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-white border border-zinc-800 rounded-xl hover:bg-zinc-800 transition"
                        >
                            View All Invoices
                        </button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
