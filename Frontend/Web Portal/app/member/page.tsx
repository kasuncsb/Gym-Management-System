"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";
import { subscriptionAPI, qrAPI, workoutAPI, trainerAPI, getErrorMessage } from "@/lib/api";
import {
    Activity,
    CalendarDays,
    CreditCard,
    Dumbbell,
    QrCode,
    TrendingUp,
    Loader2,
    Clock,
    UserCheck,
    ChevronRight,
    Sparkles
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { SkeletonStatCard } from "@/components/ui/Skeleton";
import { ErrorAlert, Card } from "@/components/ui/SharedComponents";

interface DashboardData {
    subscription: any;
    recentVisits: any[];
    workoutPlans: any[];
    upcomingSessions: any[];
}

export default function MemberDashboard() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<DashboardData>({
        subscription: null,
        recentVisits: [],
        workoutPlans: [],
        upcomingSessions: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isLoading) {
            if (!user) { router.push('/login'); return; }
            if (user.role === 'admin') { router.push('/admin-dashboard'); return; }
            if (user.role !== 'member') { router.push('/staff-dashboard'); return; }
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!user || user.role !== 'member') return;
        async function fetchDashboard() {
            setLoading(true);
            try {
                const [subRes, visitsRes, plansRes, sessionsRes] = await Promise.allSettled([
                    subscriptionAPI.getActive(),
                    qrAPI.getAttendanceHistory(7),
                    workoutAPI.getMyPlans(),
                    trainerAPI.getMySessions(),
                ]);

                setData({
                    subscription: subRes.status === 'fulfilled' ? subRes.value.data.data : null,
                    recentVisits: visitsRes.status === 'fulfilled' ? (visitsRes.value.data.data || []) : [],
                    workoutPlans: plansRes.status === 'fulfilled' ? (plansRes.value.data.data || []) : [],
                    upcomingSessions: sessionsRes.status === 'fulfilled'
                        ? (sessionsRes.value.data.data || []).filter((s: any) => ['booked', 'confirmed'].includes(s.status)).slice(0, 3)
                        : [],
                });
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
            }
        }
        fetchDashboard();
    }, [user]);

    if (isLoading || !user) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="animate-spin text-red-600" size={40} />
            </div>
        );
    }

    const activePlan = data.subscription;
    const visitsThisWeek = data.recentVisits.length;
    const activePlansCount = data.workoutPlans.filter((p: any) => p.isActive).length;
    const nextSession = data.upcomingSessions[0];

    const formatDate = (d: string) => {
        if (!d) return '';
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-8 page-enter">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white">Dashboard</h2>
                <p className="text-zinc-400 mt-1">
                    Welcome back, <span className="text-red-500 font-medium">{user?.fullName || 'Member'}</span>!
                    Ready to crush your goals?
                </p>
            </div>

            {error && <ErrorAlert message={error} onRetry={() => window.location.reload()} />}

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-in">
                <Link
                    href="/member/qr-code"
                    className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800/70 hover:border-zinc-700 transition-all duration-200 group flex flex-col items-center justify-center gap-3 text-center"
                >
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <QrCode className="text-red-500" size={20} />
                    </div>
                    <div>
                        <span className="block font-semibold text-white text-sm">Access Pass</span>
                        <span className="text-xs text-zinc-500">QR for entry</span>
                    </div>
                </Link>

                <Link
                    href="/member/workouts"
                    className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800/70 hover:border-zinc-700 transition-all duration-200 group flex flex-col items-center justify-center gap-3 text-center"
                >
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <Dumbbell className="text-blue-500" size={20} />
                    </div>
                    <div>
                        <span className="block font-semibold text-white text-sm">Workouts</span>
                        <span className="text-xs text-zinc-500">View plans</span>
                    </div>
                </Link>

                <Link
                    href="/member/trainers"
                    className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800/70 hover:border-zinc-700 transition-all duration-200 group flex flex-col items-center justify-center gap-3 text-center"
                >
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <UserCheck className="text-green-500" size={20} />
                    </div>
                    <div>
                        <span className="block font-semibold text-white text-sm">Trainers</span>
                        <span className="text-xs text-zinc-500">Book sessions</span>
                    </div>
                </Link>

                <Link
                    href="/member/subscription"
                    className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800/70 hover:border-zinc-700 transition-all duration-200 group flex flex-col items-center justify-center gap-3 text-center"
                >
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <CreditCard className="text-purple-500" size={20} />
                    </div>
                    <div>
                        <span className="block font-semibold text-white text-sm">Subscription</span>
                        <span className="text-xs text-zinc-500">Manage plan</span>
                    </div>
                </Link>
            </div>

            {/* Stats Overview */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-in">
                    <StatCard
                        title="Visits This Week"
                        value={visitsThisWeek.toString()}
                        trend={visitsThisWeek > 0 ? "Keep it up!" : "Time to visit!"}
                        trendUp={visitsThisWeek > 0}
                        icon={Activity}
                        color="red"
                    />
                    <StatCard
                        title="Active Plans"
                        value={activePlansCount.toString()}
                        trend={activePlansCount > 0 ? "On track" : "Get a plan"}
                        trendUp={activePlansCount > 0}
                        icon={Dumbbell}
                        color="blue"
                    />
                    <StatCard
                        title="Subscription"
                        value={activePlan ? activePlan.planName || 'Active' : 'None'}
                        trend={activePlan
                            ? `Expires ${formatDate(activePlan.endDate)}`
                            : "Subscribe now"}
                        trendUp={!!activePlan}
                        icon={CreditCard}
                        color="green"
                    />
                    <StatCard
                        title="Next Session"
                        value={nextSession ? formatDate(nextSession.sessionDate).split(',')[0] : 'None'}
                        trend={nextSession ? `with ${nextSession.trainerName || 'Trainer'}` : "Book a trainer"}
                        trendUp={!!nextSession}
                        icon={CalendarDays}
                        color="purple"
                    />
                </div>
            )}

            {/* Content Grid: Recent Visits + Upcoming Sessions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Visits */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Recent Visits</h3>
                        <Link href="/member/qr-code" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                            View all <ChevronRight size={14} />
                        </Link>
                    </div>
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-12 bg-zinc-800/50 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : data.recentVisits.length > 0 ? (
                        <div className="space-y-2">
                            {data.recentVisits.slice(0, 5).map((visit: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl hover:bg-zinc-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                            <Clock className="text-emerald-400" size={14} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-200">
                                                {new Date(visit.checkInAt || visit.checkInTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                {new Date(visit.checkInAt || visit.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                {visit.durationMinutes ? ` \u2022 ${visit.durationMinutes} min` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    {visit.durationMinutes && (
                                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                                            {visit.durationMinutes}m
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Clock className="mx-auto text-zinc-600 mb-2" size={24} />
                            <p className="text-sm text-zinc-500">No recent visits</p>
                            <p className="text-xs text-zinc-600 mt-1">Scan your QR code at the gym entrance</p>
                        </div>
                    )}
                </Card>

                {/* Upcoming Sessions */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Upcoming Sessions</h3>
                        <Link href="/member/schedule" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                            View all <ChevronRight size={14} />
                        </Link>
                    </div>
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-12 bg-zinc-800/50 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : data.upcomingSessions.length > 0 ? (
                        <div className="space-y-2">
                            {data.upcomingSessions.map((session: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl hover:bg-zinc-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                            <UserCheck className="text-purple-400" size={14} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-200">
                                                {session.trainerName || 'Training Session'}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                {formatDate(session.sessionDate)}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        session.status === 'confirmed'
                                            ? 'bg-emerald-500/10 text-emerald-400'
                                            : 'bg-amber-500/10 text-amber-400'
                                    }`}>
                                        {session.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <CalendarDays className="mx-auto text-zinc-600 mb-2" size={24} />
                            <p className="text-sm text-zinc-500">No upcoming sessions</p>
                            <Link href="/member/trainers" className="text-xs text-red-400 hover:text-red-300 mt-1 inline-block">
                                Book a trainer session
                            </Link>
                        </div>
                    )}
                </Card>
            </div>

            {/* AI Workout Promo Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8">
                <div className="relative z-10 max-w-xl">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="text-amber-400" size={18} />
                        <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">AI-Powered</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Get a Personalized Workout Plan</h3>
                    <p className="text-zinc-400 mb-6">
                        Our AI generates customized workout plans based on your fitness goals, experience level, and vitals.
                    </p>
                    <Link
                        href="/member/workouts"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-red-700 text-white font-semibold rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-900/20 hover:shadow-red-900/40"
                    >
                        <Dumbbell size={18} />
                        Generate Workout Plan
                    </Link>
                </div>
                <div className="absolute top-0 right-0 h-full w-1/3 bg-linear-to-l from-red-900/20 to-transparent pointer-events-none" />
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
            </div>
        </div>
    );
}
