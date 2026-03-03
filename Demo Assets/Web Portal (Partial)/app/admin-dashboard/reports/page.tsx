"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, TrendingDown, Users, DollarSign, Calendar, Download, Clock, CreditCard } from "lucide-react";
import { reportingAPI, getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader, Card, ErrorAlert, Tabs } from "@/components/ui/SharedComponents";

interface RevenueSummary { total: number; byMethod: { method: string; total: number }[]; daily: { date: string; revenue: number }[]; previousMonthTotal: number; growthPercent: number }
interface RetentionData { totalExpired: number; renewed: number; churned: number; retentionRate: number }
interface AttendanceData { totalVisits: number; avgDailyVisits: number; peakHour: number; daily: { day: string; visits: number }[] }

export default function ReportsPage() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
    const [retention, setRetention] = useState<RetentionData | null>(null);
    const [attendance, setAttendance] = useState<AttendanceData | null>(null);
    const [planPopularity, setPlanPopularity] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("revenue");
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);

    const fetchAll = async () => {
        setLoading(true);
        setError("");
        try {
            const [revRes, retRes, attRes, planRes] = await Promise.all([
                reportingAPI.revenue(year, month),
                reportingAPI.retention(),
                reportingAPI.attendance(year, month),
                reportingAPI.planPopularity(),
            ]);
            setRevenue(revRes.data.data);
            setRetention(retRes.data.data);
            setAttendance(attRes.data.data);
            setPlanPopularity(planRes.data.data || []);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, [year, month]);

    const handleExportCSV = async () => {
        try {
            // Build CSV from current tab data
            let csvContent = "";
            if (activeTab === "revenue" && revenue) {
                csvContent = "Date,Revenue\n" + (revenue.daily || []).map(d => `${d.date},${d.revenue}`).join("\n");
            } else if (activeTab === "retention" && retention) {
                csvContent = `Metric,Value\nRetention Rate,${retention.retentionRate}%\nTotal Expired,${retention.totalExpired}\nRenewed,${retention.renewed}\nChurned,${retention.churned}`;
            } else if (activeTab === "attendance" && attendance) {
                csvContent = "Date,Visits\n" + (attendance.daily || []).map(d => `${d.day},${d.visits}`).join("\n");
            } else if (activeTab === "plans") {
                csvContent = "Plan,Active,Total,Revenue\n" + planPopularity.map((p: any) => `${p.planName || p.plan_name},${p.activeCount ?? p.active_count},${p.totalCount ?? p.total_count},${p.totalRevenue ?? p.total_revenue ?? 0}`).join("\n");
            }
            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${activeTab}-report-${year}-${String(month).padStart(2, "0")}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Export complete", "CSV file has been downloaded.");
        } catch {
            toast.error("Export failed", "Could not generate CSV file.");
        }
    };

    const formatCurrency = (n: number) => `Rs. ${new Intl.NumberFormat("en-LK").format(n)}`;
    const monthName = new Date(year, month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const tabs = [
        { key: "revenue", label: "Revenue" },
        { key: "retention", label: "Retention" },
        { key: "attendance", label: "Attendance" },
        { key: "plans", label: "Plan Popularity" },
    ];

    if (loading) {
        return (
            <div className="space-y-8 page-enter">
                <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64" /></div>
                <Skeleton className="h-12 w-full rounded-xl" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
                <Skeleton className="h-48 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-8 page-enter">
            <PageHeader title="Business Reports" subtitle={`${monthName} — Performance Analysis`}>
                <div className="flex items-center gap-2">
                    <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
                        {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(now.getFullYear(), i).toLocaleDateString("en-US", { month: "long" })}</option>)}
                    </select>
                    <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
                        {[now.getFullYear(), now.getFullYear() - 1].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition text-sm font-medium"><Download size={14} /> Export</button>
                </div>
            </PageHeader>

            {error && <ErrorAlert message={error} onRetry={fetchAll} />}

            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            {/* Revenue */}
            {activeTab === "revenue" && revenue && (
                <div className="space-y-6 stagger-in">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card padding="none" className="p-5">
                            <div className="text-sm text-zinc-400 mb-1">Total Revenue</div>
                            <div className="text-3xl font-bold text-white">{formatCurrency(revenue.total)}</div>
                            <div className={`flex items-center text-sm mt-2 ${revenue.growthPercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {revenue.growthPercent >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                                {revenue.growthPercent >= 0 ? "+" : ""}{revenue.growthPercent.toFixed(1)}% vs last month
                            </div>
                        </Card>
                        <Card padding="none" className="p-5">
                            <div className="text-sm text-zinc-400 mb-1">Previous Month</div>
                            <div className="text-3xl font-bold text-zinc-300">{formatCurrency(revenue.previousMonthTotal)}</div>
                        </Card>
                        <Card padding="none" className="p-5">
                            <div className="text-sm text-zinc-400 mb-1">Payment Methods</div>
                            <div className="space-y-1 mt-2">
                                {revenue.byMethod.map(m => (
                                    <div key={m.method} className="flex justify-between text-sm">
                                        <span className="text-zinc-400 capitalize">{m.method}</span>
                                        <span className="text-white font-mono">Rs. {Number(m.total).toLocaleString("en-LK")}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                    <Card padding="none" className="p-5">
                        <h3 className="text-sm font-medium text-zinc-400 mb-4">Daily Revenue</h3>
                        <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
                            {revenue.daily.map(d => {
                                const maxVal = Math.max(...revenue.daily.map(x => Number(x.revenue)), 1);
                                const pct = (Number(d.revenue) / maxVal) * 100;
                                return (
                                    <div key={d.date} className="flex flex-col items-center min-w-4.5 flex-1" title={`${d.date}: Rs. ${Number(d.revenue).toLocaleString("en-LK")}`}>
                                        <div className="w-full bg-red-600/80 rounded-t transition-all" style={{ height: `${Math.max(pct, 2)}%` }} />
                                        <span className="text-[9px] text-zinc-500 mt-1 -rotate-45 origin-top-left whitespace-nowrap">{new Date(d.date).getDate()}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            )}

            {/* Retention */}
            {activeTab === "retention" && retention && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-in">
                    <Card padding="none" className="p-5"><div className="text-sm text-zinc-400 mb-1">Retention Rate</div><div className="text-3xl font-bold text-green-400">{retention.retentionRate.toFixed(1)}%</div></Card>
                    <Card padding="none" className="p-5"><div className="text-sm text-zinc-400 mb-1">Total Expired</div><div className="text-3xl font-bold text-white">{retention.totalExpired}</div></Card>
                    <Card padding="none" className="p-5"><div className="text-sm text-zinc-400 mb-1">Renewed</div><div className="text-3xl font-bold text-blue-400">{retention.renewed}</div></Card>
                    <Card padding="none" className="p-5"><div className="text-sm text-zinc-400 mb-1">Churned</div><div className="text-3xl font-bold text-red-400">{retention.churned}</div></Card>
                </div>
            )}

            {/* Attendance */}
            {activeTab === "attendance" && attendance && (
                <div className="space-y-6 stagger-in">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card padding="none" className="p-5"><div className="text-sm text-zinc-400 mb-1">Total Visits</div><div className="text-3xl font-bold text-white">{attendance.totalVisits}</div></Card>
                        <Card padding="none" className="p-5"><div className="text-sm text-zinc-400 mb-1">Avg. Daily Visits</div><div className="text-3xl font-bold text-white">{attendance.avgDailyVisits}</div></Card>
                        <Card padding="none" className="p-5"><div className="flex items-center gap-2 text-sm text-zinc-400 mb-1"><Clock size={14} /> Peak Hour</div><div className="text-3xl font-bold text-white">{attendance.peakHour}:00</div></Card>
                    </div>
                    <Card padding="none" className="p-5">
                        <h3 className="text-sm font-medium text-zinc-400 mb-4">Daily Visit Trend</h3>
                        <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
                            {attendance.daily.map(d => {
                                const maxVal = Math.max(...attendance.daily.map(x => Number(x.visits)), 1);
                                const pct = (Number(d.visits) / maxVal) * 100;
                                return (
                                    <div key={d.day} className="flex flex-col items-center min-w-4.5 flex-1" title={`${d.day}: ${d.visits} visits`}>
                                        <div className="w-full bg-blue-600/80 rounded-t transition-all" style={{ height: `${Math.max(pct, 2)}%` }} />
                                        <span className="text-[9px] text-zinc-500 mt-1 -rotate-45 origin-top-left whitespace-nowrap">{new Date(d.day).getDate()}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            )}

            {/* Plan Popularity */}
            {activeTab === "plans" && (
                <Card padding="none" className="overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-zinc-900/50 text-zinc-400 text-xs uppercase">
                            <tr><th className="px-6 py-3 text-left">Plan</th><th className="px-6 py-3 text-right">Active</th><th className="px-6 py-3 text-right">Total</th><th className="px-6 py-3 text-right">Revenue</th></tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {planPopularity.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-500">No plan data available</td></tr>
                            ) : planPopularity.map((p: any, i: number) => (
                                <tr key={i} className="hover:bg-zinc-900/30 transition">
                                    <td className="px-6 py-4 font-medium text-white">{p.planName || p.plan_name}</td>
                                    <td className="px-6 py-4 text-right text-green-400 font-mono">{p.activeCount ?? p.active_count}</td>
                                    <td className="px-6 py-4 text-right text-zinc-400 font-mono">{p.totalCount ?? p.total_count}</td>
                                    <td className="px-6 py-4 text-right text-zinc-400">Rs. {new Intl.NumberFormat("en-LK").format(Number(p.totalRevenue ?? p.total_revenue ?? 0))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
}
