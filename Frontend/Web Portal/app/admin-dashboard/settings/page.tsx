"use client";

import { useState } from "react";
import { Bell, Shield, Eye, Smartphone, Save, Globe, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [pushNotifs, setPushNotifs] = useState(false);

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white">Settings</h2>
                <p className="text-zinc-400 mt-1">Manage your application preferences</p>
            </div>

            <div className="space-y-6">
                {/* Notifications Section */}
                <div className="p-6 rounded-2xl bg-black/40 border border-zinc-800 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-red-600/10 text-red-500">
                            <Bell size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white">Notifications</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
                            <div>
                                <h4 className="font-medium text-white">Email Notifications</h4>
                                <p className="text-sm text-zinc-500">Receive weekly digests and billing updates.</p>
                            </div>
                            <button
                                onClick={() => setEmailNotifs(!emailNotifs)}
                                className={cn(
                                    "w-12 h-6 rounded-full p-1 transition-colors duration-300 relative",
                                    emailNotifs ? "bg-red-700" : "bg-zinc-700"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300",
                                    emailNotifs ? "translate-x-6" : "translate-x-0"
                                )} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
                            <div>
                                <h4 className="font-medium text-white">Push Notifications</h4>
                                <p className="text-sm text-zinc-500">Get real-time updates on your device.</p>
                            </div>
                            <button
                                onClick={() => setPushNotifs(!pushNotifs)}
                                className={cn(
                                    "w-12 h-6 rounded-full p-1 transition-colors duration-300 relative",
                                    pushNotifs ? "bg-red-700" : "bg-zinc-700"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300",
                                    pushNotifs ? "translate-x-6" : "translate-x-0"
                                )} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Privacy & Security */}
                <div className="p-6 rounded-2xl bg-black/40 border border-zinc-800 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                            <Shield size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white">Privacy & Security</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:border-zinc-700 transition cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400 group-hover:text-white transition">
                                    <Smartphone size={18} />
                                </div>
                                <div>
                                    <h4 className="font-medium text-white group-hover:text-red-500 transition">Two-Factor Authentication</h4>
                                    <p className="text-sm text-zinc-500">Add an extra layer of security.</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">Recommended</span>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:border-zinc-700 transition cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400 group-hover:text-white transition">
                                    <Globe size={18} />
                                </div>
                                <div>
                                    <h4 className="font-medium text-white group-hover:text-red-500 transition">Active Sessions</h4>
                                    <p className="text-sm text-zinc-500">Manage devices logged into your account.</p>
                                </div>
                            </div>
                            <ChevronRightIcon />
                        </div>
                    </div>
                </div>

                {/* Appearance */}
                <div className="p-6 rounded-2xl bg-black/40 border border-zinc-800 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                            <Eye size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white">Appearance</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <button className="p-4 rounded-xl border-2 border-red-600 bg-zinc-900/50 flex flex-col items-center gap-2">
                            <Moon size={24} className="text-red-500" />
                            <span className="text-sm font-medium text-white">Pure Black</span>
                        </button>
                        <button className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
                            <div className="w-6 h-6 rounded-full bg-zinc-700" />
                            <span className="text-sm font-medium text-zinc-500">Light (N/A)</span>
                        </button>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button className="px-6 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition flex items-center gap-2">
                        <Save size={18} />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

function ChevronRightIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600">
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}
