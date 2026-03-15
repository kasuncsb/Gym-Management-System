'use client';

import { useEffect, useMemo, useState } from 'react';
import { Wrench, Plus, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PageHeader, Card, Modal, Select, Input, Textarea, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

type EqStatus = 'operational' | 'maintenance' | 'out_of_order';
type ReportStatus = 'open' | 'in_progress' | 'resolved';

type EquipmentRow = { id: string; name: string; category: string; zone: string; status: EqStatus };
type EventRow = { id: string; equipmentId: string; issue: string; status: ReportStatus };

const toUiStatus = (status: string): EqStatus =>
    status === 'operational' ? 'operational' : status === 'needs_maintenance' ? 'maintenance' : 'out_of_order';
const toApiStatus = (status: EqStatus): 'operational' | 'needs_maintenance' | 'under_maintenance' =>
    status === 'operational' ? 'operational' : status === 'maintenance' ? 'needs_maintenance' : 'under_maintenance';

export default function ManagerEquipmentPage() {
    const toast = useToast();
    const [addOpen, setAddOpen] = useState(false);
    const [resolveOpen, setResolveOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<EventRow | null>(null);
    const [loading, setLoading] = useState(false);
    const [equipment, setEquipment] = useState<EquipmentRow[]>([]);
    const [reports, setReports] = useState<EventRow[]>([]);
    const [addForm, setAddForm] = useState({ name: '', category: 'Cardio', zone: '', quantity: '1' });
    const [resolveForm, setResolveForm] = useState({ notes: '', cost: '' });
    const [reportForm, setReportForm] = useState({ equipmentId: '', issue: '' });

    const loadData = async () => {
        const [eq, events] = await Promise.all([opsAPI.equipment(), opsAPI.equipmentEvents()]);
        setEquipment((eq ?? []).map((e: any) => ({
            id: e.id,
            name: e.name,
            category: e.category,
            zone: e.zoneLabel ?? '—',
            status: toUiStatus(e.status),
        })));
        setReports((events ?? []).map((r: any) => ({
            id: r.id,
            equipmentId: r.equipmentId,
            issue: r.description,
            status: (r.status ?? 'open') as ReportStatus,
        })));
    };

    useEffect(() => {
        loadData().catch((err) => toast.error('Failed to load equipment', getErrorMessage(err)));
    }, []);

    const handleAdd = async () => {
        if (!reportForm.equipmentId || !reportForm.issue.trim()) {
            toast.error('Validation Error', 'Select equipment and describe the issue');
            return;
        }
        setLoading(true);
        try {
            await opsAPI.addEquipmentEvent({
                equipmentId: reportForm.equipmentId,
                eventType: 'issue_reported',
                severity: 'medium',
                description: reportForm.issue.trim(),
                status: 'open',
            });
            await loadData();
            toast.success('Issue Reported', 'Equipment issue has been logged');
            setAddOpen(false);
            setReportForm({ equipmentId: '', issue: '' });
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async () => {
        if (!resolveForm.notes.trim()) {
            toast.error('Validation Error', 'Resolution notes are required');
            return;
        }
        setLoading(true);
        try {
            if (!selectedReport) return;
            await opsAPI.addEquipmentEvent({
                equipmentId: selectedReport.equipmentId,
                eventType: 'maintenance_done',
                description: resolveForm.notes.trim(),
                status: 'resolved',
            });
            await opsAPI.updateEquipment(selectedReport.equipmentId, { status: 'operational' });
            await loadData();
            toast.success('Issue Resolved', 'Report has been marked resolved');
            setResolveOpen(false);
            setSelectedReport(null);
            setResolveForm({ notes: '', cost: '' });
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const openResolve = (r: EventRow) => {
        setSelectedReport(r);
        setResolveForm({ notes: '', cost: '' });
        setResolveOpen(true);
    };

    const equipmentNameById = useMemo(() => new Map(equipment.map((e) => [e.id, e.name])), [equipment]);

    return (
        <div className="space-y-8">
            <PageHeader
                title="Equipment"
                subtitle="Manage equipment and resolve issues"
                action={
                    <LoadingButton icon={Plus} onClick={() => setAddOpen(true)} size="md">
                        Add Equipment
                    </LoadingButton>
                }
            />

            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Operational', value: equipment.filter(e => e.status === 'operational').length, icon: CheckCircle2, color: 'text-emerald-400' },
                    { label: 'Maintenance', value: equipment.filter(e => e.status === 'maintenance').length, icon: AlertTriangle, color: 'text-amber-400' },
                    { label: 'Out of Order', value: equipment.filter(e => e.status === 'out_of_order').length, icon: AlertTriangle, color: 'text-red-400' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label} padding="md" className="text-center">
                        <Icon size={20} className={`${color} mb-2 mx-auto`} />
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                        <p className="text-zinc-500 text-xs">{label}</p>
                    </Card>
                ))}
            </div>

            <Card padding="lg">
                <h2 className="text-lg font-semibold text-white mb-4">Equipment List</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {equipment.map(e => (
                        <div key={e.id} className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-4">
                            <div>
                                <p className="text-white font-semibold">{e.name}</p>
                                <p className="text-zinc-500 text-sm">{e.category} · {e.zone}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                e.status === 'operational' ? 'bg-emerald-500/20 text-emerald-400' :
                                e.status === 'maintenance' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                                {e.status.replace('_', ' ')}
                            </span>
                        </div>
                    ))}
                </div>
            </Card>

            <Card padding="lg">
                <h2 className="text-lg font-semibold text-white mb-4">Issue Reports</h2>
                <div className="space-y-3">
                    {reports.filter((r) => r.status !== 'resolved').map(r => (
                        <div key={r.id} className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-4">
                            <div>
                                <p className="text-white font-semibold">{equipmentNameById.get(r.equipmentId) ?? 'Equipment'} — {r.issue}</p>
                                <p className="text-zinc-500 text-xs">{r.status.replace('_', ' ')}</p>
                            </div>
                            <LoadingButton variant="secondary" size="sm" onClick={() => openResolve(r)}>
                                Mark Resolved
                            </LoadingButton>
                        </div>
                    ))}
                </div>
            </Card>

            <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Equipment" size="md">
                <div className="space-y-4">
                    <Select id="equipment-select" label="Equipment" options={equipment.map((e) => ({ value: e.id, label: e.name }))} value={reportForm.equipmentId} onChange={e => setReportForm(f => ({ ...f, equipmentId: e.target.value }))} placeholder="Select equipment" />
                    <Textarea id="equipment-issue" label="Issue Description" value={reportForm.issue} onChange={e => setReportForm(f => ({ ...f, issue: e.target.value }))} placeholder="Describe the issue..." />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setAddOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleAdd}>Report Issue</LoadingButton>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={resolveOpen} onClose={() => setResolveOpen(false)} title="Resolve Issue" description={selectedReport ? `Resolving: ${selectedReport.issue}` : ''} size="md">
                <div className="space-y-4">
                    <Textarea id="equipment-resolve-notes" label="Resolution Notes" value={resolveForm.notes} onChange={e => setResolveForm(f => ({ ...f, notes: e.target.value }))} placeholder="What was done?" required />
                    <Input id="equipment-resolve-cost" label="Cost (Rs.) - optional" type="number" value={resolveForm.cost} onChange={e => setResolveForm(f => ({ ...f, cost: e.target.value }))} placeholder="0" />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setResolveOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleResolve}>Resolve</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
