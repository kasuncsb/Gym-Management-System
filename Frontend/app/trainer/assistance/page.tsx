'use client';

import { useEffect, useState } from 'react';
import { HelpCircle, CheckCircle2, Clock, Wrench } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

type Priority = 'high' | 'medium' | 'low';
type EqStatus = 'open' | 'in_progress' | 'resolved';

const priorityColor: Record<Priority, string> = {
    high:   'text-red-400 bg-red-500/20 border-red-500/30',
    medium: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
    low:    'text-blue-400 bg-blue-500/20 border-blue-500/30',
};
const statusColor: Record<EqStatus, string> = {
    open:        'text-red-400 bg-red-500/20',
    in_progress: 'text-yellow-400 bg-yellow-500/20',
    resolved:    'text-green-400 bg-green-500/20',
};

interface EquipmentFollowUp {
    id: string;
    title: string;
    description: string;
    time: string;
    priority: Priority;
    status: EqStatus;
}

interface AuditNotice {
    id: string;
    detail: string;
    actorLabel?: string | null;
    time: string;
}

export default function TrainerAssistancePage() {
    const toast = useToast();
    const [equipment, setEquipment] = useState<EquipmentFollowUp[]>([]);
    const [notices, setNotices] = useState<AuditNotice[]>([]);
    const [filter, setFilter] = useState<'all' | 'open' | 'in_progress'>('all');
    const [resolving, setResolving] = useState<string | null>(null);

    const load = async () => {
        const [events, audits] = await Promise.all([
            opsAPI.equipmentEvents(),
            opsAPI.auditLogs(120).catch(() => []),
        ]);
        const eqRows: EquipmentFollowUp[] = (events ?? [])
            .filter((e: any) => e.status !== 'resolved')
            .map((e: any) => ({
                id: e.id,
                title: e.equipmentName ? `Equipment — ${e.equipmentName}` : 'Equipment issue',
                description: e.description ?? 'Follow up on the floor',
                time: new Date(e.createdAt ?? Date.now()).toLocaleString(),
                priority: (e.severity === 'critical' ? 'high' : e.severity ?? 'medium') as Priority,
                status: (e.status === 'in_progress' ? 'in_progress' : 'open') as EqStatus,
            }));
        setEquipment(eqRows);

        const broadcastRows: AuditNotice[] = (audits as any[])
            .filter((a) => a.action === 'staff_broadcast')
            .slice(0, 20)
            .map((a) => ({
                id: a.id,
                detail: a.detail ?? '',
                actorLabel: a.actorLabel,
                time: new Date(a.createdAt ?? Date.now()).toLocaleString(),
            }));
        setNotices(broadcastRows);
    };

    useEffect(() => {
        load().catch((err) => toast.error('Failed to load assistance data', getErrorMessage(err)));
    }, []);

    const resolveEquipment = async (id: string) => {
        setResolving(id);
        try {
            await opsAPI.resolveEquipmentEvent(id);
            await load();
            toast.success('Resolved', 'Equipment issue marked resolved.');
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setResolving(null);
        }
    };

    const filteredEq = filter === 'all' ? equipment : equipment.filter((e) => e.status === filter);
    const openCount = equipment.filter((e) => e.status !== 'resolved').length;

    return (
        <div className="space-y-8">
            <PageHeader
                title="Member Assistance"
                subtitle="Open equipment issues and recent staff broadcast notices (audit log)"
                badge={openCount > 0 ? `${openCount} open` : undefined}
                badgeColor="red"
            />

            <div className="flex gap-2 flex-wrap">
                {(['all', 'open', 'in_progress'] as const).map((f) => (
                    <button
                        key={f}
                        type="button"
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-red-600 text-white border border-red-500' : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'}`}
                    >
                        {f.replace('_', ' ')}
                    </button>
                ))}
            </div>

            <Card padding="lg">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Wrench size={18} className="text-amber-400" />
                    Equipment follow-ups
                </h2>
                {filteredEq.length === 0 && (
                    <p className="text-zinc-500 text-sm">No equipment items in this filter.</p>
                )}
                <div className="space-y-4">
                    {filteredEq.map((r) => (
                        <Card key={r.id} padding="md" className={r.priority === 'high' ? 'border-red-500/30' : 'hover:border-zinc-700/50 transition-colors'}>
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-3">
                                <div>
                                    <p className="text-white font-semibold">{r.title}</p>
                                    <p className="text-zinc-500 text-xs mt-0.5 flex items-center gap-1">
                                        <Clock size={10} /> {r.time}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${priorityColor[r.priority]}`}>{r.priority}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColor[r.status]}`}>{r.status.replace('_', ' ')}</span>
                                </div>
                            </div>
                            <p className="text-zinc-300 text-sm mb-3">{r.description}</p>
                            {r.status !== 'resolved' && (
                                <div className="flex justify-start sm:justify-end">
                                    <button
                                        type="button"
                                        disabled={!!resolving}
                                        onClick={() => resolveEquipment(r.id)}
                                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 w-full sm:w-auto"
                                    >
                                        <CheckCircle2 size={12} /> {resolving === r.id ? '…' : 'Mark resolved'}
                                    </button>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            </Card>

            <Card padding="lg">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <HelpCircle size={18} className="text-purple-400" />
                    Staff notices (audit)
                </h2>
                {notices.length === 0 && (
                    <p className="text-zinc-500 text-sm">No recent broadcast notices. Override requests from your schedule are logged here for managers.</p>
                )}
                <div className="space-y-3">
                    {notices.map((n) => (
                        <div key={n.id} className="bg-zinc-800/30 rounded-xl p-3 text-sm">
                            <p className="text-zinc-300">{n.detail}</p>
                            <p className="text-zinc-600 text-xs mt-2 flex items-center gap-1">
                                <Clock size={10} /> {n.time}
                                {n.actorLabel ? ` · ${n.actorLabel}` : ''}
                            </p>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
