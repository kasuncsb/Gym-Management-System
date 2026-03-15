'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { QrCode, Wrench, ClipboardList, HelpCircle, Users, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/SharedComponents';
import { getErrorMessage, opsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { useRealtimePolling } from '@/hooks/useRealtimePolling';

type CheckInType = 'check-in' | 'check-out' | 'assistance';
type Priority = 'high' | 'medium' | 'low';
type EquipmentStatus = 'operational' | 'maintenance' | 'out_of_order';

const statusColor: Record<EquipmentStatus, string> = {
    operational: 'text-green-400 bg-green-500/20',
    maintenance:  'text-yellow-400 bg-yellow-500/20',
    out_of_order: 'text-red-400 bg-red-500/20',
};
const priorityColor: Record<Priority, string> = {
    high:   'text-red-400 bg-red-500/20',
    medium: 'text-yellow-400 bg-yellow-500/20',
    low:    'text-blue-400 bg-blue-500/20',
};
const typeIcon: Record<CheckInType, React.JSX.Element> = {
    'check-in':   <CheckCircle2 size={18} className="text-green-400" />,
    'check-out':  <AlertTriangle size={18} className="text-red-400" />,
    'assistance': <HelpCircle   size={18} className="text-blue-400" />,
};

export default function TrainerDashboard() {
    const { user } = useAuth();
    const toast = useToast();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [dashboard, setDashboard] = useState<any>(null);
    const [recentCheckIns, setRecentCheckIns] = useState<Array<{ member: string; time: string; type: CheckInType }>>([]);
    const [pendingTasks, setPendingTasks] = useState<Array<{ task: string; priority: Priority; eta: string }>>([]);
    const [equipment, setEquipment] = useState<Array<{ name: string; status: EquipmentStatus; last: string }>>([]);

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    const refresh = async () => {
        const [dash, visits, equipmentRows, eventRows, myVisits] = await Promise.all([
            opsAPI.dashboard('trainer'),
            opsAPI.visits(100),
            opsAPI.equipment(),
            opsAPI.equipmentEvents(),
            opsAPI.myVisits(1),
        ]);
        if (myVisits?.[0]) {
            setIsCheckedIn(myVisits[0].status === 'active');
        }
        setDashboard(dash);
        setRecentCheckIns((visits ?? []).slice(0, 6).map((v: any) => ({
            member: v.fullName ?? 'Member',
            time: new Date(v.checkInAt ?? v.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            type: v.status === 'active' ? 'check-in' : 'check-out',
        })));
        setPendingTasks((eventRows ?? []).slice(0, 4).map((e: any) => ({
            task: e.description ?? 'Resolve equipment issue',
            priority: (e.severity === 'critical' || e.severity === 'high') ? 'high' : e.severity === 'medium' ? 'medium' : 'low',
            eta: 'Today',
        })));
        setEquipment((equipmentRows ?? []).slice(0, 6).map((e: any) => ({
            name: e.name,
            status: e.status === 'needs_maintenance' ? 'maintenance' : e.status === 'retired' ? 'out_of_order' : (e.status as EquipmentStatus),
            last: String(e.createdAt ?? '').slice(0, 10),
        })));
    };
    useRealtimePolling(() => { refresh().catch(() => undefined); }, 15000);

    const firstName = user?.fullName?.split(' ')[0] ?? 'Trainer';

    const stats = [
        { label: 'Members Assisted', value: String(recentCheckIns.length), icon: Users, color: 'from-blue-600 to-blue-700' },
        { label: 'Check-ins Today', value: String(dashboard?.todayVisits ?? 0), icon: CheckCircle2, color: 'from-green-600 to-green-700' },
        { label: 'Equipment Issues', value: String(dashboard?.openIssues ?? 0), icon: Wrench, color: 'from-red-600 to-red-700' },
        { label: 'Tasks Pending', value: String(pendingTasks.length), icon: ClipboardList, color: 'from-purple-600 to-purple-700' },
    ];

    const quickActions = [
        { label: 'Member Check-in', href: '/trainer/checkin',    icon: QrCode },
        { label: 'Equipment',       href: '/trainer/equipment',  icon: Wrench },
        { label: 'Assistance',      href: '/trainer/assistance', icon: HelpCircle },
        { label: 'Daily Tasks',     href: '/trainer/tasks',      icon: ClipboardList },
    ];

    return (
        <div className="space-y-8">
            <PageHeader
                title="Trainer Dashboard"
                subtitle={`Welcome back, ${firstName} · ${currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · ${currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`}
            />

            <Card padding="md" className="flex items-center justify-between">
                <div>
                    <p className="text-white font-semibold">Shift Status</p>
                    <p className="text-zinc-500 text-sm">{isCheckedIn ? 'You are currently on shift' : 'You are not checked in'}</p>
                </div>
                <button
                    onClick={async () => {
                        try {
                            if (isCheckedIn) await opsAPI.checkOut();
                            else await opsAPI.checkIn();
                            setIsCheckedIn(!isCheckedIn);
                            await refresh();
                        } catch (err) {
                            toast.error('Shift status update failed', getErrorMessage(err));
                        }
                    }}
                    className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${isCheckedIn ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                >
                    {isCheckedIn ? 'Check Out' : 'Check In'}
                </button>
            </Card>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(({ label, value, icon: Icon, color }) => (
                    <Card key={label} padding="md" className="hover:border-zinc-700/50 transition-colors">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
                            <Icon size={18} className="text-white" />
                        </div>
                        <p className="text-2xl font-bold text-white">{value}</p>
                        <p className="text-xs text-zinc-500 mt-1">{label}</p>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map(({ label, href, icon: Icon }) => (
                    <Link key={href} href={href}
                        className="bg-zinc-800/80 border border-zinc-700 rounded-2xl p-5 flex flex-col items-center gap-3 transition-all hover:bg-zinc-800 hover:border-red-500/60 hover:scale-[1.02]">
                        <Icon size={24} className="text-red-500" />
                        <span className="text-sm font-semibold text-white">{label}</span>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-white">Recent Check-ins</h2>
                        <Link href="/trainer/checkin" className="text-sm text-red-500 hover:text-red-400">View All</Link>
                    </div>
                    <div className="space-y-3">
                        {recentCheckIns.map((c, i) => (
                            <div key={i} className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-zinc-800 rounded-lg flex items-center justify-center">
                                        {typeIcon[c.type]}
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-semibold">{c.member}</p>
                                        <p className="text-zinc-500 text-xs capitalize">{c.type}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-zinc-500 text-xs">
                                    <Clock size={12} /> {c.time}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <h2 className="text-lg font-semibold text-white mb-5">Pending Tasks</h2>
                    <div className="space-y-3">
                        {pendingTasks.map((t, i) => (
                            <div key={i} className="bg-zinc-800/30 rounded-xl p-3">
                                <div className="flex justify-between mb-1">
                                    <p className="text-white text-sm font-semibold">{t.task}</p>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${priorityColor[t.priority]}`}>{t.priority}</span>
                                </div>
                                <p className="text-zinc-500 text-xs">Est. {t.eta}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <Card padding="lg">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-semibold text-white">Equipment Status</h2>
                    <Link href="/trainer/equipment" className="text-sm text-red-500 hover:text-red-400">Manage</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {equipment.map((e, i) => (
                        <div key={i} className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-4">
                            <div>
                                <p className="text-white text-sm font-semibold">{e.name}</p>
                                <p className="text-zinc-500 text-xs">Last maintenance: {e.last}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusColor[e.status]}`}>
                                {e.status.replace('_', ' ')}
                            </span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
