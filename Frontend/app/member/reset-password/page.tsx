'use client';

import { useState, Suspense } from 'react';
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authAPI, getErrorMessage } from "@/lib/api";
import { Lock, Loader2, ArrowRight, CheckCircle, Eye, EyeOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();

    const validatePassword = (pwd: string): boolean =>
        pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[a-z]/.test(pwd);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError('Invalid reset token. Please request a new password reset link.');
            return;
        }

        if (!validatePassword(password)) {
            setError('Password must be at least 8 characters with one uppercase letter and one number.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        try {
            await authAPI.resetPassword(token, password);
            setIsSuccess(true);
        } catch (err: unknown) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="w-full max-w-md bg-zinc-800/80 backdrop-blur-xl border border-zinc-700 p-8 rounded-3xl shadow-2xl relative z-10 text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-green-500" size={32} />
                </div>

                <h2 className="text-2xl font-bold mb-4">Password Reset!</h2>
                <p className="text-zinc-400 mb-8 leading-relaxed">
                    Your password has been successfully updated. You can now login with your new password.
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
        <div className="w-full max-w-md bg-zinc-800/80 backdrop-blur-xl border border-zinc-700 p-8 rounded-3xl shadow-2xl relative z-10">
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">Set New Password</h2>
                <p className="text-zinc-400 text-sm">Create a strong password for your account.</p>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2" id="reset-password-error" role="alert">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <form id="reset-password-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2 relative">
                    <label htmlFor="reset-password-new" className="text-sm font-medium text-zinc-300">New Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors pointer-events-none" size={18} />
                        <input
                            id="reset-password-new"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={() => setPasswordFocused(false)}
                            className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-10 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                            placeholder="Create password"
                            required
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-3.5 text-zinc-500 hover:text-white transition-colors"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {passwordFocused && (
                        <div className="absolute top-full left-0 mt-4 w-full lg:top-1/2 lg:-translate-y-1/2 lg:left-full lg:ml-6 lg:mt-0 lg:w-72 p-4 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50">
                            <div className="absolute w-3 h-3 bg-zinc-900 border-zinc-800 transform rotate-45 -top-1.5 left-1/2 -translate-x-1/2 border-t border-l lg:top-1/2 lg:-left-1.5 lg:-translate-y-1/2 lg:translate-x-0 lg:border-t-0 lg:border-l lg:border-b" />
                            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                <AlertCircle size={14} className="text-red-500" /> Password Requirements
                            </h4>
                            <ul className="space-y-1">
                                {[
                                    { label: "At least 8 characters", valid: password.length >= 8 },
                                    { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
                                    { label: "One lowercase letter", valid: /[a-z]/.test(password) },
                                    { label: "One number", valid: /[0-9]/.test(password) },
                                ].map((req, i) => (
                                    <li key={i} className={cn("text-xs flex items-center gap-2", req.valid ? "text-green-400" : "text-zinc-500")}>
                                        <div className={cn("w-1.5 h-1.5 rounded-full", req.valid ? "bg-green-400" : "bg-zinc-700")} />
                                        {req.label}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="reset-password-confirm" className="text-sm font-medium text-zinc-300">Confirm Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors pointer-events-none" size={18} />
                        <input
                            id="reset-password-confirm"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-10 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                            placeholder="Confirm new password"
                            required
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-3.5 text-zinc-500 hover:text-white transition-colors"
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <button
                    id="reset-password-submit"
                    type="submit"
                    disabled={isLoading}
                    className={cn(
                        "w-full py-3.5 rounded-xl font-bold text-white bg-red-700 hover:bg-red-800 transition-all shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 mt-4",
                        isLoading && "opacity-70 cursor-not-allowed"
                    )}
                >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Reset Password"}
                </button>
            </form>
        </div>
    );
}

export default function ResetPassword() {
    return (
        <div className="min-h-screen bg-app text-white flex items-center justify-center p-6 relative overflow-hidden selection:bg-red-600/30">
            {/* Grid — matches auth theme */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#3c3c3c35_1px,transparent_1px),linear-gradient(to_bottom,#3c3c3c35_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black_90%)] pointer-events-none" />

            <Suspense fallback={
                <div className="w-full max-w-md bg-zinc-800/80 backdrop-blur-xl border border-zinc-700 p-8 rounded-3xl shadow-2xl relative z-10 text-center">
                    <Loader2 className="text-red-600 animate-spin mx-auto" size={32} />
                </div>
            }>
                <ResetPasswordContent />
            </Suspense>
        </div>
    );
}
