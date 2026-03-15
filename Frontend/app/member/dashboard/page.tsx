'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Dumbbell, Calendar, TrendingUp, QrCode, Clock, Flame, Award, Activity } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/SharedComponents';

export default function MemberDashboard() {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const greeting = currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening';
    const firstName = user?.fullName?.split(' ')[0] ?? 'Member';

    const stats = [
        { label: 'This Week',  value: '4 / 7', sub: 'workouts', icon: Dumbbell, color: 'from-red-600 to-red-700' },
        { label: 'Streak',     value: '12',    sub: 'days',     icon: Flame,    color: 'from-orange-500 to-orange-600' },
        { label: 'This Month', value: '18',    sub: 'sessions', icon: Activity, color: 'from-blue-600 to-blue-700' },
        { label: 'Hours',      value: '24.5',  sub: 'logged',   icon: Clock,    color: 'from-purple-600 to-purple-700' },
    ];

    const quickActions = [
        { label: 'Check In',      href: '/member/checkin',      icon: QrCode     },
        { label: 'Book Session',  href: '/member/appointments', icon: Calendar   },
        { label: 'View Progress', href: '/member/progress',     icon: TrendingUp },
        { label: 'Workouts',      href: '/member/workouts',     icon: Dumbbell   },
    ];

    const appointments = [
        { trainer: 'Chathurika Silva', date: '2025-01-18', time: '10:00 AM', type: 'Personal Training' },
        { trainer: 'Isuru Bandara',    date: '2025-01-20', time: '2:00 PM',  type: 'Nutrition Consultation' },
    ];

    const activities = [
        { text: 'Check-in',                       time: '08:30 AM', date: 'Today' },
        { text: 'Workout Completed — Upper Body',  time: '09:45 AM', date: 'Today' },
        { text: 'Check-out',                       time: '11:15 AM', date: 'Today' },
    ];

    const weekActivity = [1, 0, 1, 1, 0, 1, 0];
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
                        <p className="text-white font-semibold text-sm">Premium Plan — Active</p>
                        <p className="text-zinc-500 text-xs">Member ID: PW2025001 · Next payment: 2025-02-15</p>
                    </div>
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-semibold">Active</span>
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
