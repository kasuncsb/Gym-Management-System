'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Users, TrendingUp, Activity, CreditCard, AlertTriangle, Settings, ShieldCheck, Clock } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/SharedComponents';

type AlertType = 'warning' | 'error' | 'info';

const alertColor: Record<AlertType, string> = {
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    error:   'border-red-500/30 bg-red-500/10 text-red-400',
    info:    'border-blue-500/30 bg-blue-500/10 text-blue-400',
};

export default function AdminDashboard() {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const firstName = user?.fullName?.split(' ')[0] ?? 'Admin';

    const kpis = [
        { label: 'Total Members',   value: '1,247', sub: '1,089 active',        icon: Users,     color: 'from-blue-600 to-blue-700' },
        { label: 'Total Revenue',   value: 'Rs.45,680', sub: 'Rs.12,340 this month', icon: TrendingUp, color: 'from-green-600 to-green-700' },
        { label: 'System Uptime',   value: '99.9%', sub: 'Last 30 days',        icon: Activity,  color: 'from-purple-600 to-purple-700' },
        { label: 'Subscriptions',   value: '1,089', sub: '23 pending payments',  icon: CreditCard, color: 'from-orange-600 to-orange-700' },
    ];

    const quickActions = [
        { label: 'User Management',  href: '/admin/users',      icon: Users },
        { label: 'System Settings',  href: '/admin/settings',   icon: Settings },
        { label: 'Sub. Plans',       href: '/admin/plans',      icon: CreditCard },
        { label: 'System Reports',   href: '/admin/reports',    icon: TrendingUp },
    ];

    const alerts: { type: AlertType; message: string; priority: string }[] = [
        { type: 'warning', message: 'Database backup overdue',       priority: 'high' },
        { type: 'info',    message: 'New software update available',  priority: 'medium' },
    ];

    const activities = [
        { action: 'New member registered',     user: 'Nimal Perera',      time: '2 min ago',   type: 'member' },
        { action: 'Subscription plan updated', user: 'Admin',             time: '15 min ago',  type: 'system' },
        { action: 'Payment processed',         user: 'Chathurika Silva',  time: '1 hour ago',  type: 'payment' },
        { action: 'System backup completed',   user: 'System',            time: '2 hours ago', type: 'system' },
        { action: 'Member check-in',           user: 'Isuru Bandara',     time: '3 hours ago', type: 'member' },
    ];

    const plans = [
        { name: 'Basic',        price: 'Rs.2,900/mo', members: 456 },
        { name: 'Premium',      price: 'Rs.4,900/mo', members: 389 },
        { name: 'Elite',        price: 'Rs.7,900/mo', members: 244 },
        { name: 'Annual Basic', price: 'Rs.29,900/yr', members: 123 },
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
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
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
