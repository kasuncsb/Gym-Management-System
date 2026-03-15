'use client';

import { useState } from 'react';
import Link from "next/link";
import { authAPI, getErrorMessage } from "@/lib/api";
import { Mail, Loader2, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await authAPI.forgotPassword(email);
            setIsSuccess(true);
        } catch (err: unknown) {
            console.error('Forgot password failed:', err);
            // Even if failed (e.g. user not found), usually we show success to prevent enumeration.
            // But api might throw error if rate limited or server error, and we want to show that.
            // For now let's just show the error if it's explicitly returned, otherwise generic.
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-app text-white flex items-center justify-center p-6 relative overflow-hidden selection:bg-red-600/30">
                {/* Grid — matches dashboard, fades towards center */}
                <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#3c3c3c35_1px,transparent_1px),linear-gradient(to_bottom,#3c3c3c35_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black_90%)] pointer-events-none" />

                <div className="w-full max-w-md bg-zinc-800/80 backdrop-blur-xl border border-zinc-700 p-8 rounded-3xl shadow-2xl relative z-10 text-center mx-auto">
                    <div className="w-16 h-16 bg-red-700/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="text-red-600" size={32} />
                    </div>

                    <h2 className="text-2xl font-bold mb-4">Check Your Email</h2>
                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        If an account exists for <span className="text-white font-medium">{email}</span>,
                        we have sent a password reset link to it. Currently it may take a few minutes to arrive.
                    </p>

                    <Link
                        href="/login"
                        className="w-full py-3.5 rounded-xl font-bold text-white bg-red-700 hover:bg-red-800 transition-all shadow-lg shadow-red-600/10 flex items-center justify-center gap-2"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app text-white flex relative overflow-hidden selection:bg-red-600/30">
            {/* Grid — matches dashboard, fades towards center */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#3c3c3c35_1px,transparent_1px),linear-gradient(to_bottom,#3c3c3c35_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black_90%)] pointer-events-none" />

            <div className="relative z-10 w-full flex flex-col items-center justify-center p-6 py-12">
                <div className="w-full max-w-md bg-zinc-800/80 backdrop-blur-xl border border-zinc-700 p-8 rounded-3xl shadow-2xl">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
                        <p className="text-zinc-400 text-sm">Enter your email to receive recovery instructions.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {error}
                        </div>
                    )}

                    <form id="forgot-password-form" onSubmit={handleSubmit} className="w-full space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="forgot-password-email" className="block text-sm font-medium text-zinc-300">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors pointer-events-none" size={18} />
                                <input
                                    id="forgot-password-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                                    placeholder="name@example.com"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <button
                            id="forgot-password-submit"
                            type="submit"
                            disabled={isLoading}
                            className={cn(
                                "w-full py-3.5 rounded-xl font-bold text-white bg-red-700 hover:bg-red-800 transition-all shadow-lg shadow-red-600/10 flex items-center justify-center gap-2",
                                isLoading && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Send Reset Link"}
                            {!isLoading && <ArrowRight size={18} />}
                        </button>
                    </form>

                    <div className="mt-8 text-sm text-zinc-400">
                        <Link href="/login" className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors">
                            <ArrowLeft size={16} /> Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
