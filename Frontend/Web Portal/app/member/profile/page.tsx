"use client";

import { useEffect, useState } from "react";
import { memberAPI, authAPI } from "@/lib/api";
import { User, Mail, Phone, Camera, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
    const { user: authUser } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setIsLoading(true);
            // Decide which API to call based on role or just use generic authAPI.getProfile if available
            // authAPI.getProfile is defined in lib/api.ts
            const response = await authAPI.getProfile();
            const data = response.data.data;
            setFormData({
                name: data.name || "",
                email: data.email || "",
                phone: data.phone || "",
            });
        } catch (error) {
            console.error("Failed to fetch profile:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            await memberAPI.updateProfile(formData);
            // Show success message (toast ideally)
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Failed to update profile:", error);
            alert("Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <Loader2 className="animate-spin text-red-600" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h2 className="text-3xl font-bold text-white">Profile Settings</h2>
                <p className="text-zinc-400 mt-1">Manage your personal information</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1">
                    <div className="p-6 rounded-2xl bg-black/40 border border-zinc-800 backdrop-blur-md flex flex-col items-center text-center">
                        <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-700 to-purple-600 p-0.5">
                                <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                    <span className="text-3xl font-bold text-white uppercase">
                                        {formData.name.charAt(0)}
                                    </span>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={20} className="text-white" />
                            </div>
                        </div>
                        <h3 className="mt-4 text-xl font-bold text-white">{formData.name}</h3>
                        <p className="text-sm text-zinc-500 capitalize">{authUser?.role || 'Member'}</p>

                        <div className="mt-6 w-full space-y-3">
                            <div className="flex items-center gap-3 text-sm text-zinc-400 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                                <Mail size={16} className="text-red-500" />
                                <span className="truncate">{formData.email}</span>
                            </div>
                            {formData.phone && (
                                <div className="flex items-center gap-3 text-sm text-zinc-400 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                                    <Phone size={16} className="text-green-400" />
                                    <span>{formData.phone}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="md:col-span-2">
                    <form onSubmit={handleSave} className="p-6 rounded-2xl bg-black/40 border border-zinc-800 backdrop-blur-md space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors" size={18} />
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-400 cursor-not-allowed"
                                />
                            </div>
                            <p className="text-xs text-zinc-500">Email cannot be changed directly.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Phone Number</label>
                            <div className="relative group">
                                <Phone className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors" size={18} />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className={cn(
                                    "px-6 py-2.5 bg-red-700 text-white rounded-xl font-medium hover:bg-red-700 focus:ring-4 focus:ring-red-600/20 transition-all flex items-center gap-2 shadow-lg shadow-red-600/20",
                                    isSaving && "opacity-70 cursor-not-allowed"
                                )}
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                <span>Save Changes</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
