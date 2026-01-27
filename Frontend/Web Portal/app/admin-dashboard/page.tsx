'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { dashboardService, DashboardStats } from "@/lib/api/dashboard.service";
import { Dumbbell, Users, CreditCard, Activity, Settings, LogOut, Loader2 } from "lucide-react";

// Format currency in LKR
const formatCurrency = (amount: number): string => {
    return `Rs. ${new Intl.NumberFormat('en-LK').format(amount)}`;
};

export default function AdminDashboard() {
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) { router.push('/login'); return; }

                const [profileRes, statsData] = await Promise.all([
                    authAPI.getProfile(),
                    dashboardService.getStats().catch(() => null)
                ]);

                setProfile(profileRes.data.data);
                setStats(statsData);
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
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Navigation Header */}
            <nav className="bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-800 py-4 px-6 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Link href="/" className="flex items-center space-x-3 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-700 to-purple-600 flex items-center justify-center">
                                <Dumbbell className="text-white" size={20} />
                            </div>
                            <span className="text-xl font-bold text-white group-hover:text-red-500 transition-colors">PowerWorld Admin</span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <div className="text-sm text-zinc-500">Administrator</div>
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

            {/* Main Dashboard Content */}
            <main className="px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">System Administration</h1>
                        <p className="text-zinc-500">{formatDate(currentTime)} • {formatTime(currentTime)}</p>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-red-500/10 text-blue-400">
                                    <Users size={20} />
                                </div>
                                <h3 className="text-sm font-medium text-zinc-400">Total Members</h3>
                            </div>
                            <div className="text-3xl font-bold text-white">{stats?.totalMembers?.toLocaleString() || '0'}</div>
                            <div className="text-sm text-green-400 mt-1">{stats?.conversionRate || 0}% active</div>
                        </div>

                        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-green-500/10 text-green-400">
                                    <Activity size={20} />
                                </div>
                                <h3 className="text-sm font-medium text-zinc-400">Active Now</h3>
                            </div>
                            <div className="text-3xl font-bold text-white">{stats?.activeNow || '0'}</div>
                            <div className="text-sm text-zinc-500 mt-1">Active subscriptions</div>
                        </div>

                        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                                    <CreditCard size={20} />
                                </div>
                                <h3 className="text-sm font-medium text-zinc-400">Monthly Revenue</h3>
                            </div>
                            <div className="text-3xl font-bold text-white">{formatCurrency(stats?.monthlyRevenue || 0)}</div>
                            <div className="text-sm text-zinc-500 mt-1">This month</div>
                        </div>

                        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-red-600/10 text-red-500">
                                    <Settings size={20} />
                                </div>
                                <h3 className="text-sm font-medium text-zinc-400">System Status</h3>
                            </div>
                            <div className="text-3xl font-bold text-green-400">Online</div>
                            <div className="text-sm text-zinc-500 mt-1">All systems operational</div>
                        </div>
                    </div>

                    {/* Management Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Link href="/dashboard/members" className="p-6 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800 hover:border-red-600/50 transition-all group cursor-pointer">
                            <h3 className="text-xl font-semibold mb-2 text-red-500 group-hover:text-red-400">User Management</h3>
                            <p className="text-zinc-500">Manage members, trainers, and staff accounts.</p>
                        </Link>
                        <Link href="/dashboard/subscription" className="p-6 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800 hover:border-green-500/50 transition-all group cursor-pointer">
                            <h3 className="text-xl font-semibold mb-2 text-green-400 group-hover:text-green-300">Subscription Plans</h3>
                            <p className="text-zinc-500">Configure membership pricing and benefits.</p>
                        </Link>
                        <Link href="/dashboard/settings" className="p-6 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800 hover:border-purple-500/50 transition-all group cursor-pointer">
                            <h3 className="text-xl font-semibold mb-2 text-purple-400 group-hover:text-purple-300">System Settings</h3>
                            <p className="text-zinc-500">Configure system preferences and access.</p>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
