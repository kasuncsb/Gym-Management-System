'use client';

import { useState } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { Dumbbell, User, Mail, Lock, Phone, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Register() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await authAPI.register({
                name,
                email,
                password,
                phone
            });

            // Navigate to login
            router.push('/login');
        } catch (err: any) {
            console.error('Registration failed:', err);
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex relative overflow-hidden selection:bg-indigo-500/30">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[128px]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            </div>

            {/* Left Side - Visual */}
            <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12 lg:p-16 order-last">
                <div className="flex justify-end">
                    <Link href="/" className="inline-flex items-center gap-2 group mb-12">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Dumbbell className="text-white" size={24} />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Power<span className="text-indigo-400">World</span></span>
                    </Link>
                </div>

                <div className="max-w-xl text-right ml-auto">
                    <h1 className="text-5xl font-bold mb-6 leading-tight">
                        Start your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-400 to-blue-500">Transformation.</span>
                    </h1>
                    <p className="text-xl text-zinc-400 leading-relaxed">
                        Join thousands of members forging their best selves. Premium facilities, expert coding, and result-driven community.
                    </p>
                </div>

                <div className="text-sm text-zinc-500 text-right">
                    © 2025 PowerWorld Gyms. All rights reserved.
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
                <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl">
                    <div className="mb-8 text-center lg:text-left">
                        <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-8">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                                <Dumbbell className="text-white" size={18} />
                            </div>
                            <span className="text-lg font-bold">PowerWorld</span>
                        </Link>
                        <h2 className="text-2xl font-bold mb-2">Create Account</h2>
                        <p className="text-zinc-400">Join the elite fitness community today.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>

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

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Phone Number</label>
                            <div className="relative group">
                                <Phone className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                    placeholder="+94 77 123 4567"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                    placeholder="Create password"
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
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Create Account"}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-zinc-400">
                        Already have an account? {' '}
                        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline">
                            Sign in instead
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
