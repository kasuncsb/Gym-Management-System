'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { managerAPI, equipmentAPI, notificationAPI } from "@/lib/api";
import {
    Users, TrendingUp, DollarSign, UserCheck,
    Dumbbell, Clock, CreditCard, Package, LineChart,
    BarChart3, Bell, CalendarDays, ArrowUpRight, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

const formatCurrency = (amount: number): string =>
    `Rs. ${new Intl.NumberFormat('en-LK').format(amount)}`;

interface ManagerMetrics {
    revenue: { currentMonth: number; lastMonth: number; growth: string };
    members: { active: number; newThisMonth: number };
    attendance: { today: number };
    subscriptions: { active: number };
    staff: { onDuty: number };
}

const QUICK_LINKS = [
    { name: 'Members', href: '/manager-dashboard/members', icon: Users, color: 'blue', desc: 'View and manage branch members' },
    { name: 'Staff Directory', href: '/manager-dashboard/staff', icon: Shield, color: 'emerald', desc: 'Branch staff and trainers' },
    { name: 'Shift Schedule', href: '/manager-dashboard/shifts', icon: Clock, color: 'purple', desc: 'Manage weekly staff schedules' },
    { name: 'Payments', href: '/manager-dashboard/payments', icon: DollarSign, color: 'green', desc: 'Monitor transactions and revenue' },
    { name: 'Subscriptions', href: '/manager-dashboard/subscriptions', icon: CreditCard, color: 'cyan', desc: 'Plans, renewals, and revenue' },
    { name: 'Inventory', href: '/manager-dashboard/inventory', icon: Package, color: 'yellow', desc: 'Track stock and supplies' },
    { name: 'Equipment', href: '/manager-dashboard/equipment', icon: Dumbbell, color: 'red', desc: 'Equipment status and maintenance' },
    { name: 'Analytics', href: '/manager-dashboard/analytics', icon: LineChart, color: 'indigo', desc: 'Growth trends and insights' },
    { name: 'Reports', href: '/manager-dashboard/reports', icon: BarChart3, color: 'orange', desc: 'Revenue, retention, and summary' },
    { name: 'Notifications', href: '/manager-dashboard/notifications', icon: Bell, color: 'pink', desc: 'Alerts and announcements' },
];

const COLOR_MAP: Record<string, { icon: string; bg: string; border: string; text: string }> = {
    blue: { icon: 'text-blue-400', bg: 'bg-blue-500/10', border: 'hover:border-blue-500/40', text: 'text-blue-400 group-hover:text-blue-300' },
    emerald: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'hover:border-emerald-500/40', text: 'text-emerald-400 group-hover:text-emerald-300' },
    purple: { icon: 'text-purple-400', bg: 'bg-purple-500/10', border: 'hover:border-purple-500/40', text: 'text-purple-400 group-hover:text-purple-300' },
    green: { icon: 'text-green-400', bg: 'bg-green-500/10', border: 'hover:border-green-500/40', text: 'text-green-400 group-hover:text-green-300' },
    cyan: { icon: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'hover:border-cyan-500/40', text: 'text-cyan-400 group-hover:text-cyan-300' },
    yellow: { icon: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'hover:border-yellow-500/40', text: 'text-yellow-400 group-hover:text-yellow-300' },
    red: { icon: 'text-red-400', bg: 'bg-red-500/10', border: 'hover:border-red-500/40', text: 'text-red-400 group-hover:text-red-300' },
    indigo: { icon: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'hover:border-indigo-500/40', text: 'text-indigo-400 group-hover:text-indigo-300' },
    orange: { icon: 'text-orange-400', bg: 'bg-orange-500/10', border: 'hover:border-orange-500/40', text: 'text-orange-400 group-hover:text-orange-300' },
    pink: { icon: 'text-pink-400', bg: 'bg-pink-500/10', border: 'hover:border-pink-500/40', text: 'text-pink-400 group-hover:text-pink-300' },
};

