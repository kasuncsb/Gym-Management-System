'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { authAPI, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Loader2, CheckCircle, XCircle, Mail, Home } from "lucide-react";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isAuthenticated, user, refreshUser, isLoading: authLoading } = useAuth();
    const token = searchParams.get('token');
    const sentParam = searchParams.get('sent');
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending' | 'email_failed'>('loading');
    const [message, setMessage] = useState('');
    const [resending, setResending] = useState(false);

    // No token: show "verify your email" — email sent (pending), email failed (email_failed), or generic pending
    useEffect(() => {
        if (token) return;
        if (authLoading) return;

        if (sentParam === '0') {
            setStatus('email_failed');
            setMessage('We couldn\'t send the verification email. Please try again later or contact support.');
            return;
        }
        if (sentParam === '1' || (isAuthenticated && user?.role === 'member' && !user?.emailVerified)) {
            setStatus('pending');
            setMessage(sentParam === '1'
                ? 'We\'ve sent a verification link to your email. Click the link in the email to verify your account.'
                : 'We sent a verification link to your email. Click it to verify your account.');
            return;
        }
        setStatus('error');
        setMessage('Invalid verification link. Please use the link from your email.');
    }, [token, sentParam, authLoading, isAuthenticated, user]);

    // With token: verify (user clicked link in email)
    useEffect(() => {
        if (!token) return;

        const verify = async () => {
            try {
                await authAPI.verifyEmail(token);
                setStatus('success');
                await refreshUser();
            } catch (err: unknown) {
                setStatus('error');
                setMessage(getErrorMessage(err) || 'Verification failed. The link may be expired or invalid.');
            }
        };

        verify();
    }, [token, refreshUser]);

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

    const handleTryAgain = () => router.replace('/');
    const handleContinue = () => router.push('/member/onboard');

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
                    <h2 className="text-2xl font-bold mb-4">Verify Your Email</h2>
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

            {status === 'email_failed' && (
                <>
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="text-red-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Verification Email Failed</h2>
                    <p className="text-zinc-400 mb-8 leading-relaxed">{message}</p>
                    <button
                        onClick={handleTryAgain}
                        className="w-full py-3.5 rounded-xl font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
                    >
                        <Home size={18} />
                        Try Again
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
                        Your account has been successfully verified. Continue to complete your profile.
                    </p>
                    <button
                        onClick={handleContinue}
                        className="w-full py-3.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                    >
                        Continue
                    </button>
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
                    <button
                        onClick={handleTryAgain}
                        className="w-full py-3.5 rounded-xl font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
                    >
                        <Home size={18} />
                        Try Again
                    </button>
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
