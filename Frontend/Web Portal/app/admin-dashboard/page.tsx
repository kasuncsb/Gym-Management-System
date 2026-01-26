'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";

export default function AdminDashboard() {
    const [profile, setProfile] = useState<any>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Mock System Stats
    const systemStats = {
        totalMembers: 1247,
        activeMembers: 1089,
        totalRevenue: 45680,
        systemUptime: '99.9%'
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) { router.push('/login'); return; }

                const res = await authAPI.getProfile();
                setProfile(res.data.data);
            } catch (e) {
                console.error(e);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();

        return () => clearInterval(timer);
    }, [router]);

    if (loading || !profile) return <div className="flex h-screen items-center justify-center"><div className="animate-spin h-10 w-10 border-b-2 border-red-600 rounded-full"></div></div>;

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navigation Header */}
            <nav className="bg-white text-gray-900 py-4 px-6 relative z-10 border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Link href="/" className="flex items-center space-x-3 group">
                            <Image src="/logo.png" alt="Logo" width={50} height={50} className="transition-transform group-hover:scale-105" priority />
                            <span className="text-xl font-bold text-gray-900 group-hover:text-red-500 transition-colors">PowerWorld Admin</span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Administrator</div>
                            <div className="text-gray-900 font-semibold">{profile.name}</div>
                        </div>
                        <button onClick={() => { localStorage.removeItem('token'); router.push('/login'); }} className="text-red-500 hover:text-red-700 text-sm">Logout</button>
                    </div>
                </div>
            </nav>

            {/* Main Dashboard Content */}
            <main className="flex-1 px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">System Administration</h1>
                        <p className="text-gray-600">{formatDate(currentTime)} • {formatTime(currentTime)}</p>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Total Members */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Members</h3>
                            <div className="text-3xl font-bold text-gray-900">{systemStats.totalMembers.toLocaleString()}</div>
                            <div className="text-sm text-green-500">{systemStats.activeMembers} active</div>
                        </div>

                        {/* Revenue */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Revenue</h3>
                            <div className="text-3xl font-bold text-gray-900">Rs.{systemStats.totalRevenue.toLocaleString()}</div>
                            <div className="text-sm text-gray-500">This Month</div>
                        </div>

                        {/* Uptime */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">System Uptime</h3>
                            <div className="text-3xl font-bold text-green-500">{systemStats.systemUptime}</div>
                            <div className="text-sm text-gray-500">Last 30 days</div>
                        </div>
                    </div>

                    {/* Management Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="p-6 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                            <h3 className="text-xl font-semibold mb-2 text-blue-600">User Management</h3>
                            <p className="text-gray-600">Manage members, trainers, and staff accounts.</p>
                        </div>
                        <div className="p-6 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                            <h3 className="text-xl font-semibold mb-2 text-green-600">Subscription Plans</h3>
                            <p className="text-gray-600">Configure membership pricing and benefits.</p>
                        </div>
                        <div className="p-6 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                            <h3 className="text-xl font-semibold mb-2 text-purple-600">System Logs</h3>
                            <p className="text-gray-600">View access logs and system activity.</p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
