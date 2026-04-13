'use client';

import { useState } from 'react';
import { Download, TrendingUp, Users, Activity, Wrench, Dumbbell } from 'lucide-react';
import { PageHeader, Card, Input, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';
import { DirectReportTables, ReportMetaBar } from '@/components/reports/DirectReportTables';

const REPORT_TYPES = [
    { id: 'revenue',    label: 'Revenue',       icon: TrendingUp, desc: 'Payments by method and plan' },
    { id: 'membership', label: 'Membership',    icon: Users,      desc: 'New members, subscriptions by plan' },
    { id: 'attendance', label: 'Attendance',    icon: Activity,   desc: 'Daily visits, peak hours' },
    { id: 'equipment',  label: 'Equipment',     icon: Wrench,     desc: 'Incidents by severity and equipment' },
    { id: 'trainer',    label: 'Trainers',      icon: Dumbbell,   desc: 'PT session stats per trainer' },
];

export default function AdminReportsPage() {
    const toast = useToast();
    const [selected, setSelected] = useState('revenue');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);

    const run = async () => {
        setLoading(true);
        setReportData(null);
        try {
            const data = await opsAPI.reportSummary({
                type: selected,
                fromDate: from || undefined,
                toDate: to || undefined,
                recordRun: true,
            });
            setReportData(data);
            toast.success('Report Generated', 'Data loaded successfully');
        } catch (err) {
            toast.error('Failed to generate', getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!reportData) return;
        setPdfLoading(true);
        try {
            const blob = await opsAPI.downloadReportPdf({
                type: selected,
                fromDate: from || undefined,
                toDate: to || undefined,
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report-${selected}-${from || 'all'}-to-${to || 'now'}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Download Started', 'Report PDF saved');
        } catch (err) {
            toast.error('PDF download failed', getErrorMessage(err));
        } finally {
            setPdfLoading(false);
        }
    };

    const label = REPORT_TYPES.find(r => r.id === selected)?.label ?? selected;

    return (
        <div className="space-y-8">
            <PageHeader
                title="System Reports"
                subtitle="Generate comprehensive operational reports with live data"
            />

            <Card padding="lg">
                <h2 className="text-white font-semibold mb-5">Report Builder</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
                    {REPORT_TYPES.map(r => (
                        <div
                            key={r.id}
                            onClick={() => { setSelected(r.id); setReportData(null); }}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${selected === r.id
                                ? 'border-red-500/60 bg-red-500/10'
                                : 'border-zinc-800 hover:border-zinc-700'}`}
                        >
                            <r.icon size={16} className={selected === r.id ? 'text-red-400 mb-1' : 'text-zinc-500 mb-1'} />
                            <p className="text-white text-sm font-semibold">{r.label}</p>
                            <p className="text-zinc-500 text-xs mt-0.5">{r.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-4 mb-5">
                    <Input id="rpt-from" label="From Date" type="date" value={from} onChange={e => setFrom(e.target.value)} />
                    <Input id="rpt-to" label="To Date" type="date" value={to} onChange={e => setTo(e.target.value)} />
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-stretch">
                    <LoadingButton onClick={run} loading={loading} className="sm:flex-1">
                        Generate {label} Report
                    </LoadingButton>
                    {reportData && (
                        <LoadingButton loading={pdfLoading} variant="secondary" icon={Download} onClick={handleDownloadPdf}>
                            Download PDF
                        </LoadingButton>
                    )}
                </div>
            </Card>

            {reportData && <ReportResults data={reportData} />}
        </div>
    );
}

function ReportResults({ data }: { data: any }) {
    const type = data.type ?? 'overview';

    return (
        <div className="space-y-6">
            <ReportMetaBar data={data} />
            {/* Overview KPIs always shown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Monthly Revenue', value: `Rs. ${Number(data.monthlyRevenue ?? 0).toLocaleString()}` },
                    { label: 'Active Members', value: data.activeMembers ?? '—' },
                    { label: 'Visits in Range', value: data.visitsInRange ?? '—' },
                    { label: 'Open Incidents', value: data.openEquipmentIncidents ?? '—' },
                ].map(kpi => (
                    <Card key={kpi.label} padding="md">
                        <p className="text-zinc-400 text-xs">{kpi.label}</p>
                        <p className="text-white text-2xl font-bold mt-1">{kpi.value}</p>
                    </Card>
                ))}
            </div>

            {type === 'revenue' && (data.totalRevenueInRange != null || data.paymentCountInRange != null) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card padding="md">
                        <p className="text-zinc-400 text-xs">Total revenue (period)</p>
                        <p className="text-white text-xl font-bold mt-1">Rs. {Number(data.totalRevenueInRange ?? 0).toLocaleString()}</p>
                    </Card>
                    <Card padding="md">
                        <p className="text-zinc-400 text-xs">Payment count (period)</p>
                        <p className="text-white text-xl font-bold mt-1">{data.paymentCountInRange ?? '—'}</p>
                    </Card>
                    <Card padding="md">
                        <p className="text-zinc-400 text-xs">Average payment</p>
                        <p className="text-white text-xl font-bold mt-1">Rs. {Number(data.averagePaymentInRange ?? 0).toLocaleString()}</p>
                    </Card>
                </div>
            )}

            {type === 'revenue' && data.byMethod && (
                <Card padding="lg">
                    <h3 className="text-white font-semibold mb-4">Revenue by Payment Method</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="text-zinc-400 text-xs border-b border-zinc-700">
                                <th className="text-left py-2">Method</th>
                                <th className="text-right py-2">Transactions</th>
                                <th className="text-right py-2">Total</th>
                                <th className="text-right py-2">% of total</th>
                            </tr></thead>
                            <tbody>{(data.byMethod ?? []).map((r: any, i: number) => (
                                <tr key={i} className="border-b border-zinc-800/50">
                                    <td className="py-2 text-zinc-300 capitalize">{String(r.method).replace('_', ' ')}</td>
                                    <td className="py-2 text-right text-zinc-400">{r.count}</td>
                                    <td className="py-2 text-right text-white font-medium">Rs. {Number(r.total).toLocaleString()}</td>
                                    <td className="py-2 text-right text-zinc-400">{r.pctOfTotalRevenue != null ? `${Number(r.pctOfTotalRevenue).toFixed(1)}%` : '—'}</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                    {data.byPlan && (
                        <>
                            <h3 className="text-white font-semibold mt-6 mb-4">Revenue by Plan</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead><tr className="text-zinc-400 text-xs border-b border-zinc-700">
                                        <th className="text-left py-2">Plan</th>
                                        <th className="text-right py-2">Total</th>
                                    </tr></thead>
                                    <tbody>{(data.byPlan ?? []).map((r: any, i: number) => (
                                        <tr key={i} className="border-b border-zinc-800/50">
                                            <td className="py-2 text-zinc-300">{r.planName ?? 'Unknown'}</td>
                                            <td className="py-2 text-right text-white font-medium">Rs. {Number(r.total).toLocaleString()}</td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        </>
                    )}
                </Card>
            )}

            {type === 'membership' && (
                <Card padding="lg">
                    <h3 className="text-white font-semibold mb-4">Membership Summary</h3>
                    <p className="text-zinc-400 text-sm mb-4">
                        New members in range: <span className="text-white font-bold">{data.newMembers ?? 0}</span>
                        {data.subscriptionsCreatedInRange != null && (
                            <> · Subscriptions created in range: <span className="text-white font-bold">{data.subscriptionsCreatedInRange}</span></>
                        )}
                        {data.activeSubscriptionsTotal != null && (
                            <> · Active subscriptions (all plans): <span className="text-white font-bold">{data.activeSubscriptionsTotal}</span></>
                        )}
                    </p>
                    {data.byPlan && (
                        <>
                            <h4 className="text-zinc-300 font-medium mb-2">Active Subscriptions by Plan</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm mb-6">
                                    <thead><tr className="text-zinc-400 text-xs border-b border-zinc-700">
                                        <th className="text-left py-2">Plan</th>
                                        <th className="text-right py-2">Active</th>
                                    </tr></thead>
                                    <tbody>{(data.byPlan ?? []).map((r: any, i: number) => (
                                        <tr key={i} className="border-b border-zinc-800/50">
                                            <td className="py-2 text-zinc-300">{r.planName ?? 'Unknown'}</td>
                                            <td className="py-2 text-right text-white font-medium">{r.count}</td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        </>
                    )}
                    {data.byStatus && (
                        <>
                            <h4 className="text-zinc-300 font-medium mb-2">Subscription Status Breakdown</h4>
                            <div className="flex flex-wrap gap-3">
                                {(data.byStatus ?? []).map((r: any, i: number) => (
                                    <div key={i} className="bg-zinc-800/50 rounded-lg px-4 py-2 text-center">
                                        <p className="text-white font-bold">{r.count}</p>
                                        <p className="text-zinc-400 text-xs capitalize">{String(r.status).replace('_', ' ')}</p>
                                        {r.pctOfCreated != null && (
                                            <p className="text-zinc-500 text-xs">{Number(r.pctOfCreated).toFixed(1)}% of created</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </Card>
            )}

            {type === 'attendance' && (
                <Card padding="lg">
                    <h3 className="text-white font-semibold mb-4">Attendance Analysis</h3>
                    {data.avgVisitsPerDayInRange != null && (
                        <p className="text-zinc-400 text-sm mb-4">Average visits per day in range: <span className="text-white font-semibold">{data.avgVisitsPerDayInRange}</span></p>
                    )}
                    {data.byHour && (
                        <>
                            <h4 className="text-zinc-300 font-medium mb-3">Peak Hours</h4>
                            <div className="flex items-end gap-1 h-24 mb-6">
                                {Array.from({ length: 24 }, (_, h) => {
                                    const found = (data.byHour ?? []).find((r: any) => Number(r.hour) === h);
                                    const max = Math.max(...(data.byHour ?? []).map((r: any) => Number(r.count)), 1);
                                    const pct = found ? (Number(found.count) / max) * 100 : 0;
                                    return (
                                        <div key={h} className="flex-1 flex flex-col items-center gap-0.5">
                                            <div className="w-full bg-red-500/60 rounded-t" style={{ height: `${pct}%`, minHeight: pct > 0 ? 2 : 0 }} />
                                            {h % 6 === 0 && <span className="text-zinc-500 text-xs">{h}h</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                    {data.daily && (
                        <>
                            <h4 className="text-zinc-300 font-medium mb-2">Daily Visits</h4>
                            <div className="max-h-60 overflow-y-auto overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead><tr className="text-zinc-400 text-xs border-b border-zinc-700">
                                        <th className="text-left py-2">Date</th>
                                        <th className="text-right py-2">Visits</th>
                                        <th className="text-right py-2">Avg Duration</th>
                                    </tr></thead>
                                    <tbody>{(data.daily ?? []).map((r: any, i: number) => (
                                        <tr key={i} className="border-b border-zinc-800/50">
                                            <td className="py-2 text-zinc-300">{r.date}</td>
                                            <td className="py-2 text-right text-white">{r.count}</td>
                                            <td className="py-2 text-right text-zinc-400">{r.avgDurationMin ? `${r.avgDurationMin} min` : '—'}</td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        </>
                    )}
                </Card>
            )}

            {type === 'equipment' && (
                <Card padding="lg">
                    <h3 className="text-white font-semibold mb-4">Equipment Incident Analysis</h3>
                    {data.incidentsInRange != null && (
                        <p className="text-zinc-400 text-sm mb-4">Incidents in range (rows): <span className="text-white font-semibold">{data.incidentsInRange}</span></p>
                    )}
                    {data.bySeverity && (
                        <>
                            <h4 className="text-zinc-300 font-medium mb-2">By Severity & Status</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm mb-6">
                                    <thead><tr className="text-zinc-400 text-xs border-b border-zinc-700">
                                        <th className="text-left py-2">Severity</th>
                                        <th className="text-left py-2">Status</th>
                                        <th className="text-right py-2">Count</th>
                                    </tr></thead>
                                    <tbody>{(data.bySeverity ?? []).map((r: any, i: number) => (
                                        <tr key={i} className="border-b border-zinc-800/50">
                                            <td className="py-2 text-zinc-300 capitalize">{r.severity ?? '—'}</td>
                                            <td className="py-2 text-zinc-400 capitalize">{r.status ?? '—'}</td>
                                            <td className="py-2 text-right text-white font-medium">{r.count}</td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        </>
                    )}
                    {data.byEquipment && (
                        <>
                            <h4 className="text-zinc-300 font-medium mb-2">Most Reported Equipment</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead><tr className="text-zinc-400 text-xs border-b border-zinc-700">
                                        <th className="text-left py-2">Equipment</th>
                                        <th className="text-right py-2">Incidents</th>
                                    </tr></thead>
                                    <tbody>{(data.byEquipment ?? []).map((r: any, i: number) => (
                                        <tr key={i} className="border-b border-zinc-800/50">
                                            <td className="py-2 text-zinc-300">{r.equipmentName ?? 'Unknown'}</td>
                                            <td className="py-2 text-right text-white font-medium">{r.count}</td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        </>
                    )}
                </Card>
            )}

            {type === 'trainer' && data.trainerStats && (
                <Card padding="lg">
                    <h3 className="text-white font-semibold mb-4">Trainer Performance</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="text-zinc-400 text-xs border-b border-zinc-700">
                                <th className="text-left py-2">Trainer</th>
                                <th className="text-right py-2">Total Sessions</th>
                                <th className="text-right py-2">Completed</th>
                                <th className="text-right py-2">Cancelled</th>
                                <th className="text-right py-2">Completion %</th>
                            </tr></thead>
                            <tbody>{(data.trainerStats ?? []).map((r: any, i: number) => {
                                const pct =
                                    r.completionRatePct != null
                                        ? Number(r.completionRatePct).toFixed(1)
                                        : r.total > 0
                                          ? String(Math.round((Number(r.completed) / Number(r.total)) * 100))
                                          : '0';
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

            <DirectReportTables data={data} />
        </div>
    );
}
