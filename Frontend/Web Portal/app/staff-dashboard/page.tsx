'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { Dumbbell, QrCode, Calendar, Users, LogOut, Loader2, Clock } from "lucide-react";

export default function StaffDashboard() {
    const [profile, setProfile] = useState<any>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const router = useRouter();

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

    if (loading || !profile) {
        return (
            <div className="flex h-screen items-center justify-center bg-black">
                <Loader2 className="animate-spin text-red-600" size={40} />
            </div>
        );
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <nav className="bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-800 py-4 px-6 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center space-x-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-700 to-red-600 flex items-center justify-center">
                            <Dumbbell className="text-white" size={20} />
                        </div>
                        <span className="text-xl font-bold text-white group-hover:text-red-500 transition-colors">PowerWorld Staff</span>
                    </Link>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <div className="text-sm text-zinc-500">Staff</div>
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
                        <h1 className="text-3xl font-bold text-white mb-2">Staff Portal</h1>
                        <p className="text-zinc-500">Welcome, {profile.name}</p>
                    </div>

                    {/* Current Time Card */}
                    <div className="mb-8 p-6 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800 text-center">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <Clock className="text-red-500" size={24} />
                            <span className="text-zinc-400">{formatDate(currentTime)}</span>
                        </div>
                        <div className="text-5xl font-bold text-white font-mono">{formatTime(currentTime)}</div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Link href="/dashboard/check-in" className="p-6 bg-gradient-to-br from-red-700/20 to-purple-600/20 border border-red-600/30 rounded-2xl hover:border-red-600/60 transition-all group cursor-pointer">
                            <div className="flex items-center justify-center mb-4 text-red-500 group-hover:scale-110 transition-transform">
                                <QrCode size={48} />
                            </div>
                            <h3 className="text-center font-bold text-white text-lg">QR Check-in</h3>
                            <p className="text-center text-zinc-500 text-sm mt-1">Scan member QR codes</p>
                        </Link>

                        <Link href="/dashboard/members" className="p-6 bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl hover:border-green-500/50 transition-all group cursor-pointer">
                            <div className="flex items-center justify-center mb-4 text-green-400 group-hover:scale-110 transition-transform">
                                <Users size={48} />
                            </div>
                            <h3 className="text-center font-bold text-white text-lg">Members</h3>
                            <p className="text-center text-zinc-500 text-sm mt-1">View member list</p>
                        </Link>

                        <Link href="/dashboard/schedule" className="p-6 bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl hover:border-red-500/50 transition-all group cursor-pointer">
                            <div className="flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
                                <Calendar size={48} />
                            </div>
                            <h3 className="text-center font-bold text-white text-lg">Schedule</h3>
                            <p className="text-center text-zinc-500 text-sm mt-1">View class schedule</p>
                        </Link>
                    </div>

                    {/* Today's Schedule */}
                    <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6">
                        <h2 className="text-xl font-semibold mb-4 text-white">Today's Schedule</h2>
                        <div className="text-center text-zinc-500 py-8 border border-dashed border-zinc-800 rounded-xl">
                            <Calendar className="mx-auto mb-3 text-zinc-600" size={32} />
                            <p>No appointments scheduled for today.</p>
                            <Link href="/dashboard/schedule" className="text-red-500 hover:text-red-400 text-sm mt-2 inline-block">
                                View full schedule →
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
