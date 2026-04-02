'use client';

import { useState } from 'react';
import { Download, TrendingUp, Users, Activity, Wrench, Dumbbell } from 'lucide-react';
import { PageHeader, Card, Input, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

const REPORT_TYPES = [
    { id: 'membership', label: 'Membership',    icon: Users,      desc: 'New registrations and subscriptions by plan' },
    { id: 'revenue',    label: 'Revenue',       icon: TrendingUp, desc: 'Payments by method and plan' },
    { id: 'attendance', label: 'Attendance',    icon: Activity,   desc: 'Daily visits and peak hours' },
    { id: 'trainer',    label: 'Trainers',      icon: Dumbbell,   desc: 'PT session stats per trainer' },
    { id: 'equipment',  label: 'Equipment',     icon: Wrench,     desc: 'Incidents by severity and equipment' },
];

function downloadJson(data: unknown, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function ManagerReportsPage() {
    const toast = useToast();
    const [selected, setSelected] = useState('membership');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);

    const generate = async () => {
        setLoading(true);
        setReportData(null);
        try {
            const data = await opsAPI.reportSummary({
                type: selected,
                fromDate: from || undefined,
                toDate: to || undefined,
            });
            setReportData(data);
            toast.success('Report Generated', 'Data loaded from live system');
        } catch (err) {
            toast.error('Failed to generate', getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!reportData) return;
        downloadJson(reportData, `report-${selected}-${from || 'all'}-to-${to || 'now'}.json`);
        toast.success('Download Started', 'Report JSON saved');
    };

    const label = REPORT_TYPES.find(r => r.id === selected)?.label ?? selected;

    return (
        <div className="space-y-8">
            <PageHeader
                title="Generate Reports"
                subtitle="Create operational and financial reports for PowerWorld Kiribathgoda"
            />

            <Card padding="lg">
                <h2 className="text-white font-semibold mb-5">Report Builder</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
                    {REPORT_TYPES.map(r => (
                        <div
                            key={r.id}
                            onClick={() => { setSelected(r.id); setReportData(null); }}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${selected === r.id ? 'border-red-500/60 bg-red-500/10' : 'border-zinc-800 hover:border-zinc-700'}`}
                        >
                            <r.icon size={16} className={selected === r.id ? 'text-red-400 mb-1' : 'text-zinc-500 mb-1'} />
                            <p className="text-white text-sm font-semibold">{r.label}</p>
                            <p className="text-zinc-500 text-xs mt-0.5">{r.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-4 mb-5">
                    <Input id="mgr-rpt-from" label="From Date" type="date" value={from} onChange={e => setFrom(e.target.value)} />
                    <Input id="mgr-rpt-to" label="To Date" type="date" value={to} onChange={e => setTo(e.target.value)} />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-stretch">
                    <LoadingButton onClick={generate} loading={loading} className="sm:flex-1">
                        Generate {label} Report
                    </LoadingButton>
                    {reportData && (
                        <LoadingButton variant="secondary" icon={Download} onClick={handleDownload}>
                            Download JSON
                        </LoadingButton>
                    )}
                </div>
            </Card>

            {reportData && (
                <div className="space-y-6">
                    {/* Overview KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Monthly Revenue', value: `Rs. ${Number(reportData.monthlyRevenue ?? 0).toLocaleString()}` },
                            { label: 'Active Members', value: reportData.activeMembers ?? '—' },
                            { label: 'Visits in Range', value: reportData.visitsInRange ?? '—' },
                            { label: 'Open Incidents', value: reportData.openEquipmentIncidents ?? '—' },
                        ].map(kpi => (
                            <Card key={kpi.label} padding="md">
                                <p className="text-zinc-400 text-xs">{kpi.label}</p>
                                <p className="text-white text-2xl font-bold mt-1">{kpi.value}</p>
                            </Card>
                        ))}
                    </div>

                    {reportData.type === 'revenue' && reportData.byMethod && (
                        <Card padding="lg">
                            <h3 className="text-white font-semibold mb-4">Revenue by Payment Method</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead><tr className="text-zinc-400 text-xs border-b border-zinc-700">
                                        <th className="text-left py-2">Method</th>
                                        <th className="text-right py-2">Transactions</th>
                                        <th className="text-right py-2">Total</th>
                                    </tr></thead>
                                    <tbody>{(reportData.byMethod ?? []).map((r: any, i: number) => (
                                        <tr key={i} className="border-b border-zinc-800/50">
                                            <td className="py-2 text-zinc-300 capitalize">{String(r.method).replace('_', ' ')}</td>
                                            <td className="py-2 text-right text-zinc-400">{r.count}</td>
                                            <td className="py-2 text-right text-white font-medium">Rs. {Number(r.total).toLocaleString()}</td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {reportData.type === 'membership' && (
                        <Card padding="lg">
                            <p className="text-zinc-400 text-sm mb-4">New members in range: <span className="text-white font-bold">{reportData.newMembers ?? 0}</span></p>
                            {reportData.byPlan && (
                                <>
                                    <h3 className="text-white font-semibold mb-3">Active Subscriptions by Plan</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead><tr className="text-zinc-400 text-xs border-b border-zinc-700">
                                                <th className="text-left py-2">Plan</th>
                                                <th className="text-right py-2">Active</th>
                                            </tr></thead>
                                            <tbody>{(reportData.byPlan ?? []).map((r: any, i: number) => (
                                                <tr key={i} className="border-b border-zinc-800/50">
                                                    <td className="py-2 text-zinc-300">{r.planName ?? 'Unknown'}</td>
                                                    <td className="py-2 text-right text-white font-medium">{r.count}</td>
                                                </tr>
                                            ))}</tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </Card>
                    )}

                    {reportData.type === 'attendance' && reportData.daily && (
                        <Card padding="lg">
                            <h3 className="text-white font-semibold mb-4">Daily Attendance</h3>
                            {reportData.byHour && (
                                <div className="flex items-end gap-1 h-20 mb-6">
                                    {Array.from({ length: 24 }, (_, h) => {
                                        const found = (reportData.byHour ?? []).find((r: any) => Number(r.hour) === h);
                                        const max = Math.max(...(reportData.byHour ?? []).map((r: any) => Number(r.count)), 1);
                                        const pct = found ? (Number(found.count) / max) * 100 : 0;
                                        return (
                                            <div key={h} className="flex-1 flex flex-col items-center gap-0.5">
                                                <div className="w-full bg-red-500/60 rounded-t" style={{ height: `${pct}%`, minHeight: pct > 0 ? 2 : 0 }} />
                                                {h % 6 === 0 && <span className="text-zinc-500 text-xs">{h}h</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <div className="max-h-48 overflow-y-auto overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead><tr className="text-zinc-400 text-xs border-b border-zinc-700">
                                        <th className="text-left py-2">Date</th>
                                        <th className="text-right py-2">Visits</th>
                                        <th className="text-right py-2">Avg Duration</th>
                                    </tr></thead>
                                    <tbody>{(reportData.daily ?? []).map((r: any, i: number) => (
                                        <tr key={i} className="border-b border-zinc-800/50">
                                            <td className="py-2 text-zinc-300">{r.date}</td>
                                            <td className="py-2 text-right text-white">{r.count}</td>
                                            <td className="py-2 text-right text-zinc-400">{r.avgDurationMin ? `${r.avgDurationMin} min` : '—'}</td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {reportData.type === 'trainer' && reportData.trainerStats && (
                        <Card padding="lg">
                            <h3 className="text-white font-semibold mb-4">Trainer Performance</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead><tr className="text-zinc-400 text-xs border-b border-zinc-700">
                                        <th className="text-left py-2">Trainer</th>
                                        <th className="text-right py-2">Total</th>
                                        <th className="text-right py-2">Completed</th>
                                        <th className="text-right py-2">Cancelled</th>
                                        <th className="text-right py-2">Rate</th>
                                    </tr></thead>
                                    <tbody>{(reportData.trainerStats ?? []).map((r: any, i: number) => {
                                        const pct = r.total > 0 ? Math.round((Number(r.completed) / Number(r.total)) * 100) : 0;
                                        return (
                                            <tr key={i} className="border-b border-zinc-800/50">
                                                <td className="py-2 text-zinc-300">{r.trainerName ?? 'Unknown'}</td>
                                                <td className="py-2 text-right text-white">{r.total}</td>
                                                <td className="py-2 text-right text-emerald-400">{r.completed}</td>
                                                <td className="py-2 text-right text-red-400">{r.cancelled}</td>
                                                <td className="py-2 text-right text-white font-medium">{pct}%</td>
                                            </tr>
                                        );
                                    })}</tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
