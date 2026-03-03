'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Dumbbell, User, Settings, LogOut, Loader2, Mail, Shield, Calendar } from 'lucide-react';

export default function DashboardPage() {
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="text-red-600 animate-spin" size={40} />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                            <Dumbbell className="text-white" size={20} />
                        </div>
                        <span className="text-xl font-bold">
                            Power<span className="text-red-600">World</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 text-zinc-400">
                            <User size={18} />
                            <span>{user?.fullName}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <LogOut size={18} />
                            <span className="hidden md:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <div className="bg-gradient-to-br from-red-700 to-red-900 rounded-2xl p-6 shadow-lg shadow-red-600/20">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                                <User className="text-white" size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{user?.fullName}</h3>
                                <p className="text-red-200 text-sm capitalize">{user?.role}</p>
                            </div>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2 text-red-100">
                                <Mail size={16} />
                                <span>{user?.email}</span>
                            </div>
                            {user?.memberCode && (
                                <div className="flex items-center gap-2 text-red-100">
                                    <Shield size={16} />
                                    <span>Code: {user.memberCode}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Settings className="text-red-500" size={20} />
                            Quick Actions
                        </h3>
                        <div className="space-y-3">
                            <Link
                                href="/profile"
                                className="block w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors text-center"
                            >
                                View Full Profile
                            </Link>
                            <Link
                                href="/change-password"
                                className="block w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors text-center"
                            >
                                Change Password
                            </Link>
                        </div>
                    </div>

                    {/* Status Card */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="text-red-500" size={20} />
                            Membership Status
                        </h3>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-400 font-medium">Active</span>
                        </div>
                        <p className="text-sm text-zinc-400">
                            Your membership is in good standing. Keep up the great work!
                        </p>
                    </div>
                </div>

                {/* Welcome Message */}
                <div className="mt-8 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">Welcome to PowerWorld Gyms!</h2>
                    <p className="text-zinc-400 max-w-2xl mx-auto">
                        This is your personal dashboard. More features will be available soon including
                        workout tracking, class schedules, and trainer appointments.
                    </p>
                </div>
            </main>
        </div>
    );
}
