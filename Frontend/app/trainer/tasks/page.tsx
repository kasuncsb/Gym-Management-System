'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/SharedComponents';
import { getErrorMessage, opsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

type Priority = 'high' | 'medium' | 'low';
type TaskStatus = 'pending' | 'in_progress' | 'completed';

interface Task {
    id: string;          // actual DB id for API calls
    displayId: number;   // for stable keys
    task: string;
    priority: Priority;
    eta: string;
    status: TaskStatus;
    category: string;
    source: 'equipment' | 'inventory' | 'message';
}

const priorityColor: Record<Priority, string> = {
    high:   'text-red-400 bg-red-500/20',
    medium: 'text-yellow-400 bg-yellow-500/20',
    low:    'text-blue-400 bg-blue-500/20',
};

export default function TrainerTasksPage() {
    const toast = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
    const [resolving, setResolving] = useState<string | null>(null);

    const loadTasks = async () => {
        const [events, items, messages] = await Promise.all([
            opsAPI.equipmentEvents(),
            opsAPI.inventoryItems(),
            opsAPI.messages(),
        ]);

        const fromEvents: Task[] = (events ?? [])
            .filter((e: any) => e.status !== 'resolved')
            .slice(0, 8)
            .map((e: any, i: number) => ({
                id: e.id,
                displayId: 100 + i,
                task: e.description ?? 'Equipment follow-up',
                priority: (e.severity === 'critical' ? 'high' : e.severity ?? 'medium') as Priority,
                eta: '30 min',
                status: e.status === 'in_progress' ? 'in_progress' : 'pending',
                category: 'Maintenance',
                source: 'equipment' as const,
            }));

        const fromInventory: Task[] = (items ?? [])
            .filter((i: any) => Number(i.qtyInStock) < Number(i.reorderThreshold))
            .slice(0, 6)
            .map((i: any, idx: number) => ({
                id: i.id,
                displayId: 300 + idx,
                task: `Restock ${i.name}`,
                priority: 'medium' as Priority,
                eta: '15 min',
                status: 'pending' as TaskStatus,
                category: 'Inventory',
                source: 'inventory' as const,
            }));

        const fromMessages: Task[] = (messages ?? [])
            .filter((m: any) => m.status !== 'read')
            .slice(0, 5)
            .map((m: any, idx: number) => ({
                id: m.id,
                displayId: 500 + idx,
                task: m.subject ?? 'Review member request',
                priority: (m.priority === 'critical' ? 'high' : m.priority ?? 'low') as Priority,
                eta: '10 min',
                status: 'pending' as TaskStatus,
                category: 'Member Care',
                source: 'message' as const,
            }));

        setTasks([...fromEvents, ...fromInventory, ...fromMessages]);
    };

    useEffect(() => {
        loadTasks().catch(err => toast.error('Failed to load tasks', getErrorMessage(err)));
    }, []);

    const toggle = async (task: Task) => {
        if (task.status === 'completed') return; // already done, no un-completing
        setResolving(task.id);
        try {
            if (task.source === 'equipment') {
                await opsAPI.resolveEquipmentEvent(task.id);
                toast.success('Resolved', 'Equipment issue marked as resolved.');
                await loadTasks(); // reload from DB
                return;
            }
            if (task.source === 'message') {
                await opsAPI.markMessageRead(task.id);
                toast.success('Done', 'Task marked as complete.');
                await loadTasks();
                return;
            }
            // For inventory restock tasks, call the API
            if (task.source === 'inventory') {
                await opsAPI.addInventoryTxn({ itemId: task.id, txnType: 'restock', qtyChange: 1 });
                toast.success('Restocked', 'Inventory item restocked successfully.');
                await loadTasks();
                return;
            }
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t));
            toast.success('Done', 'Task marked as complete.');
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setResolving(null);
        }
    };

    const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
    const completed = useMemo(() => tasks.filter(t => t.status === 'completed').length, [tasks]);
    const pct = tasks.length ? (completed / tasks.length) * 100 : 0;

    return (
        <div className="space-y-8">
            <PageHeader
                title="Daily Tasks"
                subtitle="Your task list for today at PowerWorld Kiribathgoda"
            />

            <Card padding="md">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-white font-semibold">Today&apos;s Progress</p>
                    <p className="text-zinc-400 text-sm">{completed} / {tasks.length} completed</p>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-3">
                    <div className="bg-gradient-to-r from-orange-600 to-orange-400 h-3 rounded-full transition-all"
                        style={{ width: `${pct}%` }} />
                </div>
                <p className="text-zinc-500 text-xs mt-2">{Math.round(pct)}% done</p>
            </Card>

            <div className="flex gap-2">
                {(['all', 'pending', 'in_progress', 'completed'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-red-600 text-white border border-red-500' : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'}`}>
                        {f.replace('_', ' ')}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {filtered.map(t => (
                    <div
                        key={t.displayId}
                        onClick={() => t.status !== 'completed' && !resolving && toggle(t)}
                        className={`cursor-pointer ${resolving === t.id ? 'opacity-60 pointer-events-none' : ''}`}
                    >
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
                                        {t.status === 'in_progress' && (
                                            <span className="text-yellow-400 flex items-center gap-1">
                                                <AlertTriangle size={10} /> In Progress
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="text-center py-10 text-zinc-500 text-sm">No tasks in this category.</div>
                )}
            </div>
        </div>
    );
}
