"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Save, Lock, Eye, EyeOff, Shield, Calendar, Target } from "lucide-react";
import { memberAPI, authAPI, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader, Card, ErrorAlert, Tabs, LoadingButton } from "@/components/ui/SharedComponents";

export default function ProfilePage() {
    const toast = useToast();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [profile, setProfile] = useState<any>(null);
    const [form, setForm] = useState({ fullName: '', phone: '', emergencyContact: '', address: '' });
    const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
    const [pwSaving, setPwSaving] = useState(false);
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);

    useEffect(() => {
        async function fetchProfile() {
            setLoading(true);
            try {
                const res = await memberAPI.getProfile();
                const data = res.data.data;
                setProfile(data);
                setForm({
                    fullName: data.fullName || data.user?.fullName || '',
                    phone: data.phone || data.user?.phone || '',
                    emergencyContact: data.emergencyContact || '',
                    address: data.address || '',
                });
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, []);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await memberAPI.updateProfile(form);
            toast.success("Profile updated", "Your changes have been saved.");
        } catch (err) {
            toast.error("Update failed", getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (pwForm.newPassword !== pwForm.confirm) {
            toast.error("Passwords don't match", "New password and confirmation must be the same.");
            return;
        }
        if (pwForm.newPassword.length < 8) {
            toast.warning("Weak password", "Password must be at least 8 characters.");
            return;
        }
        setPwSaving(true);
        try {
            await authAPI.changePassword(pwForm.oldPassword, pwForm.newPassword);
            toast.success("Password changed", "Your password has been updated successfully.");
            setPwForm({ oldPassword: '', newPassword: '', confirm: '' });
        } catch (err) {
            toast.error("Failed to change password", getErrorMessage(err));
        } finally {
            setPwSaving(false);
        }
    };

    const tabs = [
        { key: "profile", label: "Profile" },
        { key: "security", label: "Security" },
    ];

    if (loading) {
        return (
            <div className="space-y-8 page-enter">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 page-enter">
            <PageHeader title="Profile" subtitle="Manage your personal information and account security" />

            {error && <ErrorAlert message={error} />}

            {/* Profile Header Card */}
            <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
                <div className="relative flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-red-700 to-red-600 flex items-center justify-center border border-red-600/30 shadow-lg shadow-red-900/20">
                        <span className="text-2xl font-bold text-white uppercase">
                            {(form.fullName || user?.fullName || 'U').charAt(0)}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">{form.fullName || 'N/A'}</h3>
                        <p className="text-sm text-zinc-400">{user?.email}</p>
                        <div className="flex items-center gap-3 mt-2">
                            {profile?.experienceLevel && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    {profile.experienceLevel}
                                </span>
                            )}
                            {profile?.membershipStatus && (
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                    profile.membershipStatus === 'active'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                                }`}>
                                    {profile.membershipStatus}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            {/* Profile Tab */}
            {activeTab === "profile" && (
                <Card>
                    <h3 className="text-lg font-bold text-white mb-6">Personal Information</h3>
                    <div className="space-y-5">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1.5">
                                <User size={14} className="text-zinc-500" />
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={form.fullName}
                                onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1.5">
                                    <Mail size={14} className="text-zinc-500" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full px-4 py-2.5 bg-zinc-800/30 border border-zinc-800 rounded-xl text-zinc-500 text-sm cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1.5">
                                    <Phone size={14} className="text-zinc-500" />
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="+94 7X XXX XXXX"
                                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1.5">
                                <Phone size={14} className="text-zinc-500" />
                                Emergency Contact
                            </label>
                            <input
                                type="tel"
                                value={form.emergencyContact}
                                onChange={(e) => setForm(prev => ({ ...prev, emergencyContact: e.target.value }))}
                                placeholder="Emergency contact number"
                                className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1.5">
                                <MapPin size={14} className="text-zinc-500" />
                                Address
                            </label>
                            <textarea
                                value={form.address}
                                onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="Your address"
                                rows={2}
                                className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all resize-none"
                            />
                        </div>

                        {/* Fitness Info (read-only summary) */}
                        {profile?.fitnessGoals && (
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1.5">
                                    <Target size={14} className="text-zinc-500" />
                                    Fitness Goals
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {(Array.isArray(profile.fitnessGoals) ? profile.fitnessGoals : []).map((goal: string, i: number) => (
                                        <span key={i} className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                            {goal}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-4 border-t border-zinc-800">
                            <LoadingButton loading={saving} icon={Save} onClick={handleSaveProfile}>
                                Save Changes
                            </LoadingButton>
                        </div>
                    </div>
                </Card>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
                <Card>
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Shield size={20} className="text-red-400" />
                        Change Password
                    </h3>
                    <div className="max-w-md space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showOld ? "text" : "password"}
                                    value={pwForm.oldPassword}
                                    onChange={(e) => setPwForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOld(!showOld)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1.5">New Password</label>
                            <div className="relative">
                                <input
                                    type={showNew ? "text" : "password"}
                                    value={pwForm.newPassword}
                                    onChange={(e) => setPwForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {pwForm.newPassword && pwForm.newPassword.length < 8 && (
                                <p className="text-xs text-amber-400 mt-1">Password must be at least 8 characters</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Confirm New Password</label>
                            <input
                                type="password"
                                value={pwForm.confirm}
                                onChange={(e) => setPwForm(prev => ({ ...prev, confirm: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all"
                            />
                            {pwForm.confirm && pwForm.confirm !== pwForm.newPassword && (
                                <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                            )}
                        </div>
                        <div className="flex justify-end pt-4 border-t border-zinc-800">
                            <LoadingButton
                                loading={pwSaving}
                                icon={Lock}
                                onClick={handleChangePassword}
                                disabled={!pwForm.oldPassword || !pwForm.newPassword || pwForm.newPassword !== pwForm.confirm}
                            >
                                Change Password
                            </LoadingButton>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
