"use client";

import { useEffect, useState } from "react";
import { managerAPI, subscriptionAPI } from "@/lib/api";
import { Loader2, TrendingUp, Users, Wallet, CalendarCheck } from "lucide-react";

export default function ManagerInsightsPage() {
    const [metrics, setMetrics] = useState<any>(null);
    const [renewals, setRenewals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [metricsRes, renewalsRes] = await Promise.all([
                    managerAPI.getMetrics(),
                    subscriptionAPI.getUpcomingRenewals(),
                ]);
                setMetrics(metricsRes.data.data);
                setRenewals(renewalsRes.data.data || []);
            } catch (error) {
                console.error("Failed to load manager insights:", error);
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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
                <h1 className="text-3xl font-bold text-white">Branch Insights</h1>
                <p className="text-zinc-400 mt-1">Operational performance across revenue, members, and attendance.</p>
            </header>

            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-6">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase">
                        <Wallet size={14} />
                        Revenue (Month)
                    </div>
                    <p className="text-2xl font-bold text-white mt-3">Rs. {metrics?.revenue?.currentMonth || 0}</p>
                    <p className="text-xs text-emerald-400 mt-1">{metrics?.revenue?.growth || "0%"} vs last month</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-6">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase">
                        <Users size={14} />
                        Active Members
                    </div>
                    <p className="text-2xl font-bold text-white mt-3">{metrics?.members?.active || 0}</p>
                    <p className="text-xs text-zinc-500 mt-1">New this month: {metrics?.members?.newThisMonth || 0}</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-6">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase">
                        <CalendarCheck size={14} />
                        Attendance Today
                    </div>
                    <p className="text-2xl font-bold text-white mt-3">{metrics?.attendance?.today || 0}</p>
                    <p className="text-xs text-zinc-500 mt-1">Check-ins logged</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-6">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase">
                        <TrendingUp size={14} />
                        Active Subscriptions
                    </div>
                    <p className="text-2xl font-bold text-white mt-3">{metrics?.subscriptions?.active || 0}</p>
                    <p className="text-xs text-zinc-500 mt-1">Staff on duty: {metrics?.staff?.onDuty || 0}</p>
                </div>
            </div>

            <section className="rounded-2xl border border-zinc-800 bg-black/40 backdrop-blur-md overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Upcoming Renewals</h2>
                    <span className="text-xs text-zinc-500">{renewals.length} members</span>
                </div>
                {renewals.length === 0 ? (
                    <div className="p-10 text-center text-zinc-500">No renewals scheduled in the next week.</div>
                ) : (
                    <div className="divide-y divide-zinc-800">
                        {renewals.map((renewal) => (
                            <div key={renewal.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4">
                                <div>
                                    <p className="text-sm font-semibold text-white">{renewal.member?.name || "Member"}</p>
                                    <p className="text-xs text-zinc-500">Plan: {renewal.plan?.name || "Subscription"}</p>
                                </div>
                                <p className="text-xs text-zinc-400">
                                    Renew by {new Date(renewal.endDate).toLocaleDateString("en-LK")}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
