'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authAPI, managerAPI } from "@/lib/api";
import { Dumbbell, Users, TrendingUp, Calendar, LogOut, Loader2, DollarSign, UserCheck } from "lucide-react";

// Format currency in LKR
const formatCurrency = (amount: number): string => {
    return `Rs. ${new Intl.NumberFormat('en-LK').format(amount)}`;
};

interface ManagerMetrics {
    revenue: {
        currentMonth: number;
        lastMonth: number;
        growth: string;
    };
    members: {
        active: number;
        newThisMonth: number;
    };
    attendance: {
        today: number;
    };
    subscriptions: {
        active: number;
    };
    staff: {
        onDuty: number;
    };
}

export default function ManagerDashboard() {
    const [profile, setProfile] = useState<any>(null);
    const [metrics, setMetrics] = useState<ManagerMetrics | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) { router.push('/login'); return; }

                const [profileRes, metricsRes] = await Promise.all([
                    authAPI.getProfile(),
                    managerAPI.getMetrics().catch(() => null)
                ]);

                setProfile(profileRes.data.data);
                setMetrics(metricsRes?.data?.data || null);
            } catch (e) {
                console.error(e);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        return () => clearInterval(timer);
    }, [router]);

    if (loading || !profile) {
        return (
            <div className="flex h-screen items-center justify-center bg-black">
                <Loader2 className="animate-spin text-red-600" size={40} />
            </div>
        );
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <nav className="bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-800 py-4 px-6 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center space-x-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                            <Dumbbell className="text-white" size={20} />
                        </div>
                        <span className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">PowerWorld Manager</span>
                    </Link>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <div className="text-sm text-zinc-500">Branch Manager</div>
                            <div className="text-white font-semibold">{profile.name}</div>
                        </div>
                        <button
                            onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
                            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Branch Performance</h1>
                        <p className="text-zinc-500">{formatDate(currentTime)}</p>
                    </div>

                    {/* Business Stats (Manager Focus) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-green-500/10 text-green-400">
                                    <DollarSign size={20} />
                                </div>
                                <h3 className="text-sm font-medium text-zinc-400">Monthly Revenue</h3>
                            </div>
                            <div className="text-3xl font-bold text-white">{formatCurrency(metrics?.revenue?.currentMonth || 0)}</div>
                            <div className={`text-sm mt-1 ${parseFloat(metrics?.revenue?.growth || '0') >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {metrics?.revenue?.growth || '0%'} vs last month
                            </div>
                        </div>

                        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                                    <Users size={20} />
                                </div>
                                <h3 className="text-sm font-medium text-zinc-400">Active Members</h3>
                            </div>
                            <div className="text-3xl font-bold text-white">{metrics?.members?.active?.toLocaleString() || '0'}</div>
                            <div className="text-sm text-zinc-500 mt-1">+{metrics?.members?.newThisMonth || 0} new this month</div>
                        </div>

                        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                                    <UserCheck size={20} />
                                </div>
                                <h3 className="text-sm font-medium text-zinc-400">Today's Attendance</h3>
                            </div>
                            <div className="text-3xl font-bold text-white">{metrics?.attendance?.today || '0'}</div>
                            <div className="text-sm text-zinc-500 mt-1">{metrics?.subscriptions?.active || 0} active subscriptions</div>
                        </div>

                        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400">
                                    <TrendingUp size={20} />
                                </div>
                                <h3 className="text-sm font-medium text-zinc-400">Staff On Duty</h3>
                            </div>
                            <div className="text-3xl font-bold text-white">{metrics?.staff?.onDuty || '0'}</div>
                            <div className="text-sm text-zinc-500 mt-1">Currently active</div>
                        </div>
                    </div>

                    {/* Management Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Link href="/manager-dashboard/members" className="p-6 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800 hover:border-blue-500/50 transition-all group cursor-pointer">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                    <Users size={20} />
                                </div>
                                <h3 className="text-xl font-semibold text-blue-400 group-hover:text-blue-300">Members</h3>
                            </div>
                            <p className="text-zinc-500">View and manage branch members.</p>
                        </Link>
                        <Link href="/manager-dashboard/staff" className="p-6 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800 hover:border-green-500/50 transition-all group cursor-pointer">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                                    <Calendar size={20} />
                                </div>
                                <h3 className="text-xl font-semibold text-green-400 group-hover:text-green-300">Staff Schedule</h3>
                            </div>
                            <p className="text-zinc-500">Manage staff shifts and schedules.</p>
                        </Link>
                        <Link href="/manager/reports" className="p-6 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800 hover:border-purple-500/50 transition-all group cursor-pointer">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                                    <TrendingUp size={20} />
                                </div>
                                <h3 className="text-xl font-semibold text-purple-400 group-hover:text-purple-300">Reports</h3>
                            </div>
                            <p className="text-zinc-500">Business analytics and insights.</p>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
