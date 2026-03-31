'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authAPI, getErrorMessage } from "@/lib/api";
import { Mail, Lock, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, dashboardPathForRole } from "@/context/AuthContext";

// ── Inner form component ─────────────────────────────────────────────────────
// useSearchParams() MUST live inside a component that is wrapped in <Suspense>
// at the page boundary. Putting it at the top level breaks Next.js static
// generation (build fails with "missing-suspense-with-csr-bailout" error).
function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [cooldownUntil, setCooldownUntil] = useState(0); // 429 cooldown (ms)
    const { login, user, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Redirect authenticated users to the appropriate step (members: verify → onboard → dashboard).
    useEffect(() => {
        if (!authLoading && isAuthenticated && user) {
            if (user.role === 'member') {
                if (!user.emailVerified) router.replace('/member/verify-email');
                else if (!user.isOnboarded) router.replace('/member/onboard');
                else router.replace('/member/dashboard');
            } else {
                router.replace(dashboardPathForRole(user.role));
            }
        }
    }, [authLoading, isAuthenticated, user, router]);

    // Show success notice when redirected here after password change (BUG-03)
    useEffect(() => {
        if (searchParams.get('pwchanged') === '1') {
            setSuccessMsg('Password changed successfully. Please log in with your new password.');
        }
    }, [searchParams]);

    // Clear 429 cooldown after 60s so submit button re-enables
    const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const submitInFlightRef = useRef(false);
    useEffect(() => {
        if (cooldownUntil <= 0) return;
        cooldownTimerRef.current = setTimeout(() => setCooldownUntil(0), 60_000);
        return () => {
            if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
        };
    }, [cooldownUntil]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitInFlightRef.current) return;
        submitInFlightRef.current = true;
        setIsLoading(true);
        setError('');

        try {
            const response = await authAPI.login(email, password);
            const { user: responseUser } = response.data.data;

            // Update client state only; redirect is handled by useEffect below so it runs after state commit (avoids empty dashboard).
            // Include avatar/cover keys so the navbar can immediately render the correct profile image after login.
            login({
                id: responseUser.id,
                fullName: responseUser.fullName,
                email: responseUser.email,
                role: responseUser.role,
                phone: responseUser.phone,
                avatarKey: responseUser.avatarKey ?? null,
                coverKey: responseUser.coverKey ?? null,
                emailVerified: responseUser.emailVerified,
                isOnboarded: responseUser.isOnboarded,
            });
        } catch (err: unknown) {
            console.error('Login failed:', err);
            const msg = getErrorMessage(err);
            setError(msg);
            // On 429, avoid immediate retries that worsen rate-limit lockout
            if (typeof err === 'object' && err !== null && 'response' in err && (err as { response?: { status?: number } }).response?.status === 429) {
                setCooldownUntil(Date.now() + 60_000); // 1 min
            }
        } finally {
            submitInFlightRef.current = false;
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-app text-white flex relative overflow-hidden selection:bg-red-600/30">
            {/* Grid — matches dashboard, fades towards center */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#3c3c3c35_1px,transparent_1px),linear-gradient(to_bottom,#3c3c3c35_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black_90%)] pointer-events-none" />

            {/* Centered content — welcome + form stacked */}
            <div className="relative z-10 w-full flex flex-col items-center justify-center p-6 py-12">
                {/* Welcome — 1–2 lines max */}
                <div className="w-full max-w-xl text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
                        Welcome back to <span className="text-red-500">Elite Fitness.</span>
                    </h1>
                    <p className="text-lg text-zinc-400">Track progress, book classes, and crush your goals.</p>
                </div>

                {/* Form card — left-aligned form elements */}
                <div className="w-full max-w-md bg-zinc-800/80 backdrop-blur-xl border border-zinc-700 p-8 rounded-3xl shadow-2xl" id="login-card">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-2" id="login-title">Sign In</h2>
                        <p className="text-zinc-400 text-sm">Enter your details to access your account.</p>
                    </div>

                    {successMsg && (
                        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2" id="login-success" role="status">
                            <CheckCircle size={16} className="shrink-0" />
                            {successMsg}
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2" id="login-error" role="alert">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {error}
                        </div>
                    )}

                    <form id="login-form" onSubmit={handleSubmit} className="w-full space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="login-email" className="block text-sm font-medium text-zinc-300">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors pointer-events-none" size={18} />
                                <input
                                    id="login-email"
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

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label htmlFor="login-password" className="block text-sm font-medium text-zinc-300">Password</label>
                                <Link href="/member/forgot-password" className="text-xs text-red-500 hover:text-red-400">Forgot password?</Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors pointer-events-none" size={18} />
                                <input
                                    id="login-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        <button
                            id="login-submit"
                            type="submit"
                            disabled={isLoading || Date.now() < cooldownUntil}
                            className={cn(
                                "w-full py-3.5 rounded-xl font-bold text-white bg-red-700 hover:bg-red-800 transition-all shadow-lg shadow-red-600/10 flex items-center justify-center gap-2",
                                isLoading && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Sign In Account"}
                        </button>
                    </form>

                    <div className="mt-8 text-sm text-zinc-400">
                        Don&apos;t have an account? {' '}
                        <Link href="/member/register" className="text-red-500 hover:text-red-400 font-medium hover:underline">
                            Create Account
                        </Link>
                    </div>
                </div>

                <p className="text-sm text-zinc-500 mt-10 text-center">© 2026 PowerWorld Gyms. All rights reserved.</p>
            </div>
        </div>
    );
}

// ── Page export ──────────────────────────────────────────────────────────────
// LoginForm is wrapped in Suspense so that useSearchParams() inside it
// satisfies Next.js's requirement for a Suspense boundary during SSG.
export default function Login() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-app flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
