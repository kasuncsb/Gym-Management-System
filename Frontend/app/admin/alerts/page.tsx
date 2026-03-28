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
    source: 'equipment' | 'audit';
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
    const [actionId, setActionId] = useState<string | null>(null);

    const loadAlerts = async () => {
        const [events, audits] = await Promise.all([
            opsAPI.equipmentEvents(),
            opsAPI.auditLogs(150).catch(() => []),
        ]);
        const eqAlerts: Alert[] = (events ?? [])
            .filter((e: any) => e.status !== 'resolved')
            .map((e: any) => ({
                id: e.id,
                type: 'equipment' as AlertType,
                title: `Equipment issue${e.equipmentName ? ` — ${e.equipmentName}` : ''}`,
                message: e.description ?? 'Equipment event',
                priority: e.severity === 'critical' ? 'high' : (e.severity ?? 'medium'),
                status: e.status === 'in_progress' ? 'acknowledged' : 'pending',
                link: '/manager/equipment',
                createdAt: String(e.createdAt ?? new Date().toISOString()),
                source: 'equipment' as const,
            }));
        const auditAlerts: Alert[] = (audits as any[])
            .filter((r) =>
                r.category === 'security'
                || r.category === 'access'
                || r.category === 'trainer'
                || r.action === 'staff_broadcast',
            )
            .map((r) => ({
                id: `audit-${r.id}`,
                type: 'system' as AlertType,
                title: r.action ?? 'Audit',
                message: [r.detail, r.actorLabel].filter(Boolean).join(' — ') || 'Audit event',
                priority: 'high' as const,
                status: 'pending' as AlertStatus,
                createdAt: String(r.createdAt ?? new Date().toISOString()),
                source: 'audit' as const,
            }));
        setAlerts([...eqAlerts, ...auditAlerts].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
    };

    useEffect(() => {
        loadAlerts().catch(err => toast.error('Failed to load alerts', getErrorMessage(err)));
    }, []);

    const filtered = filter === 'all' ? alerts : alerts.filter(a => a.status === filter);

    const acknowledge = async (a: Alert) => {
        if (a.source === 'audit') {
            toast.info('Audit entry', 'This is a read-only audit log line — nothing to acknowledge.');
            return;
        }
        setActionId(a.id + 'ack');
        try {
            await opsAPI.resolveEquipmentEvent(a.id);
            toast.success('Acknowledged', 'Equipment alert acknowledged and marked in-progress.');
            await loadAlerts();
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setActionId(null);
        }
    };

    const resolve = async (a: Alert) => {
        if (a.source === 'audit') {
            toast.info('Audit entry', 'Resolve equipment issues from the list above; audit rows are informational only.');
            return;
        }
        setActionId(a.id + 'res');
        try {
            await opsAPI.resolveEquipmentEvent(a.id);
            toast.success('Resolved', 'Equipment issue has been resolved.');
            await loadAlerts();
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setActionId(null);
        }
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
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                                    <Icon size={18} className="text-zinc-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-white font-semibold truncate">{a.title}</p>
                                    <p className="text-zinc-500 text-sm truncate">{a.message}</p>
                                    <p className="text-zinc-600 text-xs mt-1">{new Date(a.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
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
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {a.link && (
                                    <Link href={a.link}>
                                        <LoadingButton variant="secondary" size="sm">View</LoadingButton>
                                    </Link>
                                )}
                                {a.status === 'pending' && (
                                    <>
                                        <LoadingButton
                                            variant="secondary"
                                            size="sm"
                                            loading={actionId === a.id + 'ack'}
                                            onClick={() => acknowledge(a)}
                                        >
                                            Acknowledge
                                        </LoadingButton>
                                        <LoadingButton
                                            size="sm"
                                            loading={actionId === a.id + 'res'}
                                            onClick={() => resolve(a)}
                                        >
                                            Resolve
                                        </LoadingButton>
                                    </>
                                )}
                                {a.status === 'acknowledged' && (
                                    <LoadingButton
                                        size="sm"
                                        loading={actionId === a.id + 'res'}
                                        onClick={() => resolve(a)}
                                    >
                                        Resolve
                                    </LoadingButton>
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
