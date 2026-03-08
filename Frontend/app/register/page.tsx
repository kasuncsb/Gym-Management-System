'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authAPI, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Dumbbell, User, Mail, Lock, Phone, Loader2, ArrowRight, Eye, EyeOff, AlertCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    // Emergency contact (mandatory)
    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');
    const [emergencyRelation, setEmergencyRelation] = useState('');
    const router = useRouter();
    const { login, isAuthenticated, isLoading: authLoading } = useAuth();

    // BUG-23 fix: Redirect already-authenticated users away from the register page.
    useEffect(() => {
        if (!authLoading && isAuthenticated) router.replace('/dashboard');
    }, [authLoading, isAuthenticated, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            const response = await authAPI.register({
                fullName: name,
                email,
                password,
                phone,
                gender: gender as 'male' | 'female' | 'other' | undefined || undefined,
                emergencyName,
                emergencyPhone,
                emergencyRelation,
            });

            const { user } = response.data.data;

            // Auto-login — cookies already set by backend
            login({
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            });

            // New member → go to onboarding
            router.push('/onboard');
        } catch (err: any) {
            console.error('Registration failed:', err);
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex relative overflow-hidden selection:bg-red-600/30">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-[-10%] w-125 h-125 bg-red-700/30 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 left-[-10%] w-125 h-125 bg-red-600/20 rounded-full blur-[128px]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808024_1px,transparent_1px),linear-gradient(to_bottom,#80808024_1px,transparent_1px)] bg-size-[24px_24px]" />
            </div>

            {/* Left Side - Visual */}
            <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12 lg:p-16 order-last">
                <div className="flex justify-end">
                    <Link href="/" className="inline-flex items-center gap-2 group mb-12">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-red-700 to-red-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Dumbbell className="text-white" size={24} />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Power<span className="text-red-500">World</span></span>
                    </Link>
                </div>

                <div className="max-w-xl text-right ml-auto">
                    <h1 className="text-5xl font-bold mb-6 leading-tight">
                        Start your <br />
                        <span className="text-transparent bg-clip-text bg-linear-to-l from-red-500 to-red-500">Transformation.</span>
                    </h1>
                    <p className="text-xl text-zinc-400 leading-relaxed">
                        Join thousands of members forging their best selves. Premium facilities, expert coaching, and result-driven community.
                    </p>
                </div>

                <div className="text-sm text-zinc-500 text-right">
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
                        {/* Full Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                                    placeholder="e.g., Kasun Perera"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
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

                        {/* Phone + Gender row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Phone Number</label>
                                <div className="relative group">
                                    <Phone className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors" size={18} />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                                        placeholder="+94 77 123 4567"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Gender</label>
                                <div className="relative group">
                                    <ChevronDown className="absolute right-3 top-3.5 text-zinc-500 pointer-events-none" size={18} />
                                    <select
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="w-full appearance-none bg-black/50 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all cursor-pointer"
                                    >
                                        <option value="" className="bg-zinc-900">Select</option>
                                        <option value="male" className="bg-zinc-900">Male</option>
                                        <option value="female" className="bg-zinc-900">Female</option>
                                        <option value="other" className="bg-zinc-900">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2 relative">
                            <label className="text-sm font-medium text-zinc-300">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setPasswordFocused(true)}
                                    onBlur={() => setPasswordFocused(false)}
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                                    placeholder="Create password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-3.5 text-zinc-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Password Requirements Tooltip */}
                            {passwordFocused && (
                                <div className="absolute top-full left-0 mt-2 w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50">
                                    <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                        <AlertCircle size={14} className="text-red-500" /> Password Requirements
                                    </h4>
                                    <ul className="space-y-1">
                                        {[
                                            { label: "At least 8 characters", valid: password.length >= 8 },
                                            { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
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

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Confirm Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors" size={18} />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                                    placeholder="Confirm password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-3.5 text-zinc-500 hover:text-white transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Emergency Contact — Mandatory */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="h-px flex-1 bg-zinc-800" />
                                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Emergency Contact</span>
                                <div className="h-px flex-1 bg-zinc-800" />
                            </div>
                            <p className="text-xs text-zinc-600">Required for your safety — must be reachable in emergencies.</p>

                            <input
                                type="text"
                                value={emergencyName}
                                onChange={e => setEmergencyName(e.target.value)}
                                placeholder="Contact full name *"
                                required
                                className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="tel"
                                    value={emergencyPhone}
                                    onChange={e => setEmergencyPhone(e.target.value)}
                                    placeholder="Phone *"
                                    required
                                    className="bg-black/50 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                                />
                                <input
                                    type="text"
                                    value={emergencyRelation}
                                    onChange={e => setEmergencyRelation(e.target.value)}
                                    placeholder="Relationship *"
                                    required
                                    className="bg-black/50 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={cn(
                                "w-full py-3.5 rounded-xl font-bold text-white bg-red-700 hover:bg-red-800 transition-all shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 mt-4",
                                isLoading && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Create Account <ArrowRight size={18} /></>}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-zinc-400">
                        Already have an account? {' '}
                        <Link href="/login" className="text-red-500 hover:text-red-400 font-medium hover:underline">
                            Sign in instead
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
