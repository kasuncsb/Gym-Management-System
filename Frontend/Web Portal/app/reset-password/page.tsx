'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, getErrorMessage } from '@/lib/api';
import { Dumbbell, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    // Password requirements check
    const passwordChecks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
    };
    const allPasswordChecksPass = Object.values(passwordChecks).every(Boolean);
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError('Invalid reset token. Please request a new password reset link.');
            return;
        }

        if (!allPasswordChecksPass) {
            setError('Password does not meet requirements');
            return;
        }

        if (!passwordsMatch) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            await api.resetPassword(token, password);
            setIsSuccess(true);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    // Success Screen
    if (isSuccess) {
        return (
            <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl relative z-10 text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-green-500" size={32} />
                </div>
                <h2 className="text-2xl font-bold mb-4">Password Reset!</h2>
                <p className="text-zinc-400 mb-8 leading-relaxed">
                    Your password has been successfully updated. You can now sign in with your new password.
                </p>
                <Link
                    href="/login"
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-red-700 hover:bg-red-800 transition-all shadow-lg shadow-red-600/25 flex items-center justify-center gap-2"
                >
                    Go to Login <ArrowRight size={18} />
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md relative z-10">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                    <Dumbbell className="text-white" size={24} />
                </div>
                <span className="text-2xl font-bold">
                    Power<span className="text-red-600">World</span>
                </span>
            </div>

            {/* Form Card */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl">
                <h2 className="text-2xl font-bold mb-2">Set New Password</h2>
                <p className="text-zinc-400 mb-6">Create a strong password for your account.</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl flex items-center gap-3 mb-6">
                        <AlertCircle className="text-red-500 shrink-0" size={20} />
                        <span className="text-red-400 text-sm">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Password */}
                    <div className="space-y-2 relative">
                        <label className="text-sm text-zinc-400">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                                className="w-full pl-12 pr-12 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 outline-none transition-all"
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Password Requirements Tooltip */}
                        {(passwordFocused || password.length > 0) && (
                            <div className="absolute left-0 right-0 top-full mt-2 bg-zinc-800 border border-zinc-700 rounded-xl p-4 z-20 shadow-xl">
                                <p className="text-xs text-zinc-400 mb-2">Password must contain:</p>
                                <div className="space-y-1.5">
                                    {[
                                        { check: passwordChecks.length, label: 'At least 8 characters' },
                                        { check: passwordChecks.uppercase, label: 'One uppercase letter' },
                                        { check: passwordChecks.lowercase, label: 'One lowercase letter' },
                                        { check: passwordChecks.number, label: 'One number' },
                                    ].map(({ check, label }) => (
                                        <div key={label} className="flex items-center gap-2 text-xs">
                                            {check ? (
                                                <CheckCircle className="text-green-500" size={14} />
                                            ) : (
                                                <div className="w-3.5 h-3.5 rounded-full border border-zinc-600" />
                                            )}
                                            <span className={check ? 'text-green-500' : 'text-zinc-500'}>{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <label className="text-sm text-zinc-400">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-12 pr-12 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 outline-none transition-all"
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {confirmPassword && !passwordsMatch && (
                            <p className="text-red-400 text-xs">Passwords do not match</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !allPasswordChecksPass}
                        className="w-full py-3.5 rounded-xl font-bold text-white bg-red-700 hover:bg-red-800 transition-all shadow-lg shadow-red-600/25 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Resetting...
                            </>
                        ) : (
                            'Reset Password'
                        )}
                    </button>
                </form>

                <Link
                    href="/login"
                    className="mt-6 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    Back to Login
                </Link>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-red-700/20 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 left-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[128px]" />
                <div className="absolute inset-0 bg-grid" />
            </div>

            <Suspense fallback={
                <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl relative z-10 flex items-center justify-center">
                    <Loader2 className="text-red-600 animate-spin" size={32} />
                </div>
            }>
                <ResetPasswordContent />
            </Suspense>
        </div>
    );
}
