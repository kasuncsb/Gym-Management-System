'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";

export default function ManagerDashboard() {
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

    if (loading || !profile) return <div className="flex h-screen items-center justify-center"><div className="animate-spin h-10 w-10 border-b-2 border-red-600 rounded-full"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="bg-white text-gray-900 py-4 px-6 relative z-10 border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Link href="/" className="flex items-center space-x-3 group">
                            <Image src="/logo.png" alt="Logo" width={50} height={50} className="transition-transform group-hover:scale-105" priority />
                            <span className="text-xl font-bold text-gray-900 group-hover:text-red-500 transition-colors">PowerWorld Manager</span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Manager</div>
                            <div className="text-gray-900 font-semibold">{profile.name}</div>
                        </div>
                        <button onClick={() => { localStorage.removeItem('token'); router.push('/login'); }} className="text-red-500 hover:text-red-700 text-sm">Logout</button>
                    </div>
                </div>
            </nav>

            <main className="flex-1 px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Branch Management</h1>
                        <p className="text-gray-600">{currentTime.toLocaleString()}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="p-6 bg-white rounded-lg border shadow-sm">
                            <h3 className="text-xl font-semibold mb-2">Staff Shifts</h3>
                            <p className="text-gray-600">Manage daily schedules.</p>
                        </div>
                        <div className="p-6 bg-white rounded-lg border shadow-sm">
                            <h3 className="text-xl font-semibold mb-2">Inventory</h3>
                            <p className="text-gray-600">Track equipment and supplies.</p>
                        </div>
                        <div className="p-6 bg-white rounded-lg border shadow-sm">
                            <h3 className="text-xl font-semibold mb-2">Member Feedback</h3>
                            <p className="text-gray-600">Review complaints and suggestions.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
