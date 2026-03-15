'use client';

import { useEffect, useState } from 'react';
import { HelpCircle, CheckCircle2, Clock, User } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

type Priority = 'high' | 'medium' | 'low';
type ReqStatus = 'open' | 'in_progress' | 'resolved';

const priorityColor: Record<Priority, string> = {
    high:   'text-red-400 bg-red-500/20 border-red-500/30',
    medium: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
    low:    'text-blue-400 bg-blue-500/20 border-blue-500/30',
};
const statusColor: Record<ReqStatus, string> = {
    open:        'text-red-400 bg-red-500/20',
    in_progress: 'text-yellow-400 bg-yellow-500/20',
    resolved:    'text-green-400 bg-green-500/20',
};

interface Request {
    id: number;
    messageId: string;
    member: string;
    memberId: string;
    request: string;
    subject: string;
    time: string;
    priority: Priority;
    status: ReqStatus;
    location: string;
}

export default function TrainerAssistancePage() {
    const toast = useToast();
    const [requests, setRequests] = useState<Request[]>([]);
    const [filter, setFilter] = useState<ReqStatus | 'all'>('all');

    const loadMessages = () =>
        opsAPI.messages()
            .then((rows) => {
                setRequests((rows ?? []).map((r: any, idx: number) => ({
                    id: idx + 1,
                    messageId: r.id,
                    member: r.subject?.split(' - ')[0] ?? `Member ${idx + 1}`,
                    memberId: r.toPersonId ?? '—',
                    subject: r.subject ?? '',
                    request: r.body ?? '',
                    time: new Date(r.createdAt ?? new Date()).toLocaleString(),
                    priority: (r.priority === 'critical' ? 'high' : r.priority ?? 'medium') as Priority,
                    status: r.status === 'read' ? 'resolved' : 'open',
                    location: 'Gym floor',
                })));
            })
            .catch((err) => toast.error('Failed to load messages', getErrorMessage(err)));

    useEffect(() => { loadMessages(); }, []);

    const resolve = async (id: number) => {
        const req = requests.find(r => r.id === id);
        if (!req) return;
        try {
            await opsAPI.markMessageRead(req.messageId);
            await loadMessages();
            toast.success('Marked as Read', `Message has been marked as read`);
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        }
    };

    const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
    const open = requests.filter(r => r.status !== 'resolved').length;

    return (
        <div className="space-y-8">
            <PageHeader
                title="Member Assistance"
                subtitle="Help members who need support on the floor"
                badge={open > 0 ? `${open} open` : undefined}
                badgeColor="red"
            />

            <div className="flex gap-2">
                {(['all','open','in_progress','resolved'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-red-600 text-white border border-red-500' : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'}`}>
                        {f.replace('_',' ')}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {filtered.map(r => (
                    <Card key={r.id} padding="md" className={r.priority === 'high' && r.status !== 'resolved' ? 'border-red-500/30' : 'hover:border-zinc-700/50 transition-colors'}>
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-600/20 rounded-full flex items-center justify-center">
                                    <User size={18} className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold">{r.member}</p>
                                    <p className="text-zinc-500 text-xs">{r.memberId} · {r.location}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${priorityColor[r.priority]}`}>{r.priority}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColor[r.status]}`}>{r.status.replace('_',' ')}</span>
                            </div>
                        </div>
                        <p className="text-zinc-300 text-sm mb-3 pl-13">{r.request}</p>
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-600 text-xs flex items-center gap-1"><Clock size={10} /> {r.time}</span>
                            {r.status !== 'resolved' && (
                                <button onClick={() => resolve(r.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-xs font-semibold transition-all">
                                    <CheckCircle2 size={12} /> Mark Resolved
                                </button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
