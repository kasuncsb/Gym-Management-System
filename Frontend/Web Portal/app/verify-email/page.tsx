'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authAPI } from "@/lib/api";
import { Dumbbell, Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        const verify = async () => {
            try {
                await authAPI.verifyEmail(token);
                setStatus('success');
            } catch (err: any) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Verification failed. The link may be expired or invalid.');
            }
        };

        verify();
    }, [token]);

    return (
        <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl relative z-10 text-center">
            {status === 'loading' && (
                <>
                    <div className="w-16 h-16 bg-indigo-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Loader2 className="text-indigo-500 animate-spin" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Verifying Email...</h2>
                    <p className="text-zinc-400">Please wait while we verify your account.</p>
                </>
            )}

            {status === 'success' && (
                <>
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="text-green-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Email Verified!</h2>
                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        Your account has been successfully verified. You can now access your dashboard.
                    </p>
                    <Link
                        href="/login"
                        className="w-full py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                    >
                        Go to Login <ArrowRight size={18} />
                    </Link>
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
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[128px]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            </div>

            <Suspense fallback={
                <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl relative z-10 text-center">
                    <Loader2 className="text-indigo-500 animate-spin mx-auto" size={32} />
                </div>
            }>
                <VerifyEmailContent />
            </Suspense>
        </div>
    );
}
