'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";

export default function StaffDashboard() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
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
    }, [router]);

    if (loading || !profile) return <div className="flex h-screen items-center justify-center"><div className="animate-spin h-10 w-10 border-b-2 border-red-600 rounded-full"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="bg-white text-gray-900 py-4 px-6 relative z-10 border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Link href="/" className="flex items-center space-x-3 group">
                            <Image src="/logo.png" alt="Logo" width={50} height={50} className="transition-transform group-hover:scale-105" priority />
                            <span className="text-xl font-bold text-gray-900 group-hover:text-red-500 transition-colors">PowerWorld Staff</span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Staff</div>
                            <div className="text-gray-900 font-semibold">{profile.name}</div>
                        </div>
                        <button onClick={() => { localStorage.removeItem('token'); router.push('/login'); }} className="text-red-500 hover:text-red-700 text-sm">Logout</button>
                    </div>
                </div>
            </nav>

            <main className="flex-1 px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Portal</h1>
                        <p className="text-gray-600">Welcome, {profile.name}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Link href="/qr-scanner" className="p-6 bg-red-50 border border-red-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center justify-center mb-4 text-red-500">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zM6 16H4v4h2v-4zm6-12v1m0 0h2v4h-2M6 4H4v4h2V4zm12 8v4h-4v-4h4z" /></svg>
                            </div>
                            <h3 className="text-center font-bold text-gray-900">QR Check-in</h3>
                        </Link>
                    </div>

                    <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
                    <div className="bg-white border rounded-lg p-6 text-center text-gray-500">
                        No appointments scheduled for today.
                    </div>

                </div>
            </main>
        </div>
    );
}
