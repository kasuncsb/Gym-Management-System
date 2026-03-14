'use client';

import { useState } from 'react';
import { Wrench, AlertTriangle, CheckCircle2, Clock, Plus } from 'lucide-react';
import { PageHeader, Card, Modal, Select, Textarea, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';

const SEVERITY_OPTIONS = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
];

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

const EQUIPMENT_OPTIONS = equipment.map(e => ({ value: e.name, label: e.name }));

export default function TrainerEquipmentPage() {
    const toast = useToast();
    const [showReport, setShowReport] = useState(false);
    const [form, setForm] = useState({ equipment: '', severity: 'medium' as string, issue: '' });
    const [submitLoading, setSubmitLoading] = useState(false);

    const handleSubmit = async () => {
        if (!form.equipment || !form.issue.trim()) {
            toast.error('Validation Error', 'Please select equipment and describe the issue');
            return;
        }
        setSubmitLoading(true);
        try {
            await new Promise(r => setTimeout(r, 500));
            toast.success('Report Submitted', `Issue reported for ${form.equipment}`);
            setShowReport(false);
            setForm({ equipment: '', severity: 'medium', issue: '' });
        } catch {
            toast.error('Error', 'Failed to submit report');
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="Equipment Status"
                subtitle="Monitor and report equipment at PowerWorld Kiribathgoda"
                action={
                    <LoadingButton icon={Plus} onClick={() => setShowReport(true)} size="md">
                        Report Issue
                    </LoadingButton>
                }
            />

            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Operational', value: equipment.filter(e => e.status === 'operational').length, color: 'text-green-400', icon: CheckCircle2 },
                    { label: 'Maintenance', value: equipment.filter(e => e.status === 'maintenance').length,  color: 'text-yellow-400', icon: Clock },
                    { label: 'Out of Order', value: equipment.filter(e => e.status === 'out_of_order').length, color: 'text-red-400', icon: AlertTriangle },
                ].map(({ label, value, color, icon: Icon }) => (
                    <Card key={label} padding="md" className="hover:border-zinc-700/50 transition-colors">
                        <Icon size={20} className={`${color} mb-3`} />
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                        <p className="text-zinc-500 text-xs">{label}</p>
                    </Card>
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

            <Card padding="lg">
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
            </Card>

            <Modal
                isOpen={showReport}
                onClose={() => setShowReport(false)}
                title="Report Equipment Issue"
                description="Report a malfunction or maintenance need"
                size="md"
            >
                <div className="space-y-4">
                    <Select
                        label="Equipment"
                        options={EQUIPMENT_OPTIONS}
                        value={form.equipment}
                        onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))}
                        placeholder="Select equipment"
                    />
                    <Select
                        label="Severity"
                        options={SEVERITY_OPTIONS}
                        value={form.severity}
                        onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                    />
                    <Textarea
                        label="Issue Description"
                        value={form.issue}
                        onChange={e => setForm(f => ({ ...f, issue: e.target.value }))}
                        rows={3}
                        placeholder="Describe the issue..."
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setShowReport(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={submitLoading} onClick={handleSubmit}>Submit Report</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
