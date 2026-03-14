'use client';

import { useState } from 'react';
import { ShieldCheck, CreditCard, Wrench, XCircle } from 'lucide-react';
import { PageHeader, Card, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';

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
}

const MOCK_ALERTS: Alert[] = [
    { id: '1', type: 'id_verification', title: 'Pending ID Verifications', message: '3 members awaiting NIC verification', priority: 'high', status: 'pending', link: '/admin/id-verification', createdAt: '2025-01-15T10:00:00' },
    { id: '2', type: 'payment', title: 'Failed Payment', message: 'Subscription payment failed for Nimal Perera', priority: 'high', status: 'pending', link: '/manager/subscriptions', createdAt: '2025-01-15T09:30:00' },
    { id: '3', type: 'equipment', title: 'Critical Equipment Issue', message: 'Rowing Machine — display not working', priority: 'high', status: 'pending', link: '/manager/equipment', createdAt: '2025-01-15T08:45:00' },
    { id: '4', type: 'system', title: 'Database Backup Overdue', message: 'Last backup was 36 hours ago', priority: 'medium', status: 'acknowledged', createdAt: '2025-01-14T22:00:00' },
];

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
    const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
    const [filter, setFilter] = useState<AlertStatus | 'all'>('all');

    const filtered = filter === 'all' ? alerts : alerts.filter(a => a.status === filter);

    const acknowledge = (a: Alert) => {
        setAlerts(prev => prev.map(x => x.id === a.id ? { ...x, status: 'acknowledged' as AlertStatus } : x));
        toast.success('Acknowledged', 'Alert has been acknowledged');
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
                                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
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
