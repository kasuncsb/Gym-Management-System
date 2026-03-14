'use client';

import { useState } from 'react';
import { Wrench, AlertTriangle, CheckCircle2, Clock, Plus, X } from 'lucide-react';

type EqStatus = 'operational' | 'maintenance' | 'out_of_order';
type ReportStatus = 'open' | 'in_progress' | 'resolved';

const statusColor: Record<EqStatus, string> = {
    operational: 'text-green-400 bg-green-500/20 border-green-500/30',
    maintenance:  'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
    out_of_order: 'text-red-400 bg-red-500/20 border-red-500/30',
};
const reportStatusColor: Record<ReportStatus, string> = {
    open:        'text-red-400 bg-red-500/20',
    in_progress: 'text-yellow-400 bg-yellow-500/20',
    resolved:    'text-green-400 bg-green-500/20',
};

const equipment = [
    { id: 1, name: 'Treadmill #1',     category: 'Cardio',    status: 'operational' as EqStatus, last: '2025-01-10', issues: 0 },
    { id: 2, name: 'Treadmill #2',     category: 'Cardio',    status: 'maintenance'  as EqStatus, last: '2025-01-15', issues: 1 },
    { id: 3, name: 'Elliptical #1',    category: 'Cardio',    status: 'operational' as EqStatus, last: '2025-01-12', issues: 0 },
    { id: 4, name: 'Rowing Machine',   category: 'Cardio',    status: 'out_of_order' as EqStatus, last: '2025-01-14', issues: 2 },
    { id: 5, name: 'Bench Press #1',   category: 'Strength',  status: 'operational' as EqStatus, last: '2025-01-08', issues: 0 },
    { id: 6, name: 'Leg Press',        category: 'Strength',  status: 'operational' as EqStatus, last: '2025-01-11', issues: 0 },
];

const reports = [
    { eq: 'Treadmill #2', issue: 'Belt slipping at high speed', reporter: 'Kasun F.', date: '2025-01-15', status: 'in_progress' as ReportStatus },
    { eq: 'Rowing Machine', issue: 'Display not working', reporter: 'Nimal P.', date: '2025-01-14', status: 'open' as ReportStatus },
    { eq: 'Rowing Machine', issue: 'Resistance mechanism stuck', reporter: 'Trainer', date: '2025-01-14', status: 'open' as ReportStatus },
];

export default function TrainerEquipmentPage() {
    const [showReport, setShowReport] = useState(false);
    const [form, setForm]             = useState({ equipment: '', issue: '' });

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                        <Wrench size={28} className="text-green-400" /> Equipment Status
                    </h1>
                    <p className="text-zinc-400">Monitor and report equipment at PowerWorld Kiribathgoda</p>
                </div>
                <button onClick={() => setShowReport(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all">
                    <Plus size={16} /> Report Issue
                </button>
            </div>

            {/* Overview stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Operational', value: equipment.filter(e => e.status === 'operational').length, color: 'text-green-400', icon: CheckCircle2 },
                    { label: 'Maintenance', value: equipment.filter(e => e.status === 'maintenance').length,  color: 'text-yellow-400', icon: Clock },
                    { label: 'Out of Order',value: equipment.filter(e => e.status === 'out_of_order').length,color: 'text-red-400',   icon: AlertTriangle },
                ].map(({ label, value, color, icon: Icon }) => (
                    <div key={label} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                        <Icon size={20} className={`${color} mb-3`} />
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                        <p className="text-zinc-500 text-xs">{label}</p>
                    </div>
                ))}
            </div>

            {/* Equipment grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {equipment.map(eq => (
                    <div key={eq.id} className={`bg-zinc-900/50 border rounded-2xl p-5 ${statusColor[eq.status].split(' ')[2] || 'border-zinc-800'}`}>
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="text-white font-semibold">{eq.name}</p>
                                <p className="text-zinc-500 text-xs">{eq.category}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold border ${statusColor[eq.status]}`}>
                                {eq.status.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="text-zinc-600 text-xs">Last maintenance: {eq.last}</p>
                        {eq.issues > 0 && <p className="text-red-400 text-xs mt-1">{eq.issues} open {eq.issues === 1 ? 'issue' : 'issues'}</p>}
                    </div>
                ))}
            </div>

            {/* Open reports */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Open Reports</h2>
                <div className="space-y-3">
                    {reports.map((r, i) => (
                        <div key={i} className="flex items-start justify-between bg-zinc-800/30 rounded-xl p-4">
                            <div>
                                <p className="text-white text-sm font-semibold">{r.eq} — {r.issue}</p>
                                <p className="text-zinc-500 text-xs">Reported by {r.reporter} on {r.date}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${reportStatusColor[r.status]}`}>{r.status.replace('_',' ')}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Report modal */}
            {showReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowReport(false)} />
                    <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md mx-4">
                        <div className="flex justify-between mb-5">
                            <h2 className="text-white font-bold text-lg">Report Equipment Issue</h2>
                            <button onClick={() => setShowReport(false)} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Equipment</label>
                                <select value={form.equipment} onChange={e => setForm(f => ({...f, equipment: e.target.value}))}
                                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-500">
                                    <option value="">Select equipment</option>
                                    {equipment.map(e => <option key={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Issue Description</label>
                                <textarea value={form.issue} onChange={e => setForm(f => ({...f, issue: e.target.value}))} rows={3}
                                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-500 resize-none" />
                            </div>
                            <button onClick={() => setShowReport(false)}
                                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-all">
                                Submit Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
