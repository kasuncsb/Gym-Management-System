"use client";

import { useEffect, useState } from "react";
import { adminAPI, qrAPI } from "@/lib/api";
import { Loader2, ShieldCheck, ShieldAlert, Clock } from "lucide-react";

interface AccessLog {
    id: string;
    isAuthorized: boolean;
    direction?: string;
    memberName?: string;
    timestamp: string;
    gateId?: string;
}

export default function AdminActivitiesPage() {
    const [logs, setLogs] = useState<AccessLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [metricsRes, logsRes] = await Promise.all([
                    adminAPI.getMetrics(),
                    qrAPI.getAccessLogs(undefined, undefined, undefined, 50),
                ]);
                setMetrics(metricsRes.data.data);
                setLogs(logsRes.data.data || []);
            } catch (error) {
                console.error("Failed to load admin activity data:", error);
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
                <h1 className="text-3xl font-bold text-white">Operational Activity</h1>
                <p className="text-zinc-400 mt-1">Audit access logs and member movement across PowerWorld facilities.</p>
            </header>

            <div className="grid gap-4 md:grid-cols-4">
                {[
                    { label: "Total Members", value: metrics?.users?.members || 0 },
                    { label: "Pending Verifications", value: metrics?.pendingVerifications || 0 },
                    { label: "Equipment Alerts", value: metrics?.equipmentAlerts || 0 },
                    { label: "Access Logs Today", value: metrics?.todayAccessLogs || 0 },
                ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-zinc-800 bg-black/40 p-6">
                        <p className="text-xs uppercase tracking-wide text-zinc-500">{item.label}</p>
                        <p className="text-3xl font-bold text-white mt-3">{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 backdrop-blur-md overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Recent Access Logs</h2>
                    <span className="text-xs text-zinc-500">{logs.length} records</span>
                </div>
                <div className="divide-y divide-zinc-800">
                    {logs.length === 0 ? (
                        <div className="p-10 text-center text-zinc-500">No access logs found.</div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    {log.isAuthorized ? (
                                        <ShieldCheck className="text-emerald-400" size={20} />
                                    ) : (
                                        <ShieldAlert className="text-red-500" size={20} />
                                    )}
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            {log.memberName || "Member"} • {log.direction?.toUpperCase() || "ACCESS"}
                                        </p>
                                        <p className="text-xs text-zinc-500">{log.gateId || "Main Entrance"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <Clock size={14} />
                                    {new Date(log.timestamp).toLocaleString("en-LK")}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
