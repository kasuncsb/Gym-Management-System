"use client";

import { useEffect, useState } from "react";
import { qrAPI, subscriptionAPI } from "@/lib/api";
import { Loader2, Activity, CalendarCheck, Shield } from "lucide-react";

export default function ProgressPage() {
    const [attendance, setAttendance] = useState<any[]>([]);
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [attendanceRes, subscriptionRes] = await Promise.all([
                    qrAPI.getAttendanceHistory(20),
                    subscriptionAPI.getActive(),
                ]);
                setAttendance(attendanceRes.data.data || []);
                setSubscription(subscriptionRes.data.data);
            } catch (error) {
                console.error("Failed to load progress:", error);
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

    const monthlyVisits = attendance.filter((log) => log.direction === "in").length;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
                <h1 className="text-3xl font-bold text-white">Progress Overview</h1>
                <p className="text-zinc-400 mt-1">Track attendance and subscription health in one place.</p>
            </header>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-6">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase">
                        <CalendarCheck size={14} />
                        Recent Visits
                    </div>
                    <p className="text-3xl font-bold text-white mt-3">{monthlyVisits}</p>
                    <p className="text-xs text-zinc-500 mt-1">Check-ins logged recently</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-6">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase">
                        <Shield size={14} />
                        Subscription
                    </div>
                    <p className="text-xl font-semibold text-white mt-3">{subscription?.plan?.name || "No Active Plan"}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                        {subscription?.endDate
                            ? `Expires on ${new Date(subscription.endDate).toLocaleDateString("en-LK")}`
                            : "Activate a plan to unlock full access"}
                    </p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-6">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase">
                        <Activity size={14} />
                        Last Visit
                    </div>
                    <p className="text-xl font-semibold text-white mt-3">
                        {attendance[0]?.timestamp ? new Date(attendance[0].timestamp).toLocaleDateString("en-LK") : "No visits yet"}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">Stay consistent to reach your goals.</p>
                </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 backdrop-blur-md overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800 text-white text-lg font-semibold">
                    Attendance History
                </div>
                {attendance.length === 0 ? (
                    <div className="p-10 text-center text-zinc-500">No attendance history recorded.</div>
                ) : (
                    <div className="divide-y divide-zinc-800">
                        {attendance.map((log: any) => (
                            <div key={log.id} className="flex items-center justify-between px-6 py-4 text-sm text-zinc-300">
                                <span>{log.direction === "in" ? "Check-in" : "Check-out"}</span>
                                <span>{new Date(log.timestamp).toLocaleString("en-LK")}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
