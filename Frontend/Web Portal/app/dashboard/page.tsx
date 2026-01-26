'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authAPI, memberAPI } from "@/lib/api";

export default function MemberDashboard() {
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Clock
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        // Fetch Data
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                // Parallel fetch for profile and stats/history
                const [profileRes] = await Promise.all([
                    authAPI.getProfile(),
                    // memberAPI.getStats() // Uncomment when endpoints are fully ready
                ]);

                setProfile(profileRes.data.data);
                // setStats(statsRes.data.data);
                setIsLoading(false);
            } catch (err) {
                console.error('Failed to load dashboard:', err);
                // Optionally redirect to login if 401
                router.push('/login');
            }
        };

        fetchData();

        return () => clearInterval(timer);
    }, [router]);

    if (isLoading || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navigation Header */}
            <nav className="bg-white text-gray-900 py-4 px-6 relative z-10 border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Link href="/" className="flex items-center space-x-3 group">
                            <Image
                                src="/logo.png"
                                alt="PowerWorld Fitness Logo"
                                width={50}
                                height={50}
                                className="transition-transform group-hover:scale-105"
                                priority
                            />
                            <span className="text-xl font-bold text-gray-900 group-hover:text-red-500 transition-colors">
                                PowerWorld
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Welcome back</div>
                            <div className="text-gray-900 font-semibold">{profile.name}</div>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                                {profile.name.charAt(0)}
                            </span>
                        </div>
                        <button
                            onClick={() => {
                                localStorage.removeItem('token');
                                router.push('/login');
                            }}
                            className="text-sm text-red-500 hover:text-red-700"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Dashboard Content */}
            <main className="flex-1 px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}, {profile.name.split(' ')[0]}!
                        </h1>
                        <p className="text-gray-600">
                            {formatDate(currentTime)} • {formatTime(currentTime)}
                        </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        {/* Check In/Out - Placeholder for QR */}
                        <Link
                            href="/qr-scanner"
                            className="p-6 rounded-lg border-2 border-red-500 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all duration-300 transform hover:scale-105"
                        >
                            <div className="flex items-center justify-center mb-3">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zM6 16H4v4h2v-4zm6-12v1m0 0h2v4h-2M6 4H4v4h2V4zm12 8v4h-4v-4h4z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-lg mb-1">Check In</h3>
                            <p className="text-sm opacity-75">Scan QR to enter</p>
                        </Link>
                    </div>

                    {/* Profile Details (Basic) */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Membership</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-500 text-sm">Member ID</p>
                                <p className="font-mono font-medium">{profile.memberId}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Status</p>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${profile.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {profile.status}
                                </span>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Email</p>
                                <p className="font-medium">{profile.email}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Phone</p>
                                <p className="font-medium">{profile.phone}</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center text-gray-500 mt-10">
                        <p>More features coming soon...</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
