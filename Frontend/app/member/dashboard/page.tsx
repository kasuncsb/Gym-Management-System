'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Dumbbell, Calendar, TrendingUp, QrCode, Clock, Flame, Award, Activity } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/SharedComponents';
import { opsAPI } from '@/lib/api';
import { useRealtimePolling } from '@/hooks/useRealtimePolling';

export default function MemberDashboard() {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [dashboard, setDashboard] = useState<{ myVisits?: number; myWorkouts?: number; todayVisits: number; monthlyRevenue: number }>({ todayVisits: 0, monthlyRevenue: 0 });
    const [mySubscriptions, setMySubscriptions] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<Array<{ trainer: string; date: string; time: string; type: string }>>([]);
    const [activities, setActivities] = useState<Array<{ text: string; time: string; date: string }>>([]);
    const [weekActivity, setWeekActivity] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const refresh = async () => {
        const [dash, subs, pt, visits, logs, trainerList] = await Promise.all([
            opsAPI.dashboard('member'),
            opsAPI.mySubscriptions(),
            opsAPI.myPtSessions(),
            opsAPI.myVisits(6),
            opsAPI.myWorkoutLogs(),
            opsAPI.trainers(),
        ]);
        setDashboard(dash);
        setMySubscriptions((subs ?? []) as any[]);
        const trainerMap: Record<string, string> = {};
        (trainerList ?? []).forEach((t: any) => { trainerMap[t.id] = t.fullName ?? t.email; });
        setAppointments((pt ?? []).slice(0, 3).map((s: any) => ({
            trainer: s.trainerName ?? trainerMap[s.trainerId] ?? s.trainerId,
            date: String(s.sessionDate).slice(0, 10),
            time: String(s.startTime).slice(0, 5),
            type: 'Personal Training',
        })));
        const recentVisits = (visits ?? []).slice(0, 5).map((v: any) => ({
            text: v.status === 'active' ? 'Checked in' : 'Checked out',
            time: new Date(v.checkInAt ?? v.checkOutAt ?? v.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            date: 'Recent',
        }));
        const recentLogs = (logs ?? []).slice(0, 3).map((l: any) => ({
            text: 'Workout logged',
            time: `${l.durationMin ?? 0} min`,
            date: String(l.workoutDate).slice(0, 10),
        }));
        setActivities([...recentVisits, ...recentLogs].slice(0, 6));
        const buckets = Array.from({ length: 7 }, () => 0);
        const now = new Date();
        (logs ?? []).forEach((l: any) => {
            const d = new Date(l.workoutDate);
            const delta = Math.floor((now.getTime() - d.getTime()) / (24 * 3600 * 1000));
            if (delta >= 0 && delta < 7) buckets[6 - delta] += 1;
        });
        setWeekActivity(buckets);
    };
    useRealtimePolling(() => { refresh().catch(() => undefined); }, 15000);

    const greeting = currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening';
    const firstName = user?.fullName?.split(' ')[0] ?? 'Member';
    const activeSub = mySubscriptions.find((s) => ['active', 'grace_period'].includes(s.status)) ?? mySubscriptions[0];

    const stats = [
        { label: 'This Week',  value: String(weekActivity.reduce((n, v) => n + v, 0)), sub: 'workouts', icon: Dumbbell, color: 'from-red-600 to-red-700' },
        { label: 'Visits',     value: String(dashboard.myVisits ?? 0), sub: 'total', icon: Flame, color: 'from-orange-500 to-orange-600' },
        { label: 'Workouts', value: String(dashboard.myWorkouts ?? 0), sub: 'sessions', icon: Activity, color: 'from-blue-600 to-blue-700' },
        { label: 'Gym Traffic', value: String(dashboard.todayVisits), sub: 'today', icon: Clock, color: 'from-purple-600 to-purple-700' },
    ];

    const quickActions = [
        { label: 'Check In',      href: '/member/checkin',      icon: QrCode     },
        { label: 'Book Session',  href: '/member/appointments', icon: Calendar   },
        { label: 'View Progress', href: '/member/progress',     icon: TrendingUp },
        { label: 'Workouts',      href: '/member/workouts',     icon: Dumbbell   },
    ];

    const dayLabels    = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div className="space-y-8">
            <PageHeader
                title={`Good ${greeting}, ${firstName}!`}
                subtitle={`${currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · ${currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`}
            />

            <Card padding="md" className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Award className="text-red-500" size={20} />
                    <div>
                        <p className="text-white font-semibold text-sm">{activeSub?.planName ?? 'No active subscription'}</p>
                        <p className="text-zinc-500 text-xs">Member: {user?.fullName ?? 'Member'} · Ends: {activeSub?.endDate ?? 'N/A'}</p>
                    </div>
                </div>
                {activeSub ? (
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        activeSub.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                        activeSub.status === 'grace_period' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                    }`}>{activeSub.status?.replace('_', ' ') ?? 'unknown'}</span>
                ) : (
                    <span className="text-xs bg-zinc-700 text-zinc-400 px-3 py-1 rounded-full font-semibold">No Plan</span>
                )}
            </Card>

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

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(({ label, value, sub, icon: Icon, color }) => (
                    <Card key={label} padding="md" className="hover:border-zinc-700/50 transition-colors">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
                            <Icon size={18} className="text-white" />
                        </div>
                        <p className="text-2xl font-bold text-white">{value}</p>
                        <p className="text-xs text-zinc-500 mt-1">{label} · {sub}</p>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-white">Upcoming Appointments</h2>
                        <Link href="/member/appointments" className="text-sm text-red-500 hover:text-red-400 transition-colors">View All</Link>
                    </div>
                    <div className="space-y-3">
                        {appointments.map((a, i) => (
                            <div key={i} className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                                        <Calendar size={18} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold text-sm">{a.trainer}</p>
                                        <p className="text-zinc-500 text-xs">{a.type}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-white text-sm font-semibold">{a.date}</p>
                                    <p className="text-zinc-500 text-xs">{a.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <h2 className="text-lg font-semibold text-white mb-5">Recent Activity</h2>
                    <div className="space-y-4">
                        {activities.map((a, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                <div>
                                    <p className="text-zinc-300 text-sm">{a.text}</p>
                                    <p className="text-zinc-600 text-xs">{a.date} · {a.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <Card padding="lg">
                <h2 className="text-lg font-semibold text-white mb-6">Weekly Workout Activity</h2>
                <div className="flex items-end gap-2 h-40 min-h-[10rem]">
                    {dayLabels.map((day, i) => (
                        <div key={day} className="flex flex-col items-center gap-2 flex-1">
                            <div className={`w-full rounded-t-xl transition-all ${weekActivity[i] > 0 ? 'bg-gradient-to-t from-red-700 to-red-500' : 'bg-zinc-800'}`}
                                style={{ height: weekActivity[i] > 0 ? '80%' : '20%' }} />
                            <span className="text-zinc-500 text-xs">{day}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
