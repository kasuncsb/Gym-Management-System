'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { authAPI, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Loader2, CheckCircle, XCircle, ArrowRight, Mail } from "lucide-react";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isAuthenticated, user, refreshUser, isLoading: authLoading } = useAuth();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('loading');
    const [message, setMessage] = useState('');
    const [resending, setResending] = useState(false);

    // No token: show "check your email" for unverified members, else error
    useEffect(() => {
        if (token) return;
        if (authLoading) return;

        if (isAuthenticated && user?.role === 'member' && !user?.emailVerified) {
            setStatus('pending');
            setMessage('We sent a verification link to your email. Click it to verify your account.');
        } else {
            setStatus('error');
            setMessage('Invalid verification link. Please use the link from your email.');
        }
    }, [token, authLoading, isAuthenticated, user]);

    // With token: verify
    useEffect(() => {
        if (!token) return;

        const verify = async () => {
            try {
                await authAPI.verifyEmail(token);
                setStatus('success');
                const fresh = await refreshUser();
                const isOnboarded = fresh?.isOnboarded;
                setTimeout(() => {
                    router.push(isOnboarded ? '/member/dashboard' : '/member/onboard');
                }, 1500);
            } catch (err: unknown) {
                setStatus('error');
                setMessage(getErrorMessage(err) || 'Verification failed. The link may be expired or invalid.');
            }
        };

        verify();
    }, [token, refreshUser, router]);

    const handleResend = async () => {
        setResending(true);
        try {
            await authAPI.sendVerificationEmail();
            setMessage('Verification email sent. Check your inbox.');
        } catch (err) {
            setMessage(getErrorMessage(err) || 'Failed to resend. Try again later.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-zinc-800/80 backdrop-blur-xl border border-zinc-700 p-8 rounded-3xl shadow-2xl relative z-10 text-center">
            {status === 'loading' && (
                <>
                    <div className="w-16 h-16 bg-red-700/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Loader2 className="text-red-600 animate-spin" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">{token ? 'Verifying Email...' : 'Loading...'}</h2>
                    <p className="text-zinc-400">{token ? 'Please wait while we verify your account.' : 'Please wait.'}</p>
                </>
            )}

            {status === 'pending' && (
                <>
                    <div className="w-16 h-16 bg-red-700/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail className="text-red-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Check Your Email</h2>
                    <p className="text-zinc-400 mb-6 leading-relaxed">{message}</p>
                    <button
                        onClick={handleResend}
                        disabled={resending}
                        className="w-full py-3 rounded-xl font-semibold text-white bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {resending ? <Loader2 className="animate-spin" size={18} /> : null}
                        Resend verification email
                    </button>
                </>
            )}

            {status === 'success' && (
                <>
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="text-green-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Email Verified!</h2>
                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        Your account has been successfully verified. Redirecting to complete your profile...
                    </p>
                    <div className="flex items-center justify-center gap-2 text-zinc-500">
                        <Loader2 className="animate-spin" size={18} />
                        <span>Redirecting...</span>
                    </div>
                </>
            )}

            {status === 'error' && (
                <>
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="text-red-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Verification Failed</h2>
                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        {message}
                    </p>
                    <Link
                        href="/login"
                        className="w-full py-3.5 rounded-xl font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
                    >
                        Back to Login
                    </Link>
                </>
            )}
        </div>
    );
}

export default function VerifyEmail() {
    return (
        <div className="min-h-screen bg-app text-white flex items-center justify-center p-6 relative overflow-hidden selection:bg-red-600/30">
            {/* Grid — matches auth theme */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#3c3c3c35_1px,transparent_1px),linear-gradient(to_bottom,#3c3c3c35_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black_90%)] pointer-events-none" />

            <Suspense fallback={
                <div className="w-full max-w-md bg-zinc-800/80 backdrop-blur-xl border border-zinc-700 p-8 rounded-3xl shadow-2xl relative z-10 text-center">
                    <Loader2 className="text-red-600 animate-spin mx-auto" size={32} />
                </div>
            }>
                <VerifyEmailContent />
            </Suspense>
        </div>
    );
}
