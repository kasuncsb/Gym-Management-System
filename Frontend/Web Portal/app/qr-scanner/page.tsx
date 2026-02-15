'use client';

import { useState, useEffect, useRef } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { qrAPI, authAPI } from "@/lib/api";
import { Dumbbell, ScanLine, CheckCircle, XCircle, Loader2, DoorOpen, ArrowLeft, Hash } from "lucide-react";

interface ScanResult {
    success: boolean;
    message: string;
    memberName?: string;
    direction?: 'in' | 'out';
}

export default function QRScannerPage() {
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [showDoorAnimation, setShowDoorAnimation] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [manualCode, setManualCode] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            router.push('/login');
            return;
        }

        authAPI.getProfile()
            .then(res => setProfile(res.data.data))
            .catch(() => router.push('/login'));

        return () => stopScanning();
    }, [router]);

    const startScanning = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsScanning(true);
                setScanResult(null);
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Unable to access camera. Please check permissions.');
        }
    };

    const stopScanning = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsScanning(false);
    };

    const handleScan = async (qrData: string) => {
        setLoading(true);
        setScanResult(null);

        try {
            const res = await qrAPI.scan(qrData, 'GATE01');

            if (res.data.success) {
                setScanResult({
                    success: true,
                    message: res.data.data.message || 'Access Granted',
                    memberName: res.data.data.memberName,
                    direction: res.data.data.direction,
                });

                // Show door unlock animation
                setShowDoorAnimation(true);
                setTimeout(() => setShowDoorAnimation(false), 3000);
            } else {
                setScanResult({
                    success: false,
                    message: res.data.error?.message || 'Access Denied',
                });
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.error?.message || err.message || 'Scan failed';
            setScanResult({
                success: false,
                message: errorMsg,
            });
        } finally {
            setLoading(false);
        }
    };

    const getBackLink = () => {
        if (!profile) return '/member';
        if (profile.role === 'admin') return '/admin-dashboard';
        if (profile.role === 'manager') return '/manager-dashboard';
        if (profile.role === 'staff') return '/staff-dashboard';
        return '/member';
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Navigation */}
            <nav className="bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-800 py-4 px-6 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center space-x-3 group">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-red-700 to-red-900 flex items-center justify-center">
                            <Dumbbell className="text-white" size={20} />
                        </div>
                        <span className="text-xl font-bold text-white group-hover:text-red-500 transition-colors">PowerWorld</span>
                    </Link>
                    <Link
                        href={getBackLink()}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition"
                    >
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </Link>
                </div>
            </nav>

            {/* Main Content */}
            <main className="px-6 py-8">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">QR Check In/Out</h1>
                        <p className="text-zinc-500">Scan member QR code for access</p>
                    </div>

                    {/* Door Animation Overlay */}
                    {showDoorAnimation && (
                        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-linear-to-br from-green-500 to-green-600 flex items-center justify-center animate-pulse">
                                    <DoorOpen className="text-white" size={60} />
                                </div>
                                <h2 className="text-3xl font-bold text-green-400 mb-2">Door Unlocked</h2>
                                <p className="text-zinc-400">
                                    {scanResult?.direction === 'in' ? 'Welcome!' : 'Goodbye!'}
                                    {scanResult?.memberName && ` ${scanResult.memberName}`}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Scanner Card */}
                    <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                                <ScanLine size={24} />
                            </div>
                            <h2 className="text-xl font-semibold text-white">QR Scanner</h2>
                        </div>

                        {isScanning! ? (
                            <div className="text-center">
                                <div className="w-64 h-64 mx-auto mb-6 bg-zinc-800 rounded-xl flex items-center justify-center border-2 border-dashed border-zinc-700">
                                    <div className="text-center">
                                        <ScanLine className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                                        <p className="text-zinc-500">Camera preview</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={startScanning}
                                        className="bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3 rounded-xl font-semibold transition-all"
                                    >
                                        Start Camera
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="relative w-full max-w-md mx-auto mb-6 bg-zinc-800 rounded-xl overflow-hidden aspect-video">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 border-4 border-red-500/50 rounded-xl pointer-events-none">
                                        {/* Scanning overlay */}
                                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 animate-pulse" />
                                    </div>
                                </div>
                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={stopScanning}
                                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-8 py-3 rounded-xl font-semibold transition-colors"
                                    >
                                        Stop Camera
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Result Display */}
                        {scanResult && showDoorAnimation! && (
                            <div className={`mt-6 p-4 rounded-xl border ${scanResult.success
                                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                                }`}>
                                <div className="flex items-center gap-3">
                                    {scanResult.success ? (
                                        <CheckCircle size={24} />
                                    ) : (
                                        <XCircle size={24} />
                                    )}
                                    <div>
                                        <p className="font-semibold text-lg">{scanResult.message}</p>
                                        {scanResult.memberName && (
                                            <p className="text-sm opacity-75">{scanResult.memberName}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 rounded-2xl border border-zinc-800 bg-black/40 p-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
                            <Hash size={16} className="text-zinc-500" />
                            Manual QR entry (for desk scanners)
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={manualCode}
                                onChange={(event) => setManualCode(event.target.value)}
                                placeholder="Enter QR code or member token"
                                className="flex-1 rounded-xl border border-zinc-800 bg-black/60 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-red-500 focus:outline-none"
                            />
                            <button
                                onClick={() => manualCode.trim() && handleScan(manualCode.trim())}
                                disabled={loading || !manualCode.trim()}
                                className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Validate'}
                            </button>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="mt-6 text-center text-zinc-500 text-sm">
                        <p>Point the camera at the member's QR code.</p>
                        <p className="mt-1">Access requires verified identity and active subscription.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
