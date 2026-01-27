import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";
import {
    Activity,
    CalendarDays,
    CreditCard,
    Dumbbell,
    QrCode,
    Settings,
    User as UserIcon,
    TrendingUp,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";

export default function DashboardPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="animate-spin text-red-600" size={40} />
            </div>
        );
    }

    // For now, we'll use placeholder data for the member stats since the API service was 
    // focused on admin stats. In a real scenario, we'd fetch member-specific stats here.
    const memberStats = {
        workoutsThisWeek: 3,
        minutesActive: 145,
        streak: 5,
        nextClass: "HIIT Session - Tomorrow 10:00 AM"
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white">Dashboard</h2>
                <p className="text-zinc-400 mt-1">
                    Welcome back, <span className="text-red-500 font-medium">{user?.name || 'Member'}</span>!
                    Ready to crush your goals?
                </p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/member/qr-code" className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition group flex flex-col items-center justify-center gap-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <QrCode className="text-red-500" size={20} />
                    </div>
                    <div>
                        <span className="block font-semibold text-white">My QR Code</span>
                        <span className="text-xs text-zinc-500">For entry access</span>
                    </div>
                </Link>

                <Link href="/member/workouts" className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition group flex flex-col items-center justify-center gap-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Dumbbell className="text-blue-500" size={20} />
                    </div>
                    <div>
                        <span className="block font-semibold text-white">Workouts</span>
                        <span className="text-xs text-zinc-500">Log activity</span>
                    </div>
                </Link>

                <Link href="/member/classes" className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition group flex flex-col items-center justify-center gap-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CalendarDays className="text-green-500" size={20} />
                    </div>
                    <div>
                        <span className="block font-semibold text-white">Classes</span>
                        <span className="text-xs text-zinc-500">Book sessions</span>
                    </div>
                </Link>

                <Link href="/member/subscription" className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition group flex flex-col items-center justify-center gap-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CreditCard className="text-purple-500" size={20} />
                    </div>
                    <div>
                        <span className="block font-semibold text-white">Subscription</span>
                        <span className="text-xs text-zinc-500">Manage plan</span>
                    </div>
                </Link>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Workouts This Week"
                    value={memberStats.workoutsThisWeek.toString()}
                    trend="Keep it up!"
                    trendUp={true}
                    icon={Dumbbell}
                    color="red"
                />
                <StatCard
                    title="Active Minutes"
                    value={memberStats.minutesActive.toString()}
                    trend="High intensity"
                    trendUp={true}
                    icon={Activity}
                    color="blue"
                />
                <StatCard
                    title="Streak"
                    value={`${memberStats.streak} Days`}
                    trend="Consistent"
                    trendUp={true}
                    icon={TrendingUp}
                    color="green"
                />
                <StatCard
                    title="Next Class"
                    value={memberStats.nextClass.split(' - ')[0]}
                    trend={memberStats.nextClass.split(' - ')[1]}
                    trendUp={true}
                    icon={CalendarDays}
                    color="purple"
                />
            </div>

            {/* Promo / Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8">
                <div className="relative z-10 max-w-xl">
                    <h3 className="text-2xl font-bold text-white mb-2">Upgrade to Pro Trainer</h3>
                    <p className="text-zinc-400 mb-6">
                        Get personalized workout plans and 1-on-1 coaching sessions with our elite trainers.
                    </p>
                    <button className="px-6 py-3 bg-red-700 text-white font-semibold rounded-xl hover:bg-red-600 transition shadow-lg shadow-red-900/20">
                        Explore Trainers
                    </button>
                </div>

                {/* Decorative BG */}
                <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-red-900/20 to-transparent pointer-events-none" />
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
            </div>
        </div>
    );
}
