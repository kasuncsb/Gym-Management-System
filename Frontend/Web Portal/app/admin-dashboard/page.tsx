'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authAPI, adminAPI } from "@/lib/api";
import { Dumbbell, Users, ShieldCheck, AlertCircle, Settings, LogOut, Loader2, FileCheck, UserPlus } from "lucide-react";

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

export default function AdminDashboard() {
    const [profile, setProfile] = useState<any>(null);
    const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
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
                    adminAPI.getMetrics().catch(() => null)
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
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Main Dashboard Content */}
            <main className="px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">System Administration</h1>
                        <p className="text-zinc-500">{formatDate(currentTime)} • {formatTime(currentTime)}</p>
                    </div>

                    {/* Technical Stats (Admin Focus) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                                    <Users size={20} />
                                </div>
                                <h3 className="text-sm font-medium text-zinc-400">Total Users</h3>
                            </div>
                            <div className="text-3xl font-bold text-white">{metrics?.users?.total?.toLocaleString() || '0'}</div>
                            <div className="text-sm text-zinc-500 mt-1">
                                {metrics?.users?.members || 0} members • {metrics?.users?.staff || 0} staff
                            </div>
                        </div>

                        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400">
                                    <FileCheck size={20} />
                                </div>
                                <h3 className="text-sm font-medium text-zinc-400">Pending Verifications</h3>
                            </div>
                            <div className="text-3xl font-bold text-white">{metrics?.pendingVerifications || '0'}</div>
                            <div className="text-sm text-yellow-400 mt-1">Documents awaiting review</div>
                        </div>

                        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                                    <AlertCircle size={20} />
                                </div>
                                <h3 className="text-sm font-medium text-zinc-400">Equipment Alerts</h3>
                            </div>
                            <div className="text-3xl font-bold text-white">{metrics?.equipmentAlerts || '0'}</div>
                            <div className="text-sm text-zinc-500 mt-1">Requiring maintenance</div>
                        </div>

                        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-green-500/10 text-green-400">
                                    <ShieldCheck size={20} />
                                </div>
                                <h3 className="text-sm font-medium text-zinc-400">System Status</h3>
                            </div>
                            <div className="text-3xl font-bold text-green-400">Online</div>
                            <div className="text-sm text-zinc-500 mt-1">{metrics?.todayAccessLogs || 0} access logs today</div>
                        </div>
                    </div>

                    {/* Admin Actions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Link href="/admin-dashboard/documents" className="p-6 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800 hover:border-yellow-500/50 transition-all group cursor-pointer">
                            <div className="flex items-center gap-3 mb-2">
                                <FileCheck className="text-yellow-400" size={24} />
                                <h3 className="text-xl font-semibold text-yellow-400 group-hover:text-yellow-300">Document Approvals</h3>
                            </div>
                            <p className="text-zinc-500">Review and approve member identity documents.</p>
                        </Link>
                        <Link href="/admin-dashboard/users" className="p-6 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800 hover:border-red-500/50 transition-all group cursor-pointer">
                            <div className="flex items-center gap-3 mb-2">
                                <UserPlus className="text-red-400" size={24} />
                                <h3 className="text-xl font-semibold text-red-400 group-hover:text-red-300">User Management</h3>
                            </div>
                            <p className="text-zinc-500">Manage all system users and roles.</p>
                        </Link>
                        <Link href="/admin-dashboard/settings" className="p-6 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800 hover:border-purple-500/50 transition-all group cursor-pointer">
                            <div className="flex items-center gap-3 mb-2">
                                <Settings className="text-purple-400" size={24} />
                                <h3 className="text-xl font-semibold text-purple-400 group-hover:text-purple-300">System Settings</h3>
                            </div>
                            <p className="text-zinc-500">Configure system preferences and access.</p>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
