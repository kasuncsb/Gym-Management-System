'use client';

import { useState } from 'react';
import { QrCode, CheckCircle2, XCircle, LogOut, Users } from 'lucide-react';
import { PageHeader, Card, SearchInput, LoadingButton } from '@/components/ui/SharedComponents';

interface MemberEntry {
    id: string;
    name: string;
    subscription: 'active' | 'expired';
    lastSeen: string;
    type: 'in' | 'out';
    time: string;
}

const recentLog: MemberEntry[] = [
    { id: 'PW2025001', name: 'Nimal Perera',         subscription: 'active',  lastSeen: 'Today', type: 'in',  time: '08:02 AM' },
    { id: 'PW2025012', name: 'Chathurika Silva',     subscription: 'active',  lastSeen: 'Today', type: 'out', time: '08:45 AM' },
    { id: 'PW2024098', name: 'Saman Jayasinghe',     subscription: 'expired', lastSeen: '3 days ago', type: 'in', time: '09:10 AM' },
    { id: 'PW2025034', name: 'Thilini Wijesinghe',   subscription: 'active',  lastSeen: 'Today', type: 'in',  time: '09:22 AM' },
];

export default function TrainerCheckinPage() {
    const [search, setSearch] = useState('');
    const [scanning, setScanning] = useState(false);
    const [lastScan, setLastScan] = useState<MemberEntry | null>(null);

    const simulate = () => {
        setScanning(true);
        setTimeout(() => {
            setScanning(false);
            setLastScan(recentLog[Math.floor(Math.random() * recentLog.length)]);
        }, 1500);
    };

    const filtered = recentLog.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.id.includes(search));

    return (
        <div className="space-y-8">
            <PageHeader
                title="Member Check-in"
                subtitle="Process member entries and exits for PowerWorld Kiribathgoda"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card padding="lg" className="flex flex-col items-center gap-5">
                    <div className={`w-40 h-40 border-2 rounded-2xl flex items-center justify-center transition-all ${scanning ? 'border-blue-500 animate-pulse' : lastScan ? (lastScan.subscription === 'active' ? 'border-green-500' : 'border-red-500') : 'border-zinc-700'}`}>
                        {scanning ? (
                            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        ) : lastScan ? (
                            lastScan.subscription === 'active' ? <CheckCircle2 size={56} className="text-green-500" /> : <div className="text-red-500 font-bold text-center text-sm">Subscription<br/>Expired</div>
                        ) : (
                            <QrCode size={64} className="text-zinc-600" />
                        )}
                    </div>
                    {lastScan && !scanning && (
                        <div className="text-center">
                            <p className={`font-bold flex items-center justify-center gap-2 ${lastScan.subscription === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                                {lastScan.subscription === 'active' ? <><CheckCircle2 size={18} className="shrink-0" /> Access Granted</> : <><XCircle size={18} className="shrink-0" /> Access Denied</>}
                            </p>
                            <p className="text-white text-sm">{lastScan.name}</p>
                            <p className="text-zinc-500 text-xs">{lastScan.id}</p>
                        </div>
                    )}
                    <LoadingButton onClick={simulate} disabled={scanning} loading={scanning} className="w-full">
                        {scanning ? 'Scanning...' : 'Simulate QR Scan'}
                    </LoadingButton>
                </Card>

                <div className="space-y-4">
                    <Card padding="md">
                        <div className="flex items-center gap-3 mb-4">
                            <Users size={18} className="text-blue-400" />
                            <h2 className="text-white font-semibold">Current Capacity</h2>
                        </div>
                        <p className="text-4xl font-bold text-white">42 <span className="text-zinc-600 text-xl">/ 80</span></p>
                        <div className="w-full bg-zinc-800 rounded-full h-2 mt-3">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '52.5%' }} />
                        </div>
                        <p className="text-zinc-500 text-xs mt-1">52.5% capacity</p>
                    </Card>
                    <div className="grid grid-cols-2 gap-3">
                        <Card padding="md" className="text-center">
                            <p className="text-2xl font-bold text-green-400">45</p>
                            <p className="text-zinc-500 text-xs">Check-ins today</p>
                        </Card>
                        <Card padding="md" className="text-center">
                            <p className="text-2xl font-bold text-red-400">3</p>
                            <p className="text-zinc-500 text-xs">Denied (expired)</p>
                        </Card>
                    </div>
                </div>
            </div>

            <Card padding="lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h2 className="text-lg font-semibold text-white">Check-in Log</h2>
                    <SearchInput value={search} onChange={setSearch} placeholder="Search member..." className="w-full sm:w-56" />
                </div>
                <div className="space-y-2">
                    {filtered.map((m, i) => (
                        <div key={i} className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-3">
                            <div className="flex items-center gap-3">
                                {m.type === 'in' ? <CheckCircle2 size={16} className="text-green-400" /> : <LogOut size={16} className="text-red-400" />}
                                <div>
                                    <p className="text-white text-sm font-semibold">{m.name}</p>
                                    <p className="text-zinc-500 text-xs">{m.id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${m.subscription === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{m.subscription}</span>
                                <span className="text-zinc-500 text-xs">{m.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
