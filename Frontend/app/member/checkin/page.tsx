'use client';

import { useState } from 'react';
import { QrCode, CheckCircle2, LogOut, Users } from 'lucide-react';
import { PageHeader, Card, LoadingButton } from '@/components/ui/SharedComponents';

interface LogEntry {
    member: string;
    type: 'in' | 'out';
    time: string;
}

export default function CheckinPage() {
    const [scanned, setScanned] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [log, setLog] = useState<LogEntry[]>([
        { member: 'You (PW2025001)', type: 'in',  time: '08:30 AM' },
    ]);

    const simulate = () => {
        setScanning(true);
        // Capture the next type synchronously before the async gap so the
        // setTimeout callback never reads a stale closure value.
        const nextType: 'in' | 'out' = scanned ? 'out' : 'in';
        setTimeout(() => {
            setScanning(false);
            setScanned(prev => !prev);
            setLog(prev => [{ member: 'You (PW2025001)', type: nextType, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) }, ...prev]);
        }, 1500);
    };

    // Subtract check-outs so members who have left are not counted as inside.
    const checkIns   = log.filter(l => l.type === 'in').length;
    const checkOuts  = log.filter(l => l.type === 'out').length;
    const currentlyIn = Math.max(0, checkIns - checkOuts);

    return (
        <div className="space-y-8 max-w-2xl">
            <PageHeader
                title="Gym Check-in"
                subtitle="Scan or simulate QR entry to PowerWorld Kiribathgoda"
            />

            <Card padding="lg" className={`flex flex-col items-center gap-6 transition-all ${scanned ? 'border-emerald-500/40' : ''}`}>
                <div className={`relative w-48 h-48 border-2 rounded-2xl flex items-center justify-center transition-all ${scanning ? 'border-red-500 animate-pulse' : scanned ? 'border-green-500' : 'border-zinc-700'}`}>
                    {scanning ? (
                        <div className="absolute inset-2 flex items-center justify-center">
                            <div className="w-12 h-12 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : scanned ? (
                        <CheckCircle2 size={64} className="text-green-500" />
                    ) : (
                        <QrCode size={80} className="text-zinc-600" />
                    )}
                </div>

                <div className="text-center">
                    {scanning ? (
                        <p className="text-zinc-400">Scanning QR code...</p>
                    ) : scanned ? (
                        <>
                            <p className="text-green-400 font-bold text-lg flex items-center justify-center gap-2">
                                <CheckCircle2 size={20} className="shrink-0" /> Checked {log[0]?.type === 'in' ? 'In' : 'Out'} Successfully
                            </p>
                            <p className="text-zinc-500 text-sm">Member ID: PW2025001</p>
                        </>
                    ) : (
                        <p className="text-zinc-400">Present your QR code at the scanner</p>
                    )}
                </div>

                <LoadingButton onClick={simulate} disabled={scanning} loading={scanning} size="lg">
                    {scanning ? 'Scanning...' : scanned ? 'Simulate Check-out' : 'Simulate Scan'}
                </LoadingButton>
            </Card>

            <Card padding="md" className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Users size={20} className="text-blue-400" />
                    <div>
                        <p className="text-white font-semibold text-sm">Current Capacity</p>
                        <p className="text-zinc-500 text-xs">Kiribathgoda Branch</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-white font-bold text-xl">{currentlyIn} / 80</p>
                    <p className="text-zinc-500 text-xs">members in gym</p>
                </div>
            </Card>

            <Card padding="lg">
                <h2 className="text-lg font-semibold text-white mb-4">Today's Log</h2>
                <div className="space-y-2">
                    {log.map((l, i) => (
                        <div key={i} className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-3">
                            <div className="flex items-center gap-3">
                                {l.type === 'in' ? <CheckCircle2 size={16} className="text-green-400" /> : <LogOut size={16} className="text-red-400" />}
                                <span className="text-white text-sm">{l.member}</span>
                            </div>
                            <span className="text-zinc-500 text-xs">{l.time}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
