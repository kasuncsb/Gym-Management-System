"use client";

import { useState } from "react";
import { Bell, Shield, Eye, Smartphone, Save, Moon, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, Card, LoadingButton } from "@/components/ui/SharedComponents";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const toast = useToast();
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [pushNotifs, setPushNotifs] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            // TODO: integrate with backend settings API when available
            toast.info("Not available", "Settings management is not yet implemented.");
        } finally {
            setSaving(false);
        }
    };

    const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
        <button
            onClick={onChange}
            className={cn("w-12 h-6 rounded-full p-1 transition-colors duration-300 relative", enabled ? "bg-red-600" : "bg-zinc-700")}
        >
            <div className={cn("w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300", enabled ? "translate-x-6" : "translate-x-0")} />
        </button>
    );

    return (
        <div className="max-w-4xl space-y-8 page-enter">
            <PageHeader title="Settings" subtitle="Manage your application preferences" />

            <div className="space-y-6">
                {/* Notifications */}
                <Card>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-red-500/10 text-red-400"><Bell size={20} /></div>
                        <h3 className="text-lg font-bold text-white">Notifications</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
                            <div>
                                <h4 className="font-medium text-white">Email Notifications</h4>
                                <p className="text-sm text-zinc-500">Receive weekly digests and billing updates.</p>
                            </div>
                            <Toggle enabled={emailNotifs} onChange={() => setEmailNotifs(!emailNotifs)} />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
                            <div>
                                <h4 className="font-medium text-white">Push Notifications</h4>
                                <p className="text-sm text-zinc-500">Get real-time updates on your device.</p>
                            </div>
                            <Toggle enabled={pushNotifs} onChange={() => setPushNotifs(!pushNotifs)} />
                        </div>
                    </div>
                </Card>

                {/* Privacy & Security */}
                <Card>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-green-500/10 text-green-400"><Shield size={20} /></div>
                        <h3 className="text-lg font-bold text-white">Privacy & Security</h3>
                    </div>
                    <div className="space-y-4">
                        <button
                            onClick={() => toast.info("Not available", "Two-factor authentication is not yet implemented.")}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:border-zinc-700 transition group text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400 group-hover:text-white transition"><Smartphone size={18} /></div>
                                <div>
                                    <h4 className="font-medium text-white group-hover:text-red-400 transition">Two-Factor Authentication</h4>
                                    <p className="text-sm text-zinc-500">Add an extra layer of security.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">Recommended</span>
                                <ChevronRight size={16} className="text-zinc-600" />
                            </div>
                        </button>
                        <button
                            onClick={() => toast.info("Not available", "Session management is not yet implemented.")}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:border-zinc-700 transition group text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400 group-hover:text-white transition"><Eye size={18} /></div>
                                <div>
                                    <h4 className="font-medium text-white group-hover:text-red-400 transition">Active Sessions</h4>
                                    <p className="text-sm text-zinc-500">Manage devices logged into your account.</p>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-zinc-600" />
                        </button>
                    </div>
                </Card>

                {/* Appearance */}
                <Card>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400"><Eye size={20} /></div>
                        <h3 className="text-lg font-bold text-white">Appearance</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <button className="p-4 rounded-xl border-2 border-red-600 bg-zinc-900/50 flex flex-col items-center gap-2">
                            <Moon size={24} className="text-red-500" />
                            <span className="text-sm font-medium text-white">Pure Black</span>
                        </button>
                        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col items-center gap-2 opacity-50">
                            <div className="w-6 h-6 rounded-full bg-zinc-700" />
                            <span className="text-sm font-medium text-zinc-500">Light (N/A)</span>
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end pt-4">
                    <LoadingButton loading={saving} onClick={handleSave}>
                        <Save size={16} className="mr-1.5" /> Save Changes
                    </LoadingButton>
                </div>
            </div>
        </div>
    );
}
