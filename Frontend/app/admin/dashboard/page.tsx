'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Users, TrendingUp, Activity, CreditCard, AlertTriangle, Settings, ShieldCheck, Clock } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/SharedComponents';
import { opsAPI } from '@/lib/api';
import { useRealtimePolling } from '@/hooks/useRealtimePolling';

type AlertType = 'warning' | 'error' | 'info';

const alertColor: Record<AlertType, string> = {
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    error:   'border-red-500/30 bg-red-500/10 text-red-400',
    info:    'border-blue-500/30 bg-blue-500/10 text-blue-400',
};

export default function AdminDashboard() {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [dashboard, setDashboard] = useState<any>(null);
    const [alerts, setAlerts] = useState<{ type: AlertType; message: string; priority: string }[]>([]);
    const [activities, setActivities] = useState<Array<{ action: string; user: string; time: string; type: string }>>([]);
    const [plans, setPlans] = useState<Array<{ name: string; price: string; members: number }>>([]);

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    const refresh = async () => {
        const [dash, messages, recent, subscriptions] = await Promise.all([
            opsAPI.dashboard('admin'),
            opsAPI.messages(),
            opsAPI.recentReports(),
            opsAPI.plans(),
        ]);
        setDashboard(dash);
        setAlerts((messages ?? []).slice(0, 3).map((m: any) => ({
            type: m.priority === 'critical' ? 'error' : m.priority === 'high' ? 'warning' : 'info',
            message: m.subject || m.body || 'System notification',
            priority: m.priority ?? 'normal',
        })));
        setActivities((recent ?? []).map((r: any) => ({
            action: r.title ?? r.kind ?? 'Activity',
            user: 'System',
            time: new Date(r.createdAt).toLocaleString(),
            type: r.kind === 'payment' ? 'payment' : 'system',
        })));
        setPlans((subscriptions ?? []).slice(0, 6).map((p: any) => ({
            name: p.name,
            price: `Rs.${Number(p.price).toLocaleString()}`,
            members: 0,
        })));
    };
    useRealtimePolling(() => { refresh().catch(() => undefined); }, 15000);

    const firstName = user?.fullName?.split(' ')[0] ?? 'Admin';

    const kpis = [
        { label: 'Total Members', value: String(dashboard?.activeMembers ?? 0), sub: 'active', icon: Users, color: 'from-blue-600 to-blue-700' },
        { label: 'Total Revenue', value: `Rs.${Number(dashboard?.monthlyRevenue ?? 0).toLocaleString()}`, sub: 'this month', icon: TrendingUp, color: 'from-green-600 to-green-700' },
        { label: 'Visits Today', value: String(dashboard?.todayVisits ?? 0), sub: 'today', icon: Activity, color: 'from-purple-600 to-purple-700' },
        { label: 'Open Issues', value: String(dashboard?.openIssues ?? 0), sub: 'equipment/incidents', icon: CreditCard, color: 'from-orange-600 to-orange-700' },
    ];

    const quickActions = [
        { label: 'User Management',  href: '/admin/users',      icon: Users },
        { label: 'System Settings',  href: '/admin/settings',   icon: Settings },
        { label: 'Sub. Plans',       href: '/admin/plans',      icon: CreditCard },
        { label: 'System Reports',   href: '/admin/reports',    icon: TrendingUp },
    ];

    const activityColor: Record<string, string> = {
        member:  'bg-blue-500/20',
        payment: 'bg-green-500/20',
        system:  'bg-purple-500/20',
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="System Administration"
                subtitle={`Welcome, ${firstName} · ${currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · ${currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`}
            />

            {/* System Alerts */}
            {alerts.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
                        <AlertTriangle size={14} className="text-yellow-500" /> System Alerts
                    </h2>
                    {alerts.map((a, i) => (
                        <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${alertColor[a.type]}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-current" />
                                <span className="text-sm font-medium">{a.message}</span>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-current/20 font-semibold capitalize">{a.priority}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map(({ label, value, sub, icon: Icon, color }) => (
                    <Card key={label} padding="md" className="hover:border-zinc-700/50 transition-colors">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
                            <Icon size={18} className="text-white" />
                        </div>
                        <p className="text-xl font-bold text-white">{value}</p>
                        <p className="text-xs text-zinc-500 mt-1">{label}</p>
                        <p className="text-xs text-zinc-600">{sub}</p>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map(({ label, href, icon: Icon }) => (
                    <Link key={href} href={href}
                        className="bg-zinc-800/80 border border-zinc-700 rounded-2xl p-5 flex flex-col items-center gap-3 transition-all hover:bg-zinc-800 hover:border-red-500/60 hover:scale-[1.02]">
                        <Icon size={24} className="text-red-500" />
                        <span className="text-sm font-semibold text-white">{label}</span>
                    </Link>
                ))}
            </div>

            {/* Activity + Plans */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Activity size={18} className="text-red-500" /> Recent Activity</h2>
                        <Link href="/admin/activities" className="text-sm text-red-500 hover:text-red-400">View All</Link>
                    </div>
                    <div className="space-y-3">
                        {activities.map((a, i) => (
                            <div key={i} className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-lg ${activityColor[a.type]} flex items-center justify-center`}>
                                        <Clock size={14} className="text-zinc-300" />
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-semibold">{a.action}</p>
                                        <p className="text-zinc-500 text-xs">by {a.user}</p>
                                    </div>
                                </div>
                                <span className="text-zinc-600 text-xs">{a.time}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><ShieldCheck size={18} className="text-green-500" /> Plans</h2>
                        <Link href="/admin/plans" className="text-sm text-red-500 hover:text-red-400">Manage</Link>
                    </div>
                    <div className="space-y-3">
                        {plans.map((p, i) => (
                            <div key={i} className="bg-zinc-800/30 rounded-xl p-3 flex justify-between items-center">
                                <div>
                                    <p className="text-white text-sm font-semibold">{p.name}</p>
                                    <p className="text-zinc-500 text-xs">{p.price}</p>
                                </div>
                                <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded-lg">{p.members} members</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
