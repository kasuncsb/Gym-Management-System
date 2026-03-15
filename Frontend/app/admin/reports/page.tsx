'use client';

import { useState } from 'react';
import { TrendingUp, Download, CheckCircle } from 'lucide-react';
import { PageHeader, Card, Input, Select, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';

const reportTypes = [
    { id: 'financial',   label: 'Financial Summary',   desc: 'Revenue, expenses, outstanding payments' },
    { id: 'membership',  label: 'Membership Report',   desc: 'New, renewed, and cancelled memberships' },
    { id: 'operations',  label: 'Operations Report',   desc: 'Check-ins, occupancy, trainer sessions' },
    { id: 'security',    label: 'Security Audit',      desc: 'Login attempts, access logs, anomalies' },
    { id: 'maintenance', label: 'Maintenance Log',     desc: 'Equipment repairs, downtime history' },
    { id: 'payroll',     label: 'Payroll Summary',     desc: 'Staff hours, salaries, overtime' },
];

const recent = [
    { name: 'Financial Summary — January 2025',  generated: '2025-01-15', size: '890 KB', format: 'PDF' },
    { name: 'Security Audit — Q4 2024',          generated: '2025-01-05', size: '134 KB', format: 'CSV' },
    { name: 'Operations Report — December 2024', generated: '2025-01-03', size: '445 KB', format: 'PDF' },
    { name: 'Membership Report — 2024 Annual',   generated: '2024-12-31', size: '1.2 MB', format: 'PDF' },
];

const FORMAT_OPTIONS = [
    { value: 'PDF', label: 'PDF' },
    { value: 'CSV', label: 'CSV' },
    { value: 'Excel', label: 'Excel' },
];

export default function AdminReportsPage() {
    const toast = useToast();
    const [selected, setSelected] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [fmt, setFmt] = useState<'PDF' | 'CSV' | 'Excel'>('PDF');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const run = () => {
        if (!selected) {
            toast.error('Select Report', 'Please select a report type first');
            return;
        }
        setLoading(true);
        setDone(false);
        setTimeout(() => {
            setLoading(false);
            setDone(true);
            toast.success('Report Generated', 'Your report is ready for download');
        }, 1800);
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="System Reports"
                subtitle="Generate comprehensive operational reports"
            />

            <Card padding="lg">
                <h2 className="text-white font-semibold mb-5">Report Builder</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                    {reportTypes.map(r => (
                        <div
                            key={r.id}
                            onClick={() => { setSelected(r.id); setDone(false); }}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${selected === r.id
                                ? 'border-red-500/60 bg-red-500/10'
                                : 'border-zinc-800 hover:border-zinc-700'}`}
                        >
                            <p className="text-white text-sm font-semibold">{r.label}</p>
                            <p className="text-zinc-500 text-xs mt-0.5">{r.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    <Input id="admin-reports-from" label="From" type="date" value={from} onChange={e => setFrom(e.target.value)} />
                    <Input id="admin-reports-to" label="To" type="date" value={to} onChange={e => setTo(e.target.value)} />
                    <Select id="admin-reports-format" label="Format" options={FORMAT_OPTIONS} value={fmt} onChange={e => setFmt(e.target.value as 'PDF' | 'CSV' | 'Excel')} />
                </div>
                <LoadingButton
                    onClick={run}
                    disabled={!selected || loading}
                    loading={loading}
                    className="w-full"
                >
                    {done ? <span className="flex items-center justify-center gap-2"><CheckCircle size={18} /> Report Ready — Download</span> : 'Generate Report'}
                </LoadingButton>
            </Card>

            <Card padding="lg">
                <h2 className="text-white font-semibold mb-4">Recent Reports</h2>
                <div className="space-y-3">
                    {recent.map((r, i) => (
                        <div key={i} className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-4 hover:bg-zinc-800/50 transition-colors">
                            <div>
                                <p className="text-white text-sm font-semibold">{r.name}</p>
                                <p className="text-zinc-500 text-xs">{r.generated} · {r.size} · {r.format}</p>
                            </div>
                            <button
                                onClick={() => toast.success('Download Started', r.name)}
                                className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs font-semibold transition-colors"
                            >
                                <Download size={14} /> Download
                            </button>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
