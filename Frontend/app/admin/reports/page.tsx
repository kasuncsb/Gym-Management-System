'use client';

import { useState } from 'react';
import { TrendingUp, Download } from 'lucide-react';

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

export default function AdminReportsPage() {
    const [selected, setSelected] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo]     = useState('');
    const [fmt, setFmt]   = useState<'PDF' | 'CSV' | 'Excel'>('PDF');
    const [loading, setLoading] = useState(false);
    const [done, setDone]       = useState(false);

    const run = () => {
        if (!selected) return;
        setLoading(true); setDone(false);
        setTimeout(() => { setLoading(false); setDone(true); }, 1800);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                    <TrendingUp size={28} className="text-red-400" /> System Reports
                </h1>
                <p className="text-zinc-400">Generate comprehensive operational reports</p>
            </div>

            {/* Builder */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-5">
                <h2 className="text-white font-semibold">Report Builder</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {reportTypes.map(r => (
                        <div key={r.id} onClick={() => { setSelected(r.id); setDone(false); }}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${selected === r.id ? 'border-red-500/60 bg-red-500/10' : 'border-zinc-800 hover:border-zinc-700'}`}>
                            <p className="text-white text-sm font-semibold">{r.label}</p>
                            <p className="text-zinc-500 text-xs mt-0.5">{r.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">From</label>
                        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-500" />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">To</label>
                        <input type="date" value={to} onChange={e => setTo(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-500" />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Format</label>
                        <select value={fmt} onChange={e => setFmt(e.target.value as any)}
                            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-500">
                            <option>PDF</option><option>CSV</option><option>Excel</option>
                        </select>
                    </div>
                </div>
                <button onClick={run} disabled={!selected || loading}
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${!selected || loading ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : done ? 'bg-green-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                    {loading ? 'Generating...' : done ? '✓ Report Ready — Download' : 'Generate Report'}
                </button>
            </div>

            {/* Recent */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-4">Recent Reports</h2>
                <div className="space-y-3">
                    {recent.map((r, i) => (
                        <div key={i} className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-4">
                            <div>
                                <p className="text-white text-sm font-semibold">{r.name}</p>
                                <p className="text-zinc-500 text-xs">{r.generated} · {r.size} · {r.format}</p>
                            </div>
                            <button className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs font-semibold transition-colors">
                                <Download size={14} /> Download
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
