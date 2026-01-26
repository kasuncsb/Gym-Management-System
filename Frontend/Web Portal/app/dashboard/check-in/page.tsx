"use client";

import { useState } from "react";
import { QrCode, Search, CheckCircle, XCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CheckInPage() {
    const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
    const [lastScan, setLastScan] = useState<any>(null);

    const simulateScan = () => {
        setScanState('scanning');
        setTimeout(() => {
            setScanState('success');
            setLastScan({
                name: "Alex Johnson",
                status: "Active",
                plan: "Premium",
                image: null,
                time: new Date().toLocaleTimeString()
            });
        }, 1500);
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
                    <div className="absolute inset-0 z-0 bg-indigo-500/10 animate-pulse" />
                )}

                {/* Scanner Overlay Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] animate-[scan_2s_ease-in-out_infinite]" />

                <div className="relative z-10 p-8 rounded-full bg-zinc-900/50 border border-zinc-700 mb-6">
                    <QrCode size={48} className="text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">Ready to Scan</h3>
                <p className="text-zinc-500 mb-8 max-w-xs text-center">Position the member's QR code within the frame.</p>

                <button
                    onClick={simulateScan}
                    className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20"
                >
                    {scanState === 'scanning' ? "Scanning..." : "Activate Camera"}
                </button>
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

            <div className="flex gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Enter Member ID or Phone Number"
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                </div>
                <button className="px-6 py-3 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition border border-zinc-700">
                    Check In
                </button>
            </div>

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
                                <span className="text-sm text-zinc-500">{lastScan.plan} Plan</span>
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
