'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authAPI, getErrorMessage } from "@/lib/api";
import { useAuth, dashboardPathForRole } from "@/context/AuthContext";
import { User, Mail, Lock, Phone, Loader2, ArrowRight, Eye, EyeOff, AlertCircle, ChevronDown } from "lucide-react";
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
    // Health info (optional)
    const [bloodType, setBloodType] = useState('');
    const [medicalConditions, setMedicalConditions] = useState('');
    const [allergies, setAllergies] = useState('');
    const router = useRouter();
    const { login, isAuthenticated, isLoading: authLoading, user } = useAuth();

    // Redirect authenticated users to the appropriate step (verify → onboard → dashboard).
    useEffect(() => {
        if (authLoading || !isAuthenticated || !user) return;
        if (user.role === 'member') {
            if (!user.emailVerified) router.replace('/member/verify-email');
            else if (!user.isOnboarded) router.replace('/member/onboard');
            else router.replace('/member/dashboard');
        } else {
            router.replace(dashboardPathForRole(user.role));
        }
    }, [authLoading, isAuthenticated, user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        const norm = (s: string) => s.replace(/\s|-/g, '');
        if (norm(phone) && norm(emergencyPhone) && norm(phone) === norm(emergencyPhone)) {
            setError('Emergency phone must be different from your phone number.');
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
                bloodType: bloodType || undefined,
                medicalConditions: medicalConditions.trim() || undefined,
                allergies: allergies.trim() || undefined,
            });

            const { user, verificationEmailSent } = response.data.data;

            // Auto-login — cookies already set by backend. New members need verify → onboard.
            login({
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                emailVerified: user.emailVerified ?? false,
                isOnboarded: user.isOnboarded ?? false,
            });

            // New member → verify your email page (indicates whether verification mail was sent or failed)
            const sent = verificationEmailSent === true ? '1' : '0';
            router.replace(`/member/verify-email?sent=${sent}`);
        } catch (err: unknown) {
            console.error('Registration failed:', err);
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-app text-white flex relative overflow-hidden selection:bg-red-600/30">
            {/* Grid — matches dashboard, fades towards center */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#3c3c3c35_1px,transparent_1px),linear-gradient(to_bottom,#3c3c3c35_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black_90%)] pointer-events-none" />

            {/* Centered content — welcome + form stacked */}
            <div className="relative z-10 w-full flex flex-col items-center justify-center p-6 py-12 overflow-y-auto">
                {/* Welcome — 1–2 lines max */}
                <div className="w-full max-w-xl text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
                        Start your <span className="text-red-500">Transformation.</span>
                    </h1>
                    <p className="text-lg text-zinc-400">Join our community. Premium facilities and expert coaching.</p>
                </div>

                {/* Form card — horizontal-friendly, left-aligned */}
                <div className="w-full max-w-2xl bg-zinc-800/80 backdrop-blur-xl border border-zinc-700 p-8 rounded-3xl shadow-2xl" id="register-card">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold mb-2" id="register-title">Create Account</h2>
                        <p className="text-zinc-400 text-sm">Fill the form below, fields marked with asterisk (*) are mandatory.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2" role="alert" id="register-error">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {error}
                        </div>
                    )}

                    <form id="register-form" onSubmit={handleSubmit} className="w-full space-y-6">
                        {/* 1. Basic information */}
                        <section className="space-y-4" aria-labelledby="section-basic">
                            <h3 id="section-basic" className="text-sm font-semibold text-zinc-300 tracking-wider">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="register-full-name" className="block text-sm font-medium text-zinc-300">Full Name <span className="text-red-500">*</span></label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors pointer-events-none" size={18} />
                                        <input
                                            id="register-full-name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                                            placeholder="e.g., Kasun Perera"
                                            required
                                            autoComplete="name"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="register-email" className="block text-sm font-medium text-zinc-300">Email <span className="text-red-500">*</span></label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors pointer-events-none" size={18} />
                                        <input
                                            id="register-email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                                            placeholder="name@example.com"
                                            required
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="register-phone" className="block text-sm font-medium text-zinc-300">Phone <span className="text-red-500">*</span></label>
                                    <div className="relative group">
                                        <Phone className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors pointer-events-none" size={18} />
                                        <input
                                            id="register-phone"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                                            placeholder="+94 77 123 4567"
                                            required
                                            autoComplete="tel"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="register-gender" className="block text-sm font-medium text-zinc-300">Gender</label>
                                    <div className="relative group">
                                        <ChevronDown className="absolute right-3 top-3.5 text-zinc-500 pointer-events-none" size={18} />
                                        <select
                                            id="register-gender"
                                            value={gender}
                                            onChange={(e) => setGender(e.target.value)}
                                            className="w-full appearance-none bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-4 pr-10 text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all cursor-pointer"
                                            aria-label="Gender"
                                        >
                                            <option value="" className="bg-zinc-900">Select</option>
                                            <option value="male" className="bg-zinc-900">Male</option>
                                            <option value="female" className="bg-zinc-900">Female</option>
                                            <option value="other" className="bg-zinc-900">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 relative">
                                    <label htmlFor="register-password" className="block text-sm font-medium text-zinc-300">Password <span className="text-red-500">*</span></label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors pointer-events-none" size={18} />
                                        <input
                                            id="register-password"
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
                                        <div className="absolute top-full left-0 mt-2 w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50" id="register-password-requirements">
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
                                <div className="space-y-2">
                                    <label htmlFor="register-confirm-password" className="block text-sm font-medium text-zinc-300">Confirm Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors pointer-events-none" size={18} />
                                        <input
                                            id="register-confirm-password"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-10 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                                            placeholder="Confirm password"
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
                            </div>
                        </section>

                        {/* 2. Emergency contact information */}
                        <section className="space-y-4 border-t border-zinc-700 pt-6" aria-labelledby="section-emergency">
                            <h3 id="section-emergency" className="text-sm font-semibold text-zinc-300 tracking-wider">Emergency Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="register-emergency-name" className="block text-sm font-medium text-zinc-300">Contact Name <span className="text-red-500">*</span></label>
                                    <input
                                        id="register-emergency-name"
                                        type="text"
                                        value={emergencyName}
                                        onChange={e => setEmergencyName(e.target.value)}
                                        placeholder="Full name"
                                        required
                                        className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="register-emergency-phone" className="block text-sm font-medium text-zinc-300">Phone <span className="text-red-500">*</span></label>
                                    <input
                                        id="register-emergency-phone"
                                        type="tel"
                                        value={emergencyPhone}
                                        onChange={e => setEmergencyPhone(e.target.value)}
                                        placeholder="+94 77 123 4567"
                                        required
                                        className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="register-emergency-relation" className="block text-sm font-medium text-zinc-300">Relationship</label>
                                    <input
                                        id="register-emergency-relation"
                                        type="text"
                                        value={emergencyRelation}
                                        onChange={e => setEmergencyRelation(e.target.value)}
                                        placeholder="e.g. Spouse, Parent"
                                        required
                                        className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* 3. Health information */}
                        <section className="space-y-4 border-t border-zinc-700 pt-6" aria-labelledby="section-health">
                            <h3 id="section-health" className="text-sm font-semibold text-zinc-300 tracking-wider">Health Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="register-blood-type" className="block text-sm font-medium text-zinc-300">Blood Type</label>
                                    <div className="relative group">
                                        <ChevronDown className="absolute right-3 top-3.5 text-zinc-500 pointer-events-none" size={18} />
                                        <select
                                            id="register-blood-type"
                                            value={bloodType}
                                            onChange={e => setBloodType(e.target.value)}
                                            className="w-full appearance-none bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-4 pr-10 text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all cursor-pointer"
                                            aria-label="Blood type"
                                        >
                                            <option value="" className="bg-zinc-900">Select</option>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
                                                <option key={bt} value={bt} className="bg-zinc-900">{bt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label htmlFor="register-medical-conditions" className="block text-sm font-medium text-zinc-300">Medical conditions</label>
                                    <input
                                        id="register-medical-conditions"
                                        type="text"
                                        value={medicalConditions}
                                        onChange={e => setMedicalConditions(e.target.value)}
                                        placeholder="e.g. Hypertension, none"
                                        className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="register-allergies" className="block text-sm font-medium text-zinc-300">Allergies</label>
                                <input
                                    id="register-allergies"
                                    type="text"
                                    value={allergies}
                                    onChange={e => setAllergies(e.target.value)}
                                    placeholder="e.g. Penicillin, none"
                                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                                    autoComplete="off"
                                />
                            </div>
                        </section>

                        <button
                            id="register-submit"
                            type="submit"
                            disabled={isLoading}
                            className={cn(
                                "w-full py-3.5 rounded-xl font-bold text-white bg-red-700 hover:bg-red-800 transition-all shadow-lg shadow-red-600/10 flex items-center justify-center gap-2 mt-4",
                                isLoading && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Create Account <ArrowRight size={18} /></>}
                        </button>
                    </form>

                    <div className="mt-8 text-sm text-zinc-400">
                        Already have an account? {' '}
                        <Link href="/login" className="text-red-500 hover:text-red-400 font-medium hover:underline">
                            Sign in instead
                        </Link>
                    </div>
                </div>

                <p className="text-sm text-zinc-500 mt-10 text-center">© 2026 PowerWorld Gyms. All rights reserved.</p>
            </div>
        </div>
    );
}
