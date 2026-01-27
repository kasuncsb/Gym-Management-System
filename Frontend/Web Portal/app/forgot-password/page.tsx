'use client';

import { useState } from 'react';
import Link from "next/link";
import { authAPI, getErrorMessage } from "@/lib/api";
import { Dumbbell, Mail, Loader2, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
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
        } catch (err: any) {
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
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[128px]" />
                    <div className="absolute bottom-0 left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[128px]" />
                </div>

                <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl relative z-10 text-center">
                    <div className="w-16 h-16 bg-indigo-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="text-indigo-500" size={32} />
                    </div>

                    <h2 className="text-2xl font-bold mb-4">Check Your Email</h2>
                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        If an account exists for <span className="text-white font-medium">{email}</span>,
                        we have sent a password reset link to it. Currently it may take a few minutes to arrive.
                    </p>

                    <Link
                        href="/login"
                        className="w-full py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex relative overflow-hidden selection:bg-indigo-500/30">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[128px]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            </div>

            <div className="w-full flex items-center justify-center p-6 relative z-10 h-screen">
                <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl">
                    <div className="mb-8 text-center">
                        <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <Dumbbell className="text-white" size={18} />
                            </div>
                            <span className="text-lg font-bold">PowerWorld</span>
                        </Link>
                        <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
                        <p className="text-zinc-400">Enter your email to receive recovery instructions.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={cn(
                                "w-full py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2",
                                isLoading && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Send Reset Link"}
                            {!isLoading && <ArrowRight size={18} />}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link href="/login" className="text-zinc-400 hover:text-white flex items-center justify-center gap-2 transition-colors">
                            <ArrowLeft size={16} /> Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
