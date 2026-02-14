'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authAPI, staffAPI } from "@/lib/api";
import { Dumbbell, ScanLine, Wrench, ClipboardList, LogOut, Loader2, UserCheck, AlertTriangle } from "lucide-react";

interface StaffMetrics {
    checkIns: {
        today: number;
    };
    checkOuts: {
        today: number;
    };
    equipment: {
        total: number;
        needsMaintenance: number;
    };
}

export default function StaffDashboard() {
    const [profile, setProfile] = useState<any>(null);
    const [metrics, setMetrics] = useState<StaffMetrics | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) { router.push('/login'); return; }

                const [profileRes, metricsRes] = await Promise.all([
                    authAPI.getProfile(),
                    staffAPI.getMetrics().catch(() => null)
                ]);

                const profileData = profileRes.data.data;
                const role = profileData.role;

                if (role === 'member') {
                    router.push('/member');
                    return;
                }
                if (role === 'admin') {
                    router.push('/admin-dashboard');
                    return;
                }

                setProfile(profileData);
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
            <nav className="bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-800 py-4 px-6 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center space-x-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center">
                            <Dumbbell className="text-white" size={20} />
                        </div>
                        <span className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">PowerWorld Staff</span>
                    </Link>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <div className="text-sm text-zinc-500">Staff Member</div>
                            <div className="text-white font-semibold">{profile.fullName}</div>
                        </div>
                        <button
                            onClick={() => { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); localStorage.removeItem('user'); router.push('/login'); }}
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
                        <h1 className="text-3xl font-bold text-white mb-2">Operations Dashboard</h1>
                        <p className="text-zinc-500">{formatDate(currentTime)} • {formatTime(currentTime)}</p>
                    </div>

                    {/* Operational Stats (Staff Focus) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-green-500/10 text-green-400">
                                    <UserCheck size={20} />
                                </div>
                                <h3 className="text-sm font-medium text-zinc-400">Check-ins Today</h3>
                            </div>
                            <div className="text-3xl font-bold text-white">{metrics?.checkIns?.today || '0'}</div>
                            <div className="text-sm text-zinc-500 mt-1">Members entered</div>
                        </div>

                        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                                    <ScanLine size={20} />
                                </div>
                                <h3 className="text-sm font-medium text-zinc-400">Check-outs Today</h3>
                            </div>
                            <div className="text-3xl font-bold text-white">{metrics?.checkOuts?.today || '0'}</div>
                            <div className="text-sm text-zinc-500 mt-1">Members exited</div>
                        </div>

                        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                                    <Wrench size={20} />
                                </div>
                                <h3 className="text-sm font-medium text-zinc-400">Total Equipment</h3>
                            </div>
                            <div className="text-3xl font-bold text-white">{metrics?.equipment?.total || '0'}</div>
                            <div className="text-sm text-zinc-500 mt-1">Machines tracked</div>
                        </div>

                        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-xl ${(metrics?.equipment?.needsMaintenance || 0) > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                    <AlertTriangle size={20} />
                                </div>
                                <h3 className="text-sm font-medium text-zinc-400">Needs Maintenance</h3>
                            </div>
                            <div className={`text-3xl font-bold ${(metrics?.equipment?.needsMaintenance || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {metrics?.equipment?.needsMaintenance || '0'}
                            </div>
                            <div className="text-sm text-zinc-500 mt-1">Equipment alerts</div>
                        </div>
                    </div>

                    {/* Quick Actions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Link href="/qr-scanner" className="p-6 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800 hover:border-green-500/50 transition-all group cursor-pointer">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                                    <ScanLine size={20} />
                                </div>
                                <h3 className="text-xl font-semibold text-green-400 group-hover:text-green-300">QR Scanner</h3>
                            </div>
                            <p className="text-zinc-500">Scan member QR codes for check-in/out.</p>
                        </Link>
                        <Link href="/staff-dashboard/checkin" className="p-6 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800 hover:border-blue-500/50 transition-all group cursor-pointer">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                    <ClipboardList size={20} />
                                </div>
                                <h3 className="text-xl font-semibold text-blue-400 group-hover:text-blue-300">Today's Log</h3>
                            </div>
                            <p className="text-zinc-500">View today's check-in/out history.</p>
                        </Link>
                        <Link href="/staff-dashboard/equipment" className="p-6 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800 hover:border-purple-500/50 transition-all group cursor-pointer">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                                    <Wrench size={20} />
                                </div>
                                <h3 className="text-xl font-semibold text-purple-400 group-hover:text-purple-300">Equipment</h3>
                            </div>
                            <p className="text-zinc-500">View and report equipment issues.</p>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