export default function ManagerDashboard() {
    const [metrics, setMetrics] = useState<ManagerMetrics | null>(null);
    const [unreadNotifs, setUnreadNotifs] = useState(0);
    const [equipmentIssues, setEquipmentIssues] = useState(0);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        const fetchData = async () => {
            try {
                const [metricsRes, notifsRes, issuesRes] = await Promise.all([
                    managerAPI.getMetrics().catch(() => null),
                    notificationAPI.getUnreadCount().catch(() => null),
                    equipmentAPI.getOpenIssues().catch(() => null),
                ]);

                setMetrics(metricsRes?.data?.data || null);
                setUnreadNotifs(notifsRes?.data?.data?.unreadCount || 0);
                setEquipmentIssues((issuesRes?.data?.data || []).length);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        return () => clearInterval(timer);
    }, []);

    if (loading) {
        return (
            <div className="space-y-8 page-enter">
                <div className="space-y-2"><Skeleton className="h-8 w-52" /><Skeleton className="h-4 w-40" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">{ Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />) }</div>
                <Skeleton className="h-6 w-32" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">{ Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />) }</div>
            </div>
        );
    }

    const formatDate = (date: Date) =>
        date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const revenueGrowth = parseFloat(metrics?.revenue?.growth || '0');

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Branch Performance</h1>
                <p className="text-zinc-400 mt-1">{formatDate(currentTime)}</p>
            </div>

            {/* Alerts Bar */}
            {(unreadNotifs > 0 || equipmentIssues > 0) && (
                <div className="flex flex-wrap gap-3">
                    {unreadNotifs > 0 && (
                        <Link
                            href="/manager-dashboard/notifications"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 text-sm hover:bg-pink-500/20 transition"
                        >
                            <Bell size={14} />
                            {unreadNotifs} unread notification{unreadNotifs > 1 ? 's' : ''}
                            <ArrowUpRight size={12} />
                        </Link>
                    )}
                    {equipmentIssues > 0 && (
                        <Link
                            href="/manager-dashboard/equipment"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm hover:bg-orange-500/20 transition"
                        >
                            <Dumbbell size={14} />
                            {equipmentIssues} open equipment issue{equipmentIssues > 1 ? 's' : ''}
                            <ArrowUpRight size={12} />
                        </Link>
                    )}
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-xl bg-green-500/10 text-green-400"><DollarSign size={18} /></div>
                        <span className="text-sm text-zinc-400">Monthly Revenue</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{formatCurrency(metrics?.revenue?.currentMonth || 0)}</div>
                    <div className={cn('text-xs mt-1', revenueGrowth >= 0 ? 'text-green-400' : 'text-red-400')}>
                        {metrics?.revenue?.growth || 'N/A'} vs last month
                    </div>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400"><Users size={18} /></div>
                        <span className="text-sm text-zinc-400">Active Members</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{metrics?.members?.active?.toLocaleString() || '0'}</div>
                    <div className="text-xs text-zinc-500 mt-1">+{metrics?.members?.newThisMonth || 0} new this month</div>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400"><UserCheck size={18} /></div>
                        <span className="text-sm text-zinc-400">Today&apos;s Check‑ins</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{metrics?.attendance?.today || '0'}</div>
                    <div className="text-xs text-zinc-500 mt-1">{metrics?.subscriptions?.active || 0} active subs</div>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400"><CalendarDays size={18} /></div>
                        <span className="text-sm text-zinc-400">Staff On Duty</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{metrics?.staff?.onDuty || '0'}</div>
                    <div className="text-xs text-zinc-500 mt-1">Currently active</div>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-xl bg-red-500/10 text-red-400"><Dumbbell size={18} /></div>
                        <span className="text-sm text-zinc-400">Equipment Issues</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{equipmentIssues}</div>
                    <div className="text-xs text-zinc-500 mt-1">Open reports</div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {QUICK_LINKS.map(link => {
                        const colors = COLOR_MAP[link.color] || COLOR_MAP.blue;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    'p-5 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800 transition-all group cursor-pointer',
                                    colors.border
                                )}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={cn('p-2 rounded-xl', colors.bg)}>
                                        <link.icon size={18} className={colors.icon} />
                                    </div>
                                    <h3 className={cn('font-semibold text-sm', colors.text)}>{link.name}</h3>
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed">{link.desc}</p>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
