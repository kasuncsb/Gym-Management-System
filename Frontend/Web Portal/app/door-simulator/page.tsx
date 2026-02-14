'use client';

import { useState, useRef, useEffect } from 'react';
import { qrAPI, getErrorMessage } from '@/lib/api';
import { Dumbbell, ScanLine, CheckCircle, XCircle, Clock, ArrowRight, ArrowLeft, UserCheck } from 'lucide-react';

interface ScanResult {
    success: boolean;
    accessGranted?: boolean;
    userId?: string;
    userName?: string;
    direction?: 'in' | 'out';
    sessionId?: string;
    message?: string;
    subscriptionValid?: boolean;
}

export default function DoorSimulatorPage() {
    const [qrInput, setQrInput] = useState('');
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [history, setHistory] = useState<(ScanResult & { time: string })[]>([]);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-focus the input
    useEffect(() => { inputRef.current?.focus(); }, []);

    const handleScan = async () => {
        if (qrInput.trim!()) return;
        setScanning(true);
        setResult(null);

        try {
            const { data } = await qrAPI.scan(qrInput.trim(), 'main-gate');
            const scanResult: ScanResult = data.data;
            setResult(scanResult);
            setHistory(prev => [{
                ...scanResult,
                time: new Date().toLocaleTimeString('en-LK', { hour12: true }),
            }, ...prev].slice(0, 20));
        } catch (err: any) {
            const msg = getErrorMessage(err);
            setResult({ success: false, message: msg });
            setHistory(prev => [{
                success: false, message: msg,
                time: new Date().toLocaleTimeString('en-LK', { hour12: true }),
            }, ...prev].slice(0, 20));
        } finally {
            setScanning(false);
            setQrInput('');
            inputRef.current?.focus();
        }
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleScan(); }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center p-4 md:p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-red-700 to-red-600 flex items-center justify-center">
                    <Dumbbell className="text-white" size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">PowerWorld <span className="text-red-500">Door Simulator</span></h1>
                    <p className="text-sm text-zinc-500">Paste a QR code payload to simulate gate access</p>
                </div>
            </div>

            <div className="w-full max-w-3xl grid gap-6 md:grid-cols-2">
                {/* Scanner Panel */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-2 mb-4">
                        <ScanLine className="text-red-500" size={20} />
                        <h2 className="text-lg font-semibold">QR Scanner</h2>
                    </div>

                    <textarea
                        ref={inputRef}
                        value={qrInput}
                        onChange={e => setQrInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder='Paste QR payload JSON here (e.g. {"userId":"...","ts":...,"sig":"..."})'
                        className="w-full h-28 bg-black/50 border border-zinc-800 rounded-xl p-3 text-sm font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-red-600 resize-none"
                    />

                    <button
                        onClick={handleScan}
                        disabled={scanning || !qrInput.trim()}
                        className="mt-3 w-full py-3 rounded-xl bg-linear-to-r from-red-700 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {scanning ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                            <>
                                <ScanLine size={18} />
                                Scan QR Code
                            </>
                        )}
                    </button>

                    {/* Result */}
                    {result && (
                        <div className={`mt-4 p-4 rounded-xl border ${result.accessGranted
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : result.success === false
                                ? 'bg-red-500/10 border-red-500/30'
                                : 'bg-amber-500/10 border-amber-500/30'
                            }`}>
                            <div className="flex items-center gap-2 mb-2">
                                {result.accessGranted ? (
                                    <CheckCircle className="text-emerald-500" size={24} />
                                ) : (
                                    <XCircle className="text-red-500" size={24} />
                                )}
                                <span className="font-bold text-lg">
                                    {result.accessGranted ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                                </span>
                            </div>
                            {result.userName && <p className="text-zinc-300 mb-1"><UserCheck size={14} className="inline mr-1" />{result.userName}</p>}
                            {result.direction && (
                                <p className="text-zinc-400 text-sm flex items-center gap-1">
                                    {result.direction === 'in' ? <ArrowRight size={14} className="text-emerald-400" /> : <ArrowLeft size={14} className="text-amber-400" />}
                                    {result.direction === 'in' ? 'Check-IN' : 'Check-OUT'}
                                </p>
                            )}
                            {result.message && <p className="text-zinc-500 text-sm mt-1">{result.message}</p>}
                        </div>
                    )}
                </div>

                {/* History Panel */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="text-zinc-400" size={20} />
                        <h2 className="text-lg font-semibold">Scan History</h2>
                        <span className="text-xs text-zinc-600 ml-auto">{history.length} scans</span>
                    </div>

                    {history.length === 0 ? (
                        <p className="text-zinc-600 text-sm text-center py-8">No scans yet. Paste a QR payload above.</p>
                    ) : (
                        <div className="space-y-2 max-h-100 overflow-y-auto pr-1">
                            {history.map((h, i) => (
                                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${h.accessGranted
                                    ? 'border-emerald-500/20 bg-emerald-500/5'
                                    : 'border-red-500/20 bg-red-500/5'
                                    }`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${h.accessGranted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {h.direction === 'in' ? 'IN' : h.direction === 'out' ? 'OUT' : '✗'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{h.userName || 'Unknown'}</p>
                                        <p className="text-xs text-zinc-500">{h.message || (h.accessGranted ? 'Access granted' : 'Denied')}</p>
                                    </div>
                                    <span className="text-xs text-zinc-600 whitespace-nowrap">{h.time}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <p className="mt-8 text-xs text-zinc-700 text-center max-w-md">
                This simulates the QR reader at the gym entrance gate. In production, a hardware QR scanner sends the payload automatically.
            </p>
        </div>
    );
}
