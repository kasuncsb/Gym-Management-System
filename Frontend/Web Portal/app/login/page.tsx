'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dumbbell, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { getErrorMessage } from '@/lib/api';

export default function LoginPage() {
    const { login, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isLoading, isAuthenticated, router]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            await login(email, password);
            router.push('/dashboard');
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="text-red-600 animate-spin" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Left Panel - Visual */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-red-700/30 rounded-full blur-[128px]" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-red-600/20 rounded-full blur-[128px]" />
                    <div className="absolute inset-0 bg-grid opacity-30" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
                    <div className="w-24 h-24 bg-gradient-to-br from-red-600 to-red-700 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-red-600/30">
                        <Dumbbell className="text-white" size={48} />
                    </div>
                    <h1 className="text-5xl font-bold mb-4 text-center">
                        Power<span className="text-red-600">World</span>
                    </h1>
                    <p className="text-xl text-zinc-400 text-center max-w-md">
                        Transform your body, elevate your mind, achieve greatness.
                    </p>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
                <div className="absolute inset-0 bg-grid opacity-20" />

                <div className="w-full max-w-md relative z-10">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                            <Dumbbell className="text-white" size={24} />
                        </div>
                        <span className="text-2xl font-bold">
                            Power<span className="text-red-600">World</span>
                        </span>
                    </div>

                    {/* Form Card */}
                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl">
                        <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
                        <p className="text-zinc-400 mb-8">Sign in to continue your fitness journey</p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl flex items-center gap-3">
                                    <AlertCircle className="text-red-500 shrink-0" size={20} />
                                    <span className="text-red-400 text-sm">{error}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 outline-none transition-all"
                                        placeholder="you@example.com"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-sm text-zinc-400">Password</label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm text-red-500 hover:text-red-400 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 outline-none transition-all"
                                        placeholder="••••••••"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3.5 rounded-xl font-bold text-white bg-red-700 hover:bg-red-800 transition-all shadow-lg shadow-red-600/25 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-zinc-500">
                            Don&apos;t have an account?{' '}
                            <Link href="/register" className="text-red-500 hover:text-red-400 font-medium transition-colors">
                                Register
                            </Link>
                        </p>
                    </div>

                    {/* Demo Credentials */}
                    <div className="mt-6 bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
                        <p className="text-zinc-500 text-sm font-medium mb-2">Demo Credentials:</p>
                        <p className="text-zinc-400 text-sm">admin@powerworldgyms.lk / Admin123!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
