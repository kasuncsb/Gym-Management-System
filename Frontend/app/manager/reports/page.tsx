'use client';

import { useState } from 'react';
import { TrendingUp, Download } from 'lucide-react';

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
    const [selected, setSelected] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo]     = useState('');
    const [loading, setLoading]   = useState(false);
    const [success, setSuccess]   = useState(false);

    const generate = () => {
        if (!selected) return;
        setLoading(true);
        setTimeout(() => { setLoading(false); setSuccess(true); }, 1500);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                    <TrendingUp size={28} className="text-blue-400" /> Generate Reports
                </h1>
                <p className="text-zinc-400">Create operational and financial reports for PowerWorld Kiribathgoda</p>
            </div>

            {/* Report builder */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-5">
                <h2 className="text-white font-semibold">Report Builder</h2>

                {/* Type selector */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {reportTypes.map(r => (
                        <div key={r.id} onClick={() => { setSelected(r.id); setSuccess(false); }}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${selected === r.id ? 'border-blue-500/60 bg-blue-500/10' : 'border-zinc-800 hover:border-zinc-700'}`}>
                            <p className="text-white text-sm font-semibold">{r.label}</p>
                            <p className="text-zinc-500 text-xs mt-0.5">{r.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Date range */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">From</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">To</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                </div>

                <button onClick={generate} disabled={!selected || loading}
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${!selected || loading ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                    {loading ? 'Generating...' : success ? '✓ Report Generated' : 'Generate Report'}
                </button>
            </div>

            {/* Recent reports */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-4">Recent Reports</h2>
                <div className="space-y-3">
                    {recentReports.map((r, i) => (
                        <div key={i} className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-4">
                            <div>
                                <p className="text-white text-sm font-semibold">{r.name}</p>
                                <p className="text-zinc-500 text-xs">Generated {r.generated} · {r.size}</p>
                            </div>
                            <button className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs font-semibold transition-colors">
                                <Download size={14} /> Download
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
