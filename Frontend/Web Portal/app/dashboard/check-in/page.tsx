"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { QrCode, Search, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { qrAPI, memberAPI } from "@/lib/api";

interface CheckInResult {
    name: string;
    status: string;
    plan: string;
    memberCode: string;
    time: string;
}

export default function CheckInPage() {
    const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
    const [lastScan, setLastScan] = useState<CheckInResult | null>(null);
    const [searchInput, setSearchInput] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleQRScan = async (qrData: string) => {
        setScanState('scanning');
        setError(null);
        try {
            // Call QR scan API
            const response = await qrAPI.scan(qrData, 'reception-desk', 'kiosk-01', 'main-entrance');
            const data = response.data?.data;

            if (data?.valid) {
                setScanState('success');
                setLastScan({
                    name: data.member?.name || 'Member',
                    status: data.accessGranted ? 'Active' : 'Denied',
                    plan: data.member?.planName || 'Standard',
                    memberCode: data.member?.memberCode || '',
                    time: new Date().toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })
                });
            } else {
                setScanState('error');
                setError(data?.message || 'Invalid or expired QR code');
            }
        } catch (err: any) {
            setScanState('error');
            setError(err?.response?.data?.error?.message || err?.message || 'Failed to verify QR code');
        }
    };

    const handleManualSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchInput.trim()) return;

        setScanState('scanning');
        setError(null);

        try {
            const response = await memberAPI.search(searchInput);
            const members = response.data?.data || [];

            if (members.length > 0) {
                const member = members[0];
                // Record check-in
                // Record check-in via scan simulation
                await qrAPI.scan(member.qrCode || member.memberCode || member.id, 'reception-desk', 'manual-entry', 'main-entrance');

                setScanState('success');
                setLastScan({
                    name: member.name,
                    status: member.status || 'Active',
                    plan: member.planName || 'Standard',
                    memberCode: member.memberCode || '',
                    time: new Date().toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })
                });
            } else {
                setScanState('error');
                setError('No member found with that ID or phone number');
            }
        } catch (err: any) {
            setScanState('error');
            setError(err?.response?.data?.error?.message || 'Search failed');
        }
    };

    const resetState = () => {
        setScanState('idle');
        setLastScan(null);
        setError(null);
        setSearchInput("");
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white">Member Check-In</h2>
                <p className="text-zinc-400 mt-1">Scan QR code or search for member</p>
            </div>

            {/* Scanner Area */}
            <div className="relative aspect-square md:aspect-video bg-black rounded-3xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center overflow-hidden group">
                {scanState === 'scanning' && (
                    <div className="absolute inset-0 z-0 bg-red-600/10 animate-pulse" />
                )}

                {/* Scanner Overlay Line */}
                {scanState === 'scanning' && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-600 shadow-[0_0_20px_rgba(99,102,241,0.5)] animate-[scan_2s_ease-in-out_infinite]" />
                )}

                {scanState === 'success' ? (
                    <div className="relative z-10 text-center">
                        <div className="p-8 rounded-full bg-green-500/10 border border-green-500/20 mb-6 inline-flex">
                            <CheckCircle size={48} className="text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Access Granted</h3>
                        <button onClick={resetState} className="text-red-500 hover:text-red-400">
                            Scan Another
                        </button>
                    </div>
                ) : scanState === 'error' ? (
                    <div className="relative z-10 text-center">
                        <div className="p-8 rounded-full bg-red-500/10 border border-red-500/20 mb-6 inline-flex">
                            <XCircle size={48} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Access Denied</h3>
                        <p className="text-zinc-500 mb-4">{error}</p>
                        <button onClick={resetState} className="text-red-500 hover:text-red-400">
                            Try Again
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="relative z-10 p-8 rounded-full bg-zinc-900/50 border border-zinc-700 mb-6">
                            {scanState === 'scanning' ? (
                                <Loader2 size={48} className="text-white animate-spin" />
                            ) : (
                                <QrCode size={48} className="text-white" />
                            )}
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">
                            {scanState === 'scanning' ? 'Scanning...' : 'Ready to Scan'}
                        </h3>
                        <p className="text-zinc-500 mb-8 max-w-xs text-center">
                            Position the member's QR code within the frame.
                        </p>

                        <Link
                            href="/qr-scanner"
                            className={cn(
                                "px-8 py-3 bg-red-700 text-white font-bold rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-600/20 inline-flex items-center gap-2",
                                scanState === 'scanning' && "opacity-50 pointer-events-none"
                            )}
                        >
                            <ExternalLink size={18} />
                            Open QR Scanner
                        </Link>
                    </>
                )}
            </div>

            {/* Manual Entry */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="bg-black px-4 text-zinc-500 uppercase tracking-widest font-semibold">Or manual entry</span>
                </div>
            </div>

            <form onSubmit={handleManualSearch} className="flex gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors" size={20} />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Enter Member Code or Phone Number"
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                    />
                </div>
                <button
                    type="submit"
                    disabled={scanState === 'scanning'}
                    className="px-6 py-3 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition border border-zinc-700"
                >
                    Check In
                </button>
            </form>

            {/* Last Scanned Result */}
            {lastScan && (
                <div className="mt-8 p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-md animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
                            <CheckCircle size={32} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xl font-bold text-white">{lastScan.name}</h4>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/10 uppercase tracking-wide">
                                    Access Granted
                                </span>
                                <span className="text-sm text-zinc-500">{lastScan.plan}</span>
                                {lastScan.memberCode && (
                                    <span className="text-sm text-zinc-600">#{lastScan.memberCode}</span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block text-2xl font-bold text-zinc-200">{lastScan.time}</span>
                            <span className="text-xs text-zinc-500 uppercase">Check-in Time</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
