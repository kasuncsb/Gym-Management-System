'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, LogOut, Users, ShieldCheck } from 'lucide-react';
import { DoorQrCheckIn } from '@/components/checkin/DoorQrCheckIn';
import { PageHeader, Card, SearchInput } from '@/components/ui/SharedComponents';
import { getErrorMessage, opsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { useRealtimePolling } from '@/hooks/useRealtimePolling';

interface LogEntry {
    id: string;
    name: string;
    access: 'member' | 'team' | 'visitor';
    subscription: 'active' | 'expired' | 'visitor';
    type: 'in' | 'out';
    time: string;
}

const accessColor: Record<string, string> = {
    member: 'text-blue-400 bg-blue-500/20',
    team: 'text-green-400 bg-green-500/20',
    visitor: 'text-yellow-400 bg-yellow-500/20',
};

export default function ManagerCheckinPage() {
    const toast = useToast();
    const [search, setSearch] = useState('');
    const [log, setLog] = useState<LogEntry[]>([]);
    const [branchCapacity, setBranchCapacity] = useState(120);

    useEffect(() => {
        opsAPI
            .branchCapacity()
            .then((d) => setBranchCapacity(d.capacity || 120))
            .catch(() => undefined);
    }, []);

    const refresh = async () => {
        const visits = await opsAPI.visits(300);
        setLog(
            (visits ?? []).map((v: any) => ({
                id: v.personId,
                name: v.fullName ?? 'Unknown',
                access: (v.role === 'member' ? 'member' : 'team') as LogEntry['access'],
                subscription: v.status === 'denied' ? 'expired' : 'active',
                type: v.status === 'active' || !v.checkOutAt ? 'in' : 'out',
                time: new Date(v.checkInAt ?? v.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                }),
            })),
        );
    };

    useEffect(() => {
        refresh().catch((err) => toast.error('Failed to load check-in data', getErrorMessage(err)));
    }, []);
    useRealtimePolling(() => {
        refresh().catch(() => undefined);
    }, 10000);

    const filtered = log.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()) || l.id.includes(search));
    const inCount = useMemo(() => log.filter((l) => l.type === 'in' && l.subscription !== 'expired').length, [log]);
    const denied = useMemo(() => log.filter((l) => l.subscription === 'expired').length, [log]);

    return (
        <div className="space-y-10">
            <DoorQrCheckIn
                title="Check-in"
                subtitle="Scan the simulator QR for your own access, then review branch traffic below."
                showCapacity={false}
            />

            <PageHeader title="Check-in management" subtitle="Monitor entries and exits" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card padding="md" className="hover:border-zinc-700/50 transition-colors">
                    <Users size={20} className="text-blue-400 mb-3" />
                    <p className="text-3xl font-bold text-white">{inCount}</p>
                    <p className="text-zinc-500 text-xs">Currently inside</p>
                </Card>
                <Card padding="md" className="hover:border-zinc-700/50 transition-colors">
                    <ShieldCheck size={20} className="text-green-400 mb-3" />
                    <p className="text-3xl font-bold text-green-400">{log.length - denied}</p>
                    <p className="text-zinc-500 text-xs">Granted today</p>
                </Card>
                <Card padding="md" className="hover:border-zinc-700/50 transition-colors">
                    <CheckCircle2 size={20} className="text-red-400 mb-3" />
                    <p className="text-3xl font-bold text-red-400">{denied}</p>
                    <p className="text-zinc-500 text-xs">Denied</p>
                </Card>
            </div>

            <Card padding="md">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-white font-semibold">Capacity</span>
                    <span className="text-zinc-400">
                        {inCount} / {branchCapacity}
                    </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-3">
                    <div
                        className={`h-3 rounded-full transition-all ${
                            inCount / branchCapacity > 0.8 ? 'bg-red-500' : inCount / branchCapacity > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, (inCount / branchCapacity) * 100)}%` }}
                    />
                </div>
            </Card>

            <Card padding="lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h2 className="text-lg font-semibold text-white">Access log</h2>
                    <SearchInput
                        id="manager-checkin-search"
                        value={search}
                        onChange={setSearch}
                        placeholder="Search…"
                        className="w-full sm:w-56"
                        aria-label="Search"
                    />
                </div>
                <div className="space-y-2 max-h-[24rem] overflow-y-auto">
                    {filtered.map((l, i) => (
                        <div
                            key={i}
                            className={`flex items-center justify-between rounded-xl p-3 ${
                                l.subscription === 'expired' ? 'bg-red-950/30 border border-red-900/30' : 'bg-zinc-800/30'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                {l.type === 'in' ? (
                                    <CheckCircle2 size={16} className={l.subscription === 'expired' ? 'text-red-400' : 'text-green-400'} />
                                ) : (
                                    <LogOut size={16} className="text-zinc-400" />
                                )}
                                <div>
                                    <p className="text-white text-sm font-semibold">{l.name}</p>
                                    <p className="text-zinc-500 text-xs">{l.id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${accessColor[l.access]}`}>{l.access}</span>
                                {l.subscription === 'expired' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-red-400 bg-red-500/20">expired</span>
                                )}
                                <span className="text-zinc-500 text-xs">{l.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
