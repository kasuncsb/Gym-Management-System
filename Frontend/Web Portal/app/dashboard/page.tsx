"use client";

import { useState, useEffect } from "react";
import { Users, CreditCard, Activity, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { ActivityChart } from "@/components/ui/ActivityChart";
import { useAuth } from "@/context/AuthContext";
import { dashboardService, DashboardStats, RecentSignup } from "@/lib/api/dashboard.service";

// Format currency in LKR
const formatCurrency = (amount: number): string => {
    return `Rs. ${new Intl.NumberFormat('en-LK').format(amount)}`;
};

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentSignups, setRecentSignups] = useState<RecentSignup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Only fetch admin stats if user is staff/admin
                if (user?.role !== 'member') {
                    const [statsData, signupsData] = await Promise.all([
                        dashboardService.getStats(),
                        dashboardService.getRecentSignups()
                    ]);
                    setStats(statsData);
                    setRecentSignups(signupsData);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [user]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Dashboard</h2>
                    <p className="text-zinc-400 mt-1">Welcome back, <span className="text-indigo-400 font-medium">{user?.name || 'User'}</span></p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 text-white rounded-lg hover:bg-zinc-800 transition backdrop-blur-sm">
                        Download Report
                    </button>
                    {user?.role !== 'member' && (
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition">
                            Add Member
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Members"
                    value={loading ? "..." : (stats?.totalMembers?.toLocaleString() || "0")}
                    trend={stats ? `${stats.conversionRate}% active` : "Loading..."}
                    trendUp={true}
                    icon={Users}
                    color="blue"
                />
                <StatCard
                    title="Active Now"
                    value={loading ? "..." : (stats?.activeNow?.toString() || "0")}
                    trend="Active subscriptions"
                    trendUp={true}
                    icon={Activity}
                    color="green"
                />
                <StatCard
                    title="Monthly Revenue"
                    value={loading ? "..." : formatCurrency(stats?.monthlyRevenue || 0)}
                    trend="This month"
                    trendUp={true}
                    icon={CreditCard}
                    color="purple"
                />
                <StatCard
                    title="Conversion Rate"
                    value={loading ? "..." : `${stats?.conversionRate || 0}%`}
                    trend="Active / Total"
                    trendUp={(stats?.conversionRate || 0) > 50}
                    icon={TrendingUp}
                    color="orange"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <ActivityChart />
                </div>

                {/* Recent Activity / Side Widget */}
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Signups</h3>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-zinc-400 text-sm">Loading...</div>
                        ) : recentSignups.length === 0 ? (
                            <div className="text-zinc-400 text-sm">No recent signups</div>
                        ) : (
                            recentSignups.map((signup) => (
                                <div key={signup.id} className="flex items-center gap-4 p-3 hover:bg-zinc-800 rounded-xl transition cursor-pointer group">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-300">
                                        {signup.initials}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-white">{signup.name}</h4>
                                        <p className="text-xs text-zinc-400">{signup.planName}</p>
                                    </div>
                                    <span className="text-xs text-zinc-500">{signup.timeAgo}</span>
                                </div>
                            ))
                        )}
                    </div>
                    <button className="w-full mt-6 py-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition">
                        View All Members
                    </button>
                </div>
            </div>
        </div>
    );
}
