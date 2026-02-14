"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserCheck, ScanLine, Wrench, DollarSign, AlertTriangle, Calendar, Clock, ArrowRight, Users } from "lucide-react";
import { staffAPI, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { PageHeader, Card, ErrorAlert } from "@/components/ui/SharedComponents";

interface StaffMetrics {
    checkIns: { today: number };
    checkOuts: { today: number };
    equipment: { total: number; needsMaintenance: number };
}

export default function StaffDashboard() {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<StaffMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        async function fetch() {
            try {
                const res = await staffAPI.getMetrics();
                setMetrics(res.data.data);
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, []);

    const stats = [
        { label: "Check-ins Today", value: metrics?.checkIns?.today || 0, icon: UserCheck, color: "emerald" },
        { label: "Check-outs Today", value: metrics?.checkOuts?.today || 0, icon: ScanLine, color: "blue" },
        { label: "Total Equipment", value: metrics?.equipment?.total || 0, icon: Wrench, color: "purple" },
        { label: "Needs Maintenance", value: metrics?.equipment?.needsMaintenance || 0, icon: AlertTriangle, color: metrics?.equipment?.needsMaintenance ? "red" : "emerald" },
    ];

    const quickActions = [
        { href: "/staff-dashboard/check-in", label: "Member Check-In", desc: "Scan or search for members", icon: ScanLine, color: "emerald" },
        { href: "/staff-dashboard/equipment", label: "Equipment", desc: "View and report issues", icon: Wrench, color: "purple" },
        { href: "/staff-dashboard/payments", label: "Payments", desc: "Record member payments", icon: DollarSign, color: "amber" },
        { href: "/staff-dashboard/sessions", label: "Sessions", desc: "Manage training sessions", icon: Calendar, color: "blue" },
        { href: "/staff-dashboard/availability", label: "Availability", desc: "Set your weekly schedule", icon: Clock, color: "cyan" },
    ];

    if (loading) {
        return (
            <div className="space-y-8 page-enter">
                <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64" /></div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
            </div>
        );
    }

    return (
        <div className="space-y-8 page-enter">
            <PageHeader
                title="Operations Dashboard"
                subtitle={`${currentTime.toLocaleDateString("en-LK", { weekday: "long", month: "long", day: "numeric" })} · Welcome back, ${user?.fullName?.split(" ")[0] || "Staff"}`}
            />

            {error && <ErrorAlert message={error} />}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-in">
                {stats.map(({ label, value, icon: Icon, color }, i) => (
                    <Card key={i} className="relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-20 h-20 bg-${color}-500/5 rounded-full blur-2xl`} />
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`w-9 h-9 rounded-lg bg-${color}-500/10 flex items-center justify-center`}>
                                    <Icon size={18} className={`text-${color}-400`} />
                                </div>
                                <span className="text-xs text-zinc-500 font-medium">{label}</span>
                            </div>
                            <span className={`text-3xl font-bold ${color === "red" && value > 0 ? "text-red-400" : "text-white"}`}>{value}</span>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-in">
                    {quickActions.map(({ href, label, desc, icon: Icon, color }) => (
                        <Link key={href} href={href}>
                            <Card className="group hover:border-zinc-700 cursor-pointer transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl bg-${color}-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                                        <Icon size={22} className={`text-${color}-400`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-white group-hover:text-red-400 transition-colors">{label}</p>
                                        <p className="text-xs text-zinc-500">{desc}</p>
                                    </div>
                                    <ArrowRight size={16} className="text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all" />
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
