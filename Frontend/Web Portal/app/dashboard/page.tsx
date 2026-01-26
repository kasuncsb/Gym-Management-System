import { Users, CreditCard, Activity, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { ActivityChart } from "@/components/ui/ActivityChart";

export default function DashboardPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Dashboard</h2>
                    <p className="text-zinc-400 mt-1">Welcome back, Admin</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg hover:bg-zinc-800 transition">
                        Download Report
                    </button>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition">
                        Add Member
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Members"
                    value="1,240"
                    trend="12% from last month"
                    trendUp={true}
                    icon={Users}
                    color="blue"
                />
                <StatCard
                    title="Active Now"
                    value="86"
                    trend="5% from last hour"
                    trendUp={true}
                    icon={Activity}
                    color="green"
                />
                <StatCard
                    title="Monthly Revenue"
                    value="$42,500"
                    trend="8% from last month"
                    trendUp={true}
                    icon={CreditCard}
                    color="purple"
                />
                <StatCard
                    title="Conversion Rate"
                    value="24%"
                    trend="2% from last month"
                    trendUp={false}
                    icon={TrendingUp}
                    color="orange"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <ActivityChart />
                </div>

                {/* Recent Activity / Side Widget */}
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Signups</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-4 p-3 hover:bg-zinc-800 rounded-xl transition cursor-pointer group">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-300">
                                    {["JD", "AS", "MK", "PL", "RT"][i - 1]}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-white">{["John Doe", "Alex Smith", "Mike K.", "Sarah L.", "Rob T."][i - 1]}</h4>
                                    <p className="text-xs text-zinc-400">Premium Plan</p>
                                </div>
                                <span className="text-xs text-zinc-500">2m ago</span>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-6 py-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition">
                        View All Members
                    </button>
                </div>
            </div>
        </div>
    );
}
