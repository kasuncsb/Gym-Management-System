"use client";

import { useEffect, useState } from "react";
import { Download, Copy, Check, Shield, QrCode, RefreshCw } from "lucide-react";
import { authAPI, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader, Card, ErrorAlert, LoadingButton } from "@/components/ui/SharedComponents";

export default function QRCodePage() {
    const { user } = useAuth();
    const toast = useToast();
    const [qrCode, setQrCode] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => { if (user) loadQR(); }, [user]);

    const loadQR = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await authAPI.getQRCode();
            setQrCode(res.data.data.qrCodeDataUrl);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const downloadQR = () => {
        if (qrCode) return;
        const link = document.createElement("a");
        link.href = qrCode;
        link.download = `powerworld-qr-${user?.fullName || "member"}.png`;
        link.click();
        toast.success("Downloaded", "QR code saved to your device.");
    };

    const copyQR = async () => {
        if (qrCode) return;
        try {
            const res = await fetch(qrCode);
            const blob = await res.blob();
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            setCopied(true);
            toast.success("Copied", "QR code copied to clipboard.");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Copy failed", "Unable to copy to clipboard. Try downloading instead.");
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 page-enter">
                <div className="space-y-2"><Skeleton className="h-8 w-40" /><Skeleton className="h-4 w-64" /></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Skeleton className="h-115 rounded-3xl" />
                    <div className="space-y-4"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 page-enter">
            <PageHeader title="Access Pass" subtitle="Scan this QR code at the gym entrance for instant access" />

            {error && <ErrorAlert message={error} onRetry={loadQR} />}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* QR Card */}
                <Card className="flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-b from-red-600/5 to-transparent pointer-events-none" />
                    <div className="relative">
                        <div className="bg-white p-5 rounded-3xl mb-6 shadow-2xl shadow-black/50 ring-4 ring-white/5 inline-block">
                            {qrCode ? (
                                <img src={qrCode} alt="Member QR Code" className="w-56 h-56 sm:w-64 sm:h-64 object-contain" />
                            ) : (
                                <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
                                    <QrCode size={64} className="text-zinc-300" />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-center gap-2 text-sm text-emerald-500 font-medium bg-emerald-500/10 px-4 py-1.5 rounded-full mb-8 border border-emerald-500/20">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Permanent — never expires
                        </div>

                        <div className="flex gap-3 w-full max-w-sm mx-auto">
                            <button
                                onClick={downloadQR}
                                disabled={!qrCode}
                                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-all group disabled:opacity-50"
                            >
                                <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                                Save
                            </button>
                            <button
                                onClick={copyQR}
                                disabled={!qrCode}
                                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-all group disabled:opacity-50"
                            >
                                {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} className="group-hover:scale-110 transition-transform" />}
                                {copied ? "Copied" : "Copy"}
                            </button>
                            <button
                                onClick={loadQR}
                                className="flex items-center justify-center gap-2 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-all group"
                            >
                                <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                            </button>
                        </div>
                    </div>
                </Card>

                {/* Instructions */}
                <div className="space-y-6">
                    <Card>
                        <h3 className="text-xl font-bold text-white mb-6">How to use</h3>
                        <div className="space-y-6">
                            {[
                                { title: "Present Code", desc: "Show this QR code at the turnstile scanner when entering." },
                                { title: "Wait for Scan", desc: "Hold your screen steady for a second until you hear the beep." },
                                { title: "Enter", desc: "The gate will unlock automatically. Welcome to PowerWorld!" },
                            ].map((step, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="flex-none w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-sm font-bold text-red-400">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium mb-0.5">{step.title}</h4>
                                        <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 flex gap-4">
                        <div className="flex-none p-2 bg-blue-500/20 text-blue-400 rounded-lg h-fit">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h4 className="text-blue-400 font-medium mb-1">Secure Access</h4>
                            <p className="text-sm text-blue-400/70 leading-relaxed">
                                Your QR code is cryptographically signed and unique to your account.
                                Access validity is verified in real-time against your subscription status.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
