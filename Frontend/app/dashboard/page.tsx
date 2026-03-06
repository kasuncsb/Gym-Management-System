'use client';

import { useEffect, useState } from 'react';
import { authAPI, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
    User, Mail, Shield, Calendar, Hash, CheckCircle,
    AlertCircle, Lock, Send, Loader2, Eye, EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Profile {
    id: string;
    email: string;
    role: string;
    fullName: string;
    phone: string | null;
    memberCode: string | null;
    memberStatus: string | null;
    joinDate: string | null;
    emailVerified: boolean;
    profile: {
        fitnessGoals: string | null;
        experienceLevel: string | null;
        isOnboarded: boolean;
    } | null;
}

export default function Dashboard() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Change password state
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [pwLoading, setPwLoading] = useState(false);
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');

    // Verification email state
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [verifyMessage, setVerifyMessage] = useState('');

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await authAPI.getProfile();
                setProfile(res.data.data);
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, []);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwError('');
        setPwSuccess('');

        if (newPassword !== confirmNewPassword) {
            setPwError('Passwords do not match');
            return;
        }
        if (newPassword.length < 8) {
            setPwError('Password must be at least 8 characters');
            return;
        }

        setPwLoading(true);
        try {
            await authAPI.changePassword(currentPassword, newPassword);
            setPwSuccess('Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setShowChangePassword(false);
        } catch (err) {
            setPwError(getErrorMessage(err));
        } finally {
            setPwLoading(false);
        }
    };

    const handleSendVerification = async () => {
        setVerifyLoading(true);
        setVerifyMessage('');
        try {
            await authAPI.sendVerificationEmail();
            setVerifyMessage('Verification email sent! Check your inbox.');
        } catch (err) {
            setVerifyMessage(getErrorMessage(err));
        } finally {
            setVerifyLoading(false);
        }
    };

    const roleLabel = (role: string) => {
        const map: Record<string, string> = {
            admin: 'Administrator',
            manager: 'Branch Manager',
            staff: 'Staff',
            trainer: 'Trainer',
            member: 'Member',
        };
        return map[role] || role;
    };

    const roleBadgeColor = (role: string) => {
        const map: Record<string, string> = {
            admin: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
            manager: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
            staff: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
            trainer: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
            member: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        };
        return map[role] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-64 bg-zinc-800 rounded-lg" />
                <div className="h-4 w-96 bg-zinc-800/50 rounded" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-24 bg-zinc-900 border border-zinc-800 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
                <AlertCircle size={20} />
                <span>{error}</span>
            </div>
        );
    }

    const p = profile!;

    return (
        <div className="space-y-8 page-enter">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-zinc-400 mt-1">
                    Welcome back, {p.fullName.split(' ')[0]}
                </p>
            </div>

            {/* Email Verification Banner */}
            {!p.emailVerified && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={20} className="text-amber-400 shrink-0" />
                        <span className="text-amber-300 text-sm">Your email is not verified. Please verify to access all features.</span>
                    </div>
                    <button
                        onClick={handleSendVerification}
                        disabled={verifyLoading}
                        className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-300 text-sm font-medium hover:bg-amber-500/30 transition-colors flex items-center gap-2 shrink-0"
                    >
                        {verifyLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        Send Link
                    </button>
                </div>
            )}
            {verifyMessage && (
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-300">
                    {verifyMessage}
                </div>
            )}

            {/* Profile Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center">
                            <User size={18} className="text-zinc-400" />
                        </div>
                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Full Name</span>
                    </div>
                    <p className="text-white font-semibold text-lg mt-2">{p.fullName}</p>
                </div>

                {/* Email */}
                <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center">
                            <Mail size={18} className="text-zinc-400" />
                        </div>
                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Email</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <p className="text-white font-semibold">{p.email}</p>
                        {p.emailVerified ? (
                            <CheckCircle size={16} className="text-emerald-400" />
                        ) : (
                            <AlertCircle size={16} className="text-amber-400" />
                        )}
                    </div>
                </div>

                {/* Role */}
                <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center">
                            <Shield size={18} className="text-zinc-400" />
                        </div>
                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Role</span>
                    </div>
                    <div className="mt-2">
                        <span className={cn('inline-flex px-3 py-1 rounded-full text-sm font-medium border', roleBadgeColor(p.role))}>
                            {roleLabel(p.role)}
                        </span>
                    </div>
                </div>

                {/* Member Code / Join Date */}
                {p.memberCode && (
                    <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center">
                                <Hash size={18} className="text-zinc-400" />
                            </div>
                            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Member Code</span>
                        </div>
                        <p className="text-white font-mono font-semibold text-lg mt-2">{p.memberCode}</p>
                    </div>
                )}

                {p.joinDate && (
                    <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center">
                                <Calendar size={18} className="text-zinc-400" />
                            </div>
                            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Joined</span>
                        </div>
                        <p className="text-white font-semibold mt-2">
                            {new Date(p.joinDate).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                )}

                {p.phone && (
                    <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center">
                                <User size={18} className="text-zinc-400" />
                            </div>
                            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Phone</span>
                        </div>
                        <p className="text-white font-semibold mt-2">{p.phone}</p>
                    </div>
                )}
            </div>

            {/* Change Password Section */}
            <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800 overflow-hidden">
                <button
                    onClick={() => { setShowChangePassword(!showChangePassword); setPwError(''); setPwSuccess(''); }}
                    className="w-full p-5 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center">
                            <Lock size={18} className="text-zinc-400" />
                        </div>
                        <div className="text-left">
                            <p className="text-white font-semibold">Change Password</p>
                            <p className="text-xs text-zinc-500">Update your account password</p>
                        </div>
                    </div>
                    <span className="text-zinc-500 text-sm">{showChangePassword ? '▲' : '▼'}</span>
                </button>

                {showChangePassword && (
                    <form onSubmit={handleChangePassword} className="px-5 pb-5 space-y-4 border-t border-zinc-800 pt-4">
                        {pwError && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                                <AlertCircle size={14} /> {pwError}
                            </div>
                        )}
                        {pwSuccess && (
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                                <CheckCircle size={14} /> {pwSuccess}
                            </div>
                        )}

                        <div className="relative">
                            <input
                                type={showCurrentPw ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                placeholder="Current Password"
                                required
                                className="w-full bg-black/50 border border-zinc-700 rounded-xl py-3 px-4 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                            />
                            <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-4 top-3.5 text-zinc-500 hover:text-white">
                                {showCurrentPw ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div className="relative">
                            <input
                                type={showNewPw ? 'text' : 'password'}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="New Password (min 8 chars, uppercase, number)"
                                required
                                className="w-full bg-black/50 border border-zinc-700 rounded-xl py-3 px-4 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                            />
                            <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-4 top-3.5 text-zinc-500 hover:text-white">
                                {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <input
                            type="password"
                            value={confirmNewPassword}
                            onChange={e => setConfirmNewPassword(e.target.value)}
                            placeholder="Confirm New Password"
                            required
                            className="w-full bg-black/50 border border-zinc-700 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                        />

                        <button
                            type="submit"
                            disabled={pwLoading}
                            className={cn(
                                "w-full py-3 rounded-xl font-bold text-white bg-red-700 hover:bg-red-800 transition-all shadow-lg shadow-red-600/25 flex items-center justify-center gap-2",
                                pwLoading && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            {pwLoading ? <Loader2 className="animate-spin" size={18} /> : 'Update Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
