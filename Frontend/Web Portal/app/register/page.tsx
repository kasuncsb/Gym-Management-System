'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dumbbell, Mail, Lock, User, Phone, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { getErrorMessage } from '@/lib/api';

export default function RegisterPage() {
    const { register, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        gender: '' as '' | 'male' | 'female' | 'other',
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isLoading, isAuthenticated, router]);

    // Password requirements check
    const passwordChecks = {
        length: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        lowercase: /[a-z]/.test(formData.password),
        number: /\d/.test(formData.password),
    };
    const allPasswordChecksPass = Object.values(passwordChecks).every(Boolean);
    const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!allPasswordChecksPass) {
            setError('Password does not meet requirements');
            return;
        }

        if (!passwordsMatch) {
            setError('Passwords do not match');
            return;
        }

        setSubmitting(true);

        try {
            await register({
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName,
                phone: formData.phone || undefined,
                gender: formData.gender || undefined,
            });
            setSuccess(true);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="text-red-600 animate-spin" size={40} />
            </div>
        );
    }

    // Success Screen
    if (success) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-red-700/20 rounded-full blur-[128px]" />
                    <div className="absolute bottom-0 left-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[128px]" />
                    <div className="absolute inset-0 bg-grid" />
                </div>

                <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl relative z-10 text-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="text-green-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Registration Successful!</h2>
                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        Please check your email to verify your account.
                        Once verified, you can sign in to access your dashboard.
                    </p>
                    <Link
                        href="/login"
                        className="w-full py-3.5 rounded-xl font-bold text-white bg-red-700 hover:bg-red-800 transition-all shadow-lg shadow-red-600/25 flex items-center justify-center"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 py-12 relative overflow-hidden">
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
                    <h2 className="text-2xl font-bold mb-2">Create Account</h2>
                    <p className="text-zinc-400 mb-6">Join PowerWorld and start your journey</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl flex items-center gap-3">
                                <AlertCircle className="text-red-500 shrink-0" size={20} />
                                <span className="text-red-400 text-sm">{error}</span>
                            </div>
                        )}

                        {/* Full Name */}
                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400">Full Name *</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    name="fullName"
                                    type="text"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 outline-none transition-all"
                                    placeholder="John Doe"
                                    required
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400">Email *</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 outline-none transition-all"
                                    placeholder="you@example.com"
                                    required
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 outline-none transition-all"
                                    placeholder="+94 77 123 4567"
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        {/* Gender */}
                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400">Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 outline-none transition-all appearance-none"
                                disabled={submitting}
                            >
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Password */}
                        <div className="space-y-2 relative">
                            <label className="text-sm text-zinc-400">Password *</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    onFocus={() => setPasswordFocused(true)}
                                    onBlur={() => setPasswordFocused(false)}
                                    className="w-full pl-12 pr-12 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                    disabled={submitting}
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
                            {(passwordFocused || formData.password.length > 0) && (
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
                            <label className="text-sm text-zinc-400">Confirm Password *</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-12 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                    disabled={submitting}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {formData.confirmPassword && !passwordsMatch && (
                                <p className="text-red-400 text-xs">Passwords do not match</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || !allPasswordChecksPass}
                            className="w-full py-3.5 rounded-xl font-bold text-white bg-red-700 hover:bg-red-800 transition-all shadow-lg shadow-red-600/25 disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-zinc-500">
                        Already have an account?{' '}
                        <Link href="/login" className="text-red-500 hover:text-red-400 font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
