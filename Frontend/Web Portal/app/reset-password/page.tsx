'use client';

import { useState, Suspense } from 'react';
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authAPI, getErrorMessage } from "@/lib/api";
import { Dumbbell, Lock, Loader2, ArrowRight, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (!token) {
            setError('Invalid reset token');
            return;
        }

        try {
            await authAPI.resetPassword(token, password);
            setIsSuccess(true);
        } catch (err: any) {
            console.error('Reset password failed:', err);
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl relative z-10 text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-green-500" size={32} />
                </div>

                <h2 className="text-2xl font-bold mb-4">Password Reset!</h2>
                <p className="text-zinc-400 mb-8 leading-relaxed">
                    Your password has been successfully updated. You can now login with your new password.
                </p>

                <Link
                    href="/login"
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                >
                    Go to Login <ArrowRight size={18} />
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl relative z-10">
            <div className="mb-8 text-center">
                <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Dumbbell className="text-white" size={18} />
                    </div>
                    <span className="text-lg font-bold">PowerWorld</span>
                </Link>
                <h2 className="text-2xl font-bold mb-2">Set New Password</h2>
                <p className="text-zinc-400">Please enter your new password below.</p>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">New Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                            placeholder="Min 8 characters"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Confirm Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                            placeholder="Confirm new password"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className={cn(
                        "w-full py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 mt-4",
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
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[128px]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            </div>

            <Suspense fallback={
                <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl relative z-10 text-center">
                    <Loader2 className="text-indigo-500 animate-spin mx-auto" size={32} />
                </div>
            }>
                <ResetPasswordContent />
            </Suspense>
        </div>
    );
}
