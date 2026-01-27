"use client";

import { useEffect, useState } from "react";
import { adminAPI, subscriptionAPI } from "@/lib/api";
import { Loader2, TrendingUp, CalendarClock } from "lucide-react";

export default function AdminReportsPage() {
    const [metrics, setMetrics] = useState<any>(null);
    const [renewals, setRenewals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [metricsRes, renewalsRes] = await Promise.all([
                    adminAPI.getMetrics(),
                    subscriptionAPI.getUpcomingRenewals(),
                ]);
                setMetrics(metricsRes.data.data);
                setRenewals(renewalsRes.data.data || []);
            } catch (error) {
                console.error("Failed to load reports:", error);
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
                <h1 className="text-3xl font-bold text-white">Performance Reports</h1>
                <p className="text-zinc-400 mt-1">Membership health, verifications, and renewal outlook.</p>
            </header>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-6">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Total Users</p>
                    <p className="text-3xl font-bold text-white mt-3">{metrics?.users?.total || 0}</p>
                    <p className="text-xs text-zinc-500 mt-2">Across all PowerWorld roles</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-6">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Pending Verifications</p>
                    <p className="text-3xl font-bold text-white mt-3">{metrics?.pendingVerifications || 0}</p>
                    <p className="text-xs text-zinc-500 mt-2">Awaiting document review</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-6">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Equipment Alerts</p>
                    <p className="text-3xl font-bold text-white mt-3">{metrics?.equipmentAlerts || 0}</p>
                    <p className="text-xs text-zinc-500 mt-2">Maintenance required</p>
                </div>
            </div>

            <section className="rounded-2xl border border-zinc-800 bg-black/40 backdrop-blur-md overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CalendarClock size={18} className="text-red-500" />
                        <h2 className="text-lg font-semibold text-white">Upcoming Renewals (7 days)</h2>
                    </div>
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
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <TrendingUp size={14} />
                                    Renew by {new Date(renewal.endDate).toLocaleDateString("en-LK")}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
