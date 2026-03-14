'use client';

import { useState } from 'react';
import { ClipboardList, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

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

const initialTasks: Task[] = [
    { id: 1, task: 'Clean cardio equipment',         priority: 'high',   eta: '30 min', status: 'pending',     category: 'Cleaning' },
    { id: 2, task: 'Restock towels in locker room',  priority: 'medium', eta: '15 min', status: 'pending',     category: 'Inventory' },
    { id: 3, task: 'Check weight area organisation', priority: 'low',    eta: '20 min', status: 'in_progress', category: 'Maintenance' },
    { id: 4, task: 'Update member attendance sheet', priority: 'medium', eta: '10 min', status: 'pending',     category: 'Admin' },
    { id: 5, task: 'Inspect treadmill belts',        priority: 'high',   eta: '45 min', status: 'pending',     category: 'Maintenance' },
    { id: 6, task: 'Log morning check-ins',          priority: 'low',    eta: '5 min',  status: 'completed',   category: 'Admin' },
    { id: 7, task: 'Sanitise squat racks',           priority: 'medium', eta: '25 min', status: 'completed',   category: 'Cleaning' },
];

export default function TrainerTasksPage() {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [filter, setFilter] = useState<TaskStatus | 'all'>('all');

    const toggle = (id: number) => {
        setTasks(prev => prev.map(t => t.id === id ? {
            ...t,
            status: t.status === 'completed' ? 'pending' : 'completed'
        } : t));
    };

    const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
    const completed = tasks.filter(t => t.status === 'completed').length;

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                    <ClipboardList size={28} className="text-orange-400" /> Daily Tasks
                </h1>
                <p className="text-zinc-400">Your task list for today at PowerWorld Kiribathgoda</p>
            </div>

            {/* Progress bar */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-white font-semibold">Today's Progress</p>
                    <p className="text-zinc-400 text-sm">{completed} / {tasks.length} completed</p>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-3">
                    <div className="bg-gradient-to-r from-orange-600 to-orange-400 h-3 rounded-full transition-all"
                        style={{ width: `${(completed / tasks.length) * 100}%` }} />
                </div>
                <p className="text-zinc-500 text-xs mt-2">{Math.round((completed / tasks.length) * 100)}% done</p>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                {(['all','pending','in_progress','completed'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                        {f.replace('_',' ')}
                    </button>
                ))}
            </div>

            {/* Tasks */}
            <div className="space-y-3">
                {filtered.map(t => (
                    <div key={t.id}
                        onClick={() => toggle(t.id)}
                        className={`bg-zinc-900/50 border rounded-2xl p-4 cursor-pointer transition-all hover:bg-zinc-900 ${t.status === 'completed' ? 'border-green-500/20 opacity-60' : 'border-zinc-800 hover:border-zinc-700'}`}>
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
                    </div>
                ))}
            </div>
        </div>
    );
}
