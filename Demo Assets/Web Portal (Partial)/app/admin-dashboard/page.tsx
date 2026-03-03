'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { adminAPI } from "@/lib/api";
import {
    Users, ShieldCheck, AlertCircle, Settings,
    FileCheck, UserPlus, Dumbbell, CreditCard,
    Package, BarChart3, LineChart, BookOpen
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

interface AdminMetrics {
    users: {
        total: number;
        admins: number;
        managers: number;
        staff: number;
        trainers: number;
        members: number;
    };
    pendingVerifications: number;
    equipmentAlerts: number;
    todayAccessLogs: number;
}

const QUICK_LINKS = [
    { name: 'Documents', href: '/admin-dashboard/documents', icon: FileCheck, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'hover:border-yellow-500/50', desc: 'Review and approve member documents' },
    { name: 'Users', href: '/admin-dashboard/users', icon: UserPlus, color: 'text-red-400', bg: 'bg-red-500/10', border: 'hover:border-red-500/50', desc: 'Manage all system users and roles' },
    { name: 'Members', href: '/admin-dashboard/members', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'hover:border-blue-500/50', desc: 'View and manage gym members' },
    { name: 'Plans', href: '/admin-dashboard/plans', icon: CreditCard, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'hover:border-cyan-500/50', desc: 'Subscription plans and pricing' },
    { name: 'Equipment', href: '/admin-dashboard/equipment', icon: Dumbbell, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'hover:border-orange-500/50', desc: 'Equipment status and maintenance' },
    { name: 'Inventory', href: '/admin-dashboard/inventory', icon: Package, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'hover:border-emerald-500/50', desc: 'Stock tracking and sales' },
    { name: 'Analytics', href: '/admin-dashboard/analytics', icon: LineChart, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'hover:border-indigo-500/50', desc: 'Growth trends and insights' },
    { name: 'Reports', href: '/admin-dashboard/reports', icon: BarChart3, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'hover:border-pink-500/50', desc: 'Revenue, retention, summaries' },
    { name: 'Audit Log', href: '/admin-dashboard/audit', icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'hover:border-purple-500/50', desc: 'System activity and compliance' },
    { name: 'Settings', href: '/admin-dashboard/settings', icon: Settings, color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'hover:border-zinc-500/50', desc: 'System preferences and config' },
];

export default function AdminDashboard() {
    const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        const fetchData = async () => {
            try {
                const metricsRes = await adminAPI.getMetrics().catch(() => null);
                setMetrics(metricsRes?.data?.data || null);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date: Date) =>
        date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (loading) {
        return (
            <div className="space-y-8 page-enter">
                <div className="space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-48" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 page-enter">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">System Administration</h1>
                <p className="text-zinc-400 mt-1">{formatDate(currentTime)}</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400"><Users size={20} /></div>
                        <h3 className="text-sm font-medium text-zinc-400">Total Users</h3>
                    </div>
                    <div className="text-3xl font-bold text-white">{metrics?.users?.total?.toLocaleString() || '0'}</div>
                    <div className="text-sm text-zinc-500 mt-1">
                        {metrics?.users?.members || 0} members &middot; {metrics?.users?.staff || 0} staff
                    </div>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400"><FileCheck size={20} /></div>
                        <h3 className="text-sm font-medium text-zinc-400">Pending Verifications</h3>
                    </div>
                    <div className="text-3xl font-bold text-white">{metrics?.pendingVerifications || '0'}</div>
                    <div className="text-sm text-yellow-400 mt-1">Documents awaiting review</div>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-red-500/10 text-red-400"><AlertCircle size={20} /></div>
                        <h3 className="text-sm font-medium text-zinc-400">Equipment Alerts</h3>
                    </div>
                    <div className="text-3xl font-bold text-white">{metrics?.equipmentAlerts || '0'}</div>
                    <div className="text-sm text-zinc-500 mt-1">Requiring maintenance</div>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-green-500/10 text-green-400"><ShieldCheck size={20} /></div>
                        <h3 className="text-sm font-medium text-zinc-400">System Status</h3>
                    </div>
                    <div className="text-3xl font-bold text-green-400">Online</div>
                    <div className="text-sm text-zinc-500 mt-1">{metrics?.todayAccessLogs || 0} access logs today</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {QUICK_LINKS.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`p-5 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800 transition-all group cursor-pointer ${link.border}`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-xl ${link.bg}`}>
                                    <link.icon size={18} className={link.color} />
                                </div>
                                <h3 className={`font-semibold text-sm ${link.color}`}>{link.name}</h3>
                            </div>
                            <p className="text-xs text-zinc-500 leading-relaxed">{link.desc}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
