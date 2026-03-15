'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, CreditCard, Wrench, XCircle } from 'lucide-react';
import { PageHeader, Card, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';
import { getErrorMessage, opsAPI } from '@/lib/api';

type AlertType = 'id_verification' | 'payment' | 'equipment' | 'system';
type AlertStatus = 'pending' | 'acknowledged' | 'resolved';

interface Alert {
    id: string;
    type: AlertType;
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    status: AlertStatus;
    link?: string;
    createdAt: string;
    source?: 'message' | 'equipment';
}

const typeIcon: Record<AlertType, React.ElementType> = {
    id_verification: ShieldCheck,
    payment: CreditCard,
    equipment: Wrench,
    system: XCircle,
};

const priorityColor: Record<string, string> = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export default function AdminAlertsPage() {
    const toast = useToast();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [filter, setFilter] = useState<AlertStatus | 'all'>('all');

    const loadAlerts = async () => {
        const [messages, events] = await Promise.all([opsAPI.messages(), opsAPI.equipmentEvents()]);
        const msgAlerts: Alert[] = (messages ?? []).map((m: any) => ({
            id: m.id,
            type: m.subject?.toLowerCase().includes('payment') ? 'payment' : 'system',
            title: m.subject ?? 'System message',
            message: m.body ?? '',
            priority: m.priority ?? 'medium',
            status: m.status === 'read' ? 'acknowledged' : 'pending',
            createdAt: String(m.createdAt ?? new Date().toISOString()),
            source: 'message',
        }));
        const eqAlerts: Alert[] = (events ?? [])
            .filter((e: any) => e.status !== 'resolved')
            .map((e: any) => ({
                id: e.id,
                type: 'equipment',
                title: 'Equipment issue',
                message: e.description ?? 'Equipment event',
                priority: e.severity === 'critical' ? 'high' : (e.severity ?? 'medium'),
                status: e.status === 'in_progress' ? 'acknowledged' : 'pending',
                link: '/manager/equipment',
                createdAt: String(e.createdAt ?? new Date().toISOString()),
                source: 'equipment',
            }));
        setAlerts([...msgAlerts, ...eqAlerts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };

    useEffect(() => {
        loadAlerts().catch((err) => toast.error('Failed to load alerts', getErrorMessage(err)));
    }, []);

    const filtered = filter === 'all' ? alerts : alerts.filter(a => a.status === filter);

    const acknowledge = (a: Alert) => {
        if (a.source === 'message') {
            opsAPI.markMessageRead(a.id)
                .then(() => loadAlerts())
                .then(() => toast.success('Acknowledged', 'Alert has been acknowledged'))
                .catch((err) => toast.error('Error', getErrorMessage(err)));
            return;
        }
        setAlerts((prev) => prev.map((x) => x.id === a.id ? { ...x, status: 'acknowledged' } : x));
        toast.success('Acknowledged', 'Equipment alert acknowledged');
    };

    const resolve = (a: Alert) => {
        setAlerts(prev => prev.map(x => x.id === a.id ? { ...x, status: 'resolved' as AlertStatus } : x));
        toast.success('Resolved', 'Alert has been marked resolved');
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="System Alerts"
                subtitle="Pending verifications, failed payments, equipment issues, system errors"
            />

            <div className="flex gap-2">
                {(['all', 'pending', 'acknowledged', 'resolved'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-red-600 text-white' : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'}`}>
                        {f}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {filtered.map(a => {
                    const Icon = typeIcon[a.type];
                    return (
                        <Card key={a.id} padding="md" className={`flex items-center justify-between gap-4 ${a.status === 'resolved' ? 'opacity-60' : ''}`}>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                                    <Icon size={18} className="text-zinc-400" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold">{a.title}</p>
                                    <p className="text-zinc-500 text-sm">{a.message}</p>
                                    <p className="text-zinc-600 text-xs mt-1">{new Date(a.createdAt).toLocaleString()}</p>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${priorityColor[a.priority]}`}>
                                    {a.priority}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                    a.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                    a.status === 'acknowledged' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                    {a.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {a.link && (
                                    <Link href={a.link}>
                                        <LoadingButton variant="secondary" size="sm">View</LoadingButton>
                                    </Link>
                                )}
                                {a.status === 'pending' && (
                                    <>
                                        <LoadingButton variant="secondary" size="sm" onClick={() => acknowledge(a)}>Acknowledge</LoadingButton>
                                        <LoadingButton size="sm" onClick={() => resolve(a)}>Resolve</LoadingButton>
                                    </>
                                )}
                                {a.status === 'acknowledged' && (
                                    <LoadingButton size="sm" onClick={() => resolve(a)}>Resolve</LoadingButton>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className="py-16 text-center text-zinc-500">No alerts in this category.</div>
            )}
        </div>
    );
}
