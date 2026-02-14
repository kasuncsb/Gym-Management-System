'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import { Loader2, Download, Copy, Check, Shield } from 'lucide-react';

export default function QRCodePage() {
    const { user } = useAuth();
    const [qrCode, setQrCode] = useState('');
    const [qrPayload, setQrPayload] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!user) return;
        loadQR();
    }, [user]);

    const loadQR = async () => {
        try {
            const response = await authAPI.getQRCode();
            setQrCode(response.data.data.qrCodeDataUrl);
            setQrPayload(response.data.data.qrToken || response.data.data.qrPayload || '');
            setError('');
        } catch {
            setError('Failed to load QR code');
        } finally {
            setLoading(false);
        }
    };

    const downloadQR = () => {
        const link = document.createElement('a');
        link.href = qrCode;
        link.download = `powerworld-qr-${user?.fullName}.png`;
        link.click();
    };

    const copyPayload = async () => {
        try {
            await navigator.clipboard.writeText(qrPayload);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* ignore */ }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="animate-spin text-red-600" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h2 className="text-3xl font-bold text-white">Access Pass</h2>
                <p className="text-zinc-400 mt-1">Scan this QR code at the gym entrance.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* QR Card */}
                <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl">
                    {error ? (
                        <div className="text-red-500 py-10">
                            <p className="mb-4">{error}</p>
                            <button onClick={loadQR} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition">
                                Retry
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="relative bg-white p-4 rounded-2xl mb-6 shadow-inner ring-4 ring-black/10">
                                <img src={qrCode} alt="Member QR Code" className="w-64 h-64 object-contain" />
                            </div>

                            <div className="flex items-center gap-2 text-sm text-emerald-500 font-medium bg-emerald-500/10 px-3 py-1 rounded-full mb-8">
                                <span className="relative flex h-2 w-2">
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Permanent — never expires
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                                <button
                                    onClick={downloadQR}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition group"
                                >
                                    <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                                    Save
                                </button>
                                <button
                                    onClick={copyPayload}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition group"
                                >
                                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="group-hover:scale-110 transition-transform" />}
                                    {copied ? 'Copied' : 'Copy Payload'}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Instructions */}
                <div className="space-y-6">
                    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-6">How to use</h3>
                        <div className="space-y-6">
                            {[
                                { title: 'Present Code', desc: 'Show this QR code at the turnstile scanner.' },
                                { title: 'Wait for Scan', desc: 'Hold steady for a second until it beeps.' },
                                { title: 'Enter', desc: 'The gate will unlock automatically.' },
                            ].map((step, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="flex-none w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium mb-1">{step.title}</h4>
                                        <p className="text-sm text-zinc-500">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 flex gap-4">
                        <div className="flex-none p-2 bg-blue-500/20 text-blue-400 rounded-lg h-fit">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h4 className="text-blue-400 font-medium mb-1">Secure Access</h4>
                            <p className="text-sm text-blue-400/70">
                                Your QR code is cryptographically signed and unique to your account. Access validity is checked at scan time against your subscription status.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
