'use client';

import { useState } from 'react';
import { TrendingUp, Download, CheckCircle } from 'lucide-react';
import { PageHeader, Card, Input, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';

const reportTypes = [
    { id: 'membership', label: 'Membership Report',  desc: 'New registrations, renewals, cancellations' },
    { id: 'revenue',    label: 'Revenue Report',     desc: 'Income by plan, payments, outstanding fees' },
    { id: 'attendance', label: 'Attendance Report',  desc: 'Daily/weekly check-ins, peak hours, occupancy' },
    { id: 'trainer',    label: 'Trainer Performance',desc: 'Sessions conducted, member ratings, feedback' },
];

const recentReports = [
    { name: 'Membership Report — January 2025',  generated: '2025-01-15', size: '245 KB' },
    { name: 'Revenue Report — Q4 2024',          generated: '2025-01-02', size: '512 KB' },
    { name: 'Attendance Report — December 2024', generated: '2025-01-05', size: '189 KB' },
];

export default function ManagerReportsPage() {
    const toast = useToast();
    const [selected, setSelected] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const generate = () => {
        if (!selected) {
            toast.error('Select Report', 'Please select a report type first');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setSuccess(true);
            toast.success('Report Generated', 'Your report is ready for download');
        }, 1500);
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="Generate Reports"
                subtitle="Create operational and financial reports for PowerWorld Kiribathgoda"
            />

            <Card padding="lg">
                <h2 className="text-white font-semibold mb-5">Report Builder</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                    {reportTypes.map(r => (
                        <div
                            key={r.id}
                            onClick={() => { setSelected(r.id); setSuccess(false); }}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${selected === r.id ? 'border-red-500/60 bg-red-500/10' : 'border-zinc-800 hover:border-zinc-700'}`}
                        >
                            <p className="text-white text-sm font-semibold">{r.label}</p>
                            <p className="text-zinc-500 text-xs mt-0.5">{r.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <Input label="From" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                    <Input label="To" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
                <LoadingButton
                    onClick={generate}
                    disabled={!selected || loading}
                    loading={loading}
                    className="w-full"
                >
                    {success ? <span className="flex items-center justify-center gap-2"><CheckCircle size={18} /> Report Generated</span> : 'Generate Report'}
                </LoadingButton>
            </Card>

            <Card padding="lg">
                <h2 className="text-white font-semibold mb-4">Recent Reports</h2>
                <div className="space-y-3">
                    {recentReports.map((r, i) => (
                        <div key={i} className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-4 hover:bg-zinc-800/50 transition-colors">
                            <div>
                                <p className="text-white text-sm font-semibold">{r.name}</p>
                                <p className="text-zinc-500 text-xs">Generated {r.generated} · {r.size}</p>
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
