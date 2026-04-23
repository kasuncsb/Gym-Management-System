'use client';

import { useEffect, useMemo, useState } from 'react';
import { Wrench, AlertTriangle, CheckCircle2, Clock, Plus } from 'lucide-react';
import { PageHeader, Card, Modal, Select, Textarea, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

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

type EqRow = { id: string; name: string; category: string; status: EqStatus };
type ReportRow = { eqId: string; issue: string; date: string; status: ReportStatus };

const toUiStatus = (status: string): EqStatus =>
    status === 'operational' ? 'operational' : status === 'needs_maintenance' ? 'maintenance' : 'out_of_order';

export default function TrainerEquipmentPage() {
    const toast = useToast();
    const [showReport, setShowReport] = useState(false);
    const [equipment, setEquipment] = useState<EqRow[]>([]);
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [form, setForm] = useState({ equipment: '', severity: 'medium' as 'low' | 'medium' | 'high' | 'critical', issue: '' });
    const [submitLoading, setSubmitLoading] = useState(false);

    const loadData = async () => {
        const [eq, events] = await Promise.all([opsAPI.equipment(), opsAPI.equipmentEvents()]);
        setEquipment((eq ?? []).map((e: any) => ({
            id: e.id,
            name: e.name,
            category: e.category,
            status: toUiStatus(e.status),
        })));
        setReports((events ?? []).map((r: any) => ({
            eqId: r.equipmentId,
            issue: r.description,
            date: String(r.createdAt ?? '').slice(0, 10),
            status: (r.status ?? 'open') as ReportStatus,
        })));
    };

    useEffect(() => {
        loadData().catch((err) => toast.error('Failed to load equipment', getErrorMessage(err)));
    }, []);

    const openCountByEq = useMemo(() => {
        const m = new Map<string, number>();
        reports.filter(r => r.status !== 'resolved').forEach(r => m.set(r.eqId, (m.get(r.eqId) ?? 0) + 1));
        return m;
    }, [reports]);

    const handleSubmit = async () => {
        if (!form.equipment || !form.issue.trim()) {
            toast.error('Validation Error', 'Please select equipment and describe the issue');
            return;
        }
        setSubmitLoading(true);
        try {
            await opsAPI.addEquipmentEvent({
                equipmentId: form.equipment,
                eventType: 'issue_reported',
                severity: form.severity,
                description: form.issue.trim(),
                status: 'open',
            });
            await loadData();
            toast.success('Report Submitted', 'Issue has been logged');
            setShowReport(false);
            setForm({ equipment: '', severity: 'medium', issue: '' });
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setSubmitLoading(false);
        }
    };

    const eqNameById = useMemo(() => new Map(equipment.map((e) => [e.id, e.name])), [equipment]);
    const EQUIPMENT_OPTIONS = equipment.map((e) => ({ value: e.id, label: e.name }));

    return (
        <div className="space-y-8">
            <PageHeader
                title="Equipment Status"
                subtitle="Monitor and report equipment at GymSphere"
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
                        <p className="text-zinc-600 text-xs">Last maintenance: —</p>
                        {(openCountByEq.get(eq.id) ?? 0) > 0 && <p className="text-red-400 text-xs mt-1">{openCountByEq.get(eq.id)} open {(openCountByEq.get(eq.id) ?? 0) === 1 ? 'issue' : 'issues'}</p>}
                    </div>
                ))}
            </div>

            <Card padding="lg">
                <h2 className="text-lg font-semibold text-white mb-4">Open Reports</h2>
                <div className="space-y-3">
                    {reports.filter((r) => r.status !== 'resolved').map((r, i) => (
                        <div key={i} className="flex items-start justify-between bg-zinc-800/30 rounded-xl p-4">
                            <div>
                                <p className="text-white text-sm font-semibold">{eqNameById.get(r.eqId) ?? 'Equipment'} — {r.issue}</p>
                                <p className="text-zinc-500 text-xs">Reported on {r.date}</p>
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
                        onChange={e => setForm(f => ({ ...f, severity: e.target.value as 'low' | 'medium' | 'high' | 'critical' }))}
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
