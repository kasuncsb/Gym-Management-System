"use client";

import { useState } from "react";
import Link from "next/link";
import { QrCode, Search, CheckCircle, XCircle, Loader2, ExternalLink, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { qrAPI, memberAPI, getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, Card } from "@/components/ui/SharedComponents";

interface CheckInResult {
    name: string;
    direction: "in" | "out";
    time: string;
    sessionId?: string;
}

export default function CheckInPage() {
    const toast = useToast();
    const [scanState, setScanState] = useState<"idle" | "scanning" | "success" | "error">("idle");
    const [lastScan, setLastScan] = useState<CheckInResult | null>(null);
    const [searchInput, setSearchInput] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleQRScan = async (qrData: string) => {
        setScanState("scanning");
        setError(null);
        try {
            const response = await qrAPI.scan(qrData, "reception-desk");
            const data = response.data?.data;
            if (data?.accessGranted) {
                setScanState("success");
                setLastScan({
                    name: data.userName || "Member",
                    direction: data.direction || "in",
                    sessionId: data.sessionId,
                    time: new Date().toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit" }),
                });
                toast.success("Access Granted", `${data.userName || "Member"} checked ${data.direction === "in" ? "in" : "out"}`);
            } else {
                setScanState("error");
                setError(data?.message || "Access denied");
                toast.error("Access Denied", data?.message || "Member check-in denied");
            }
        } catch (err: any) {
            setScanState("error");
            setError(getErrorMessage(err));
        }
    };

    const handleManualSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInput.trim!()) return;
        setScanState("scanning");
        setError(null);
        try {
            const response = await memberAPI.search(searchInput);
            const members = response.data?.data || [];
            if (members.length > 0) {
                const member = members[0];
                const scanRes = await qrAPI.scan(JSON.stringify({ memberId: member.id }), "reception-desk");
                const data = scanRes.data?.data;
                if (data?.accessGranted) {
                    setScanState("success");
                    setLastScan({
                        name: data.userName || member.fullName || "Member",
                        direction: data.direction || "in",
                        sessionId: data.sessionId,
                        time: new Date().toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit" }),
                    });
                    toast.success("Access Granted", `${data.userName || member.fullName} checked ${data.direction === "in" ? "in" : "out"}`);
                } else {
                    setScanState("error");
                    setError(data?.message || "Access denied for this member");
                }
            } else {
                setScanState("error");
                setError("No member found with that ID or phone number");
            }
        } catch (err: any) {
            setScanState("error");
            setError(getErrorMessage(err));
        }
    };

    const resetState = () => {
        setScanState("idle");
        setLastScan(null);
        setError(null);
        setSearchInput("");
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 page-enter">
            <PageHeader title="Member Check-In" subtitle="Scan QR code or search for member" />

            {/* Scanner Area */}
            <Card className="relative aspect-square md:aspect-video flex flex-col items-center justify-center overflow-hidden bg-black/60">
                {scanState === "scanning" && <div className="absolute inset-0 z-0 bg-red-600/10 animate-pulse" />}
                {scanState === "scanning" && <div className="absolute top-0 left-0 w-full h-1 bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-[scan_2s_ease-in-out_infinite]" />}

                {scanState === "success" ? (
                    <div className="relative z-10 text-center">
                        <div className="p-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6 inline-flex">
                            <CheckCircle size={48} className="text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Access Granted</h3>
                        <button onClick={resetState} className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">Scan Another</button>
                    </div>
                ) : scanState === "error" ? (
                    <div className="relative z-10 text-center">
                        <div className="p-8 rounded-full bg-red-500/10 border border-red-500/20 mb-6 inline-flex">
                            <XCircle size={48} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Access Denied</h3>
                        <p className="text-zinc-500 mb-4 text-sm">{error}</p>
                        <button onClick={resetState} className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">Try Again</button>
                    </div>
                ) : (
                    <>
                        <div className="relative z-10 p-8 rounded-full bg-zinc-900/50 border border-zinc-700 mb-6">
                            {scanState === "scanning" ? <Loader2 size={48} className="text-white animate-spin" /> : <QrCode size={48} className="text-white" />}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{scanState === "scanning" ? "Scanning..." : "Ready to Scan"}</h3>
                        <p className="text-zinc-500 mb-8 max-w-xs text-center text-sm">Position the member&apos;s QR code within the frame.</p>
                        <Link href="/qr-scanner" className="px-8 py-3 bg-red-700 text-white font-semibold rounded-xl hover:bg-red-600 transition shadow-lg shadow-red-900/20 inline-flex items-center gap-2">
                            <ExternalLink size={18} /> Open QR Scanner
                        </Link>
                    </>
                )}
            </Card>

            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800" /></div>
                <div className="relative flex justify-center"><span className="bg-black px-4 text-zinc-500 uppercase tracking-widest text-xs font-semibold">Or manual entry</span></div>
            </div>

            {/* Manual Entry */}
            <form onSubmit={handleManualSearch} className="flex gap-3">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors" size={18} />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Member code or phone number"
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all text-sm"
                    />
                </div>
                <button type="submit" disabled={scanState === "scanning"} className="px-6 py-3 bg-zinc-800 text-white font-semibold rounded-xl hover:bg-zinc-700 transition border border-zinc-700 text-sm">
                    Check In
                </button>
            </form>

            {/* Last Scan Result */}
            {lastScan && (
                <Card className="animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-14 h-14 rounded-2xl border flex items-center justify-center",
                            lastScan.direction === "in" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                        )}>
                            {lastScan.direction === "in" ? <ArrowDownLeft size={28} /> : <ArrowUpRight size={28} />}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-lg font-bold text-white">{lastScan.name}</h4>
                            <span className={cn(
                                "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border",
                                lastScan.direction === "in" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/10" : "bg-amber-500/20 text-amber-400 border-amber-500/10"
                            )}>
                                {lastScan.direction === "in" ? "Checked In" : "Checked Out"}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="block text-2xl font-bold text-zinc-200">{lastScan.time}</span>
                            <span className="text-xs text-zinc-500">{lastScan.direction === "in" ? "Check-in" : "Check-out"} Time</span>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
