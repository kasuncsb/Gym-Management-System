'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, getErrorMessage } from '@/lib/api';
import { Dumbbell, Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await api.forgotPassword(email);
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
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-red-700/20 rounded-full blur-[128px]" />
                    <div className="absolute bottom-0 left-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[128px]" />
                    <div className="absolute inset-0 bg-grid" />
                </div>

                <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl relative z-10 text-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="text-green-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Check Your Email</h2>
                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        If an account exists for <span className="text-white font-medium">{email}</span>, we've sent a password reset link.
                    </p>
                    <Link
                        href="/login"
                        className="w-full py-3.5 rounded-xl font-bold text-white bg-red-700 hover:bg-red-800 transition-all shadow-lg shadow-red-600/25 flex items-center justify-center"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-red-700/20 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 left-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[128px]" />
                <div className="absolute inset-0 bg-grid" />
            </div>

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
                    <h2 className="text-2xl font-bold mb-2">Forgot Password?</h2>
                    <p className="text-zinc-400 mb-6">
                        Enter your email and we'll send you a link to reset your password.
                    </p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl flex items-center gap-3 mb-6">
                            <AlertCircle className="text-red-500 shrink-0" size={20} />
                            <span className="text-red-400 text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 outline-none transition-all"
                                    placeholder="you@example.com"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 rounded-xl font-bold text-white bg-red-700 hover:bg-red-800 transition-all shadow-lg shadow-red-600/25 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Sending...
                                </>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>
                    </form>

                    <Link
                        href="/login"
                        className="mt-6 flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
