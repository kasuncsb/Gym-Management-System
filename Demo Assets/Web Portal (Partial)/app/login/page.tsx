'use client';

import { useState } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authAPI, getErrorMessage } from "@/lib/api";
import { Dumbbell, ArrowLeft, Mail, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await authAPI.login(email, password);
            const { accessToken, refreshToken, user } = response.data.data;

            login(accessToken, refreshToken, {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                phone: user.phone,
                avatarUrl: user.avatarUrl,
            });

            // Redirect based on role
            if (user.role === 'admin') {
                router.push('/admin-dashboard');
            } else if (user.role === 'manager') {
                router.push('/manager-dashboard');
            } else if (user.role === 'staff' || user.role === 'trainer') {
                router.push('/staff-dashboard');
            } else {
                router.push('/member');
            }

        } catch (err: any) {
            console.error('Login failed:', err);
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex relative overflow-hidden selection:bg-red-600/30">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-[-10%] w-125 h-125 bg-red-700/30 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 right-[-10%] w-125 h-125 bg-red-600/20 rounded-full blur-[128px]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808024_1px,transparent_1px),linear-gradient(to_bottom,#80808024_1px,transparent_1px)] bg-size-[24px_24px]" />
            </div>

            {/* Left Side - Visual */}
            <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12 lg:p-16">
                <div>
                    <Link href="/" className="inline-flex items-center gap-2 group mb-12">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-red-700 to-red-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Dumbbell className="text-white" size={24} />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Power<span className="text-red-500">World</span></span>
                    </Link>
                </div>

                <div className="max-w-xl">
                    <h1 className="text-5xl font-bold mb-6 leading-tight">
                        Welcome back to <br />
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-red-500 to-red-500">Elite Fitness.</span>
                    </h1>
                    <p className="text-xl text-zinc-400 leading-relaxed">
                        Track your progress, book classes, and crush your goals with our premium management platform.
                    </p>
                </div>

                <div className="text-sm text-zinc-500">
                    © {new Date().getFullYear()} PowerWorld Gyms. All rights reserved.
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
                <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl">
                    <div className="mb-8 text-center lg:text-left">
                        <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-8">
                            <div className="w-8 h-8 rounded-lg bg-red-700 flex items-center justify-center">
                                <Dumbbell className="text-white" size={18} />
                            </div>
                            <span className="text-lg font-bold">PowerWorld</span>
                        </Link>
                        <h2 className="text-2xl font-bold mb-2">Sign In</h2>
                        <p className="text-zinc-400">Enter your details to access your account.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-zinc-300">Password</label>
                                <Link href="/forgot-password" className="text-xs text-red-500 hover:text-red-400">Forgot password?</Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={cn(
                                "w-full py-3.5 rounded-xl font-bold text-white bg-red-700 hover:bg-red-800 transition-all shadow-lg shadow-red-600/25 flex items-center justify-center gap-2",
                                isLoading && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Sign In Account"}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-zinc-400">
                        Don&apos;t have an account? {' '}
                        <Link href="/register" className="text-red-500 hover:text-red-400 font-medium hover:underline">
                            Create Account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
