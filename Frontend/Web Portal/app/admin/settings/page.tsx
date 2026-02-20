"use client";

import { useEffect, useState } from "react";
import { authAPI } from "@/lib/api";
import { Loader2, Shield, Mail, Phone } from "lucide-react";

export default function AdminSettingsPage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await authAPI.getProfile();
                setProfile(response.data.data);
            } catch (error) {
                console.error("Failed to load profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-red-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
                <h1 className="text-3xl font-bold text-white">Admin Settings</h1>
                <p className="text-zinc-400 mt-1">Manage your administrator profile and security settings.</p>
            </header>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-6 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-red-600/10 flex items-center justify-center text-red-400 font-bold text-xl">
                        {profile?.fullName?.charAt(0) || "A"}
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">{profile?.fullName || "N/A"}</h2>
                        <p className="text-sm text-zinc-500">Role: {profile?.role || "N/A"}</p>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-zinc-800 bg-black/50 p-4">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Mail size={16} />
                            Email
                        </div>
                        <p className="text-white mt-2">{profile?.email || "Not available"}</p>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-black/50 p-4">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Phone size={16} />
                            Phone
                        </div>
                        <p className="text-white mt-2">{profile?.phone || "Not available"}</p>
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300 text-sm">
                    <Shield size={18} />
                    Multi-factor authentication is enabled for administrator accounts.
                </div>
            </div>
        </div>
    );
}
