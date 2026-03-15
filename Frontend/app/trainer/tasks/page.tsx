'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/SharedComponents';
import { getErrorMessage, opsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

type Priority = 'high' | 'medium' | 'low';
type TaskStatus = 'pending' | 'in_progress' | 'completed';

const priorityColor: Record<Priority, string> = {
    high:   'text-red-400 bg-red-500/20',
    medium: 'text-yellow-400 bg-yellow-500/20',
    low:    'text-blue-400 bg-blue-500/20',
};

interface Task {
    id: number;
    task: string;
    priority: Priority;
    eta: string;
    status: TaskStatus;
    category: string;
}

export default function TrainerTasksPage() {
    const toast = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filter, setFilter] = useState<TaskStatus | 'all'>('all');

    useEffect(() => {
        Promise.all([opsAPI.equipmentEvents(), opsAPI.inventoryItems(), opsAPI.messages()])
            .then(([events, items, messages]) => {
                const fromEvents: Task[] = (events ?? [])
                    .filter((e: any) => e.status !== 'resolved')
                    .slice(0, 8)
                    .map((e: any, i: number) => ({
                        id: 100 + i,
                        task: e.description ?? 'Equipment follow-up',
                        priority: (e.severity === 'critical' ? 'high' : e.severity ?? 'medium') as Priority,
                        eta: '30 min',
                        status: e.status === 'in_progress' ? 'in_progress' : 'pending',
                        category: 'Maintenance',
                    }));
                const fromInventory: Task[] = (items ?? [])
                    .filter((i: any) => Number(i.qtyInStock) < Number(i.reorderThreshold))
                    .slice(0, 6)
                    .map((i: any, idx: number) => ({
                        id: 300 + idx,
                        task: `Restock ${i.name}`,
                        priority: 'medium',
                        eta: '15 min',
                        status: 'pending',
                        category: 'Inventory',
                    }));
                const fromMessages: Task[] = (messages ?? [])
                    .slice(0, 5)
                    .map((m: any, idx: number) => ({
                        id: 500 + idx,
                        task: m.subject ?? 'Review member request',
                        priority: (m.priority === 'critical' ? 'high' : m.priority ?? 'low') as Priority,
                        eta: '10 min',
                        status: m.status === 'read' ? 'completed' : 'pending',
                        category: 'Member Care',
                    }));
                setTasks([...fromEvents, ...fromInventory, ...fromMessages]);
            })
            .catch((err) => toast.error('Failed to load tasks', getErrorMessage(err)));
    }, []);

    const toggle = (id: number) => {
        setTasks(prev => prev.map(t => t.id === id ? {
            ...t,
            status: t.status === 'completed' ? 'pending' : 'completed'
        } : t));
    };

    const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
    const completed = useMemo(() => tasks.filter((t) => t.status === 'completed').length, [tasks]);

    const pct = tasks.length ? (completed / tasks.length) * 100 : 0;

    return (
        <div className="space-y-8">
            <PageHeader
                title="Daily Tasks"
                subtitle="Your task list for today at PowerWorld Kiribathgoda"
            />

            <Card padding="md">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-white font-semibold">Today's Progress</p>
                    <p className="text-zinc-400 text-sm">{completed} / {tasks.length} completed</p>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-3">
                    <div className="bg-gradient-to-r from-orange-600 to-orange-400 h-3 rounded-full transition-all"
                        style={{ width: `${pct}%` }} />
                </div>
                <p className="text-zinc-500 text-xs mt-2">{Math.round(pct)}% done</p>
            </Card>

            <div className="flex gap-2">
                {(['all','pending','in_progress','completed'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-red-600 text-white border border-red-500' : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'}`}>
                        {f.replace('_',' ')}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {filtered.map(t => (
                    <div key={t.id} onClick={() => toggle(t.id)} className="cursor-pointer">
                        <Card padding="md"
                            className={`transition-all hover:border-zinc-700/50 ${t.status === 'completed' ? 'border-emerald-500/20 opacity-60' : ''}`}>
                        <div className="flex items-start gap-4">
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${t.status === 'completed' ? 'border-green-500 bg-green-500/20' : 'border-zinc-600'}`}>
                                {t.status === 'completed' && <CheckCircle2 size={14} className="text-green-400" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <p className={`font-semibold text-sm ${t.status === 'completed' ? 'line-through text-zinc-500' : 'text-white'}`}>{t.task}</p>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ml-2 flex-shrink-0 ${priorityColor[t.priority]}`}>{t.priority}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                                    <span className="flex items-center gap-1"><Clock size={10} /> {t.eta}</span>
                                    <span>{t.category}</span>
                                    {t.status === 'in_progress' && <span className="text-yellow-400 flex items-center gap-1"><AlertTriangle size={10} /> In Progress</span>}
                                </div>
                            </div>
                        </div>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
}
