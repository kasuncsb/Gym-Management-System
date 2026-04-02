'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, CheckCircle2, AlertTriangle, Wrench } from 'lucide-react';
import { PageHeader, Card, Modal, Select, Input, Textarea, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

type EqStatus = 'operational' | 'maintenance' | 'out_of_order';
type ReportStatus = 'open' | 'in_progress' | 'resolved';

type EquipmentRow = { id: string; name: string; category: string; zone: string; quantity: number; status: EqStatus };
type EventRow = { id: string; equipmentId: string; issue: string; severity: string; status: ReportStatus };

const toUiStatus = (status: string): EqStatus =>
    status === 'operational' ? 'operational' : status === 'needs_maintenance' ? 'maintenance' : 'out_of_order';

export default function ManagerEquipmentPage() {
    const toast = useToast();
    const [addEquipOpen, setAddEquipOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [resolveOpen, setResolveOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<EventRow | null>(null);
    const [loading, setLoading] = useState(false);
    const [equipment, setEquipment] = useState<EquipmentRow[]>([]);
    const [reports, setReports] = useState<EventRow[]>([]);

    const [addEquipForm, setAddEquipForm] = useState({
        name: '',
        category: 'cardio' as 'cardio' | 'strength_machine' | 'free_weight' | 'bench' | 'accessory' | 'other',
        zoneLabel: '',
        quantity: '1',
    });
    const [reportForm, setReportForm] = useState({ equipmentId: '', severity: 'medium' as 'low' | 'medium' | 'high' | 'critical', issue: '' });
    const [resolveNotes, setResolveNotes] = useState('');

    const loadData = async () => {
        const [eq, events] = await Promise.all([opsAPI.equipment(), opsAPI.equipmentEvents()]);
        setEquipment((eq ?? []).map((e: any) => ({
            id: e.id,
            name: e.name,
            category: e.category,
            zone: e.zoneLabel ?? '—',
            quantity: e.quantity ?? 1,
            status: toUiStatus(e.status),
        })));
        setReports((events ?? []).map((r: any) => ({
            id: r.id,
            equipmentId: r.equipmentId,
            issue: r.description,
            severity: r.severity ?? 'medium',
            status: (r.status ?? 'open') as ReportStatus,
        })));
    };

    useEffect(() => {
        loadData().catch((err) => toast.error('Failed to load equipment', getErrorMessage(err)));
    }, []);

    const handleAddEquipment = async () => {
        if (!addEquipForm.name.trim()) {
            toast.error('Validation Error', 'Equipment name is required');
            return;
        }
        setLoading(true);
        try {
            await opsAPI.createEquipment({
                name: addEquipForm.name.trim(),
                category: addEquipForm.category,
                quantity: Number(addEquipForm.quantity) || 1,
                zoneLabel: addEquipForm.zoneLabel || undefined,
            });
            await loadData();
            toast.success('Equipment Added', `${addEquipForm.name} has been added to inventory`);
            setAddEquipOpen(false);
            setAddEquipForm({ name: '', category: 'cardio', zoneLabel: '', quantity: '1' });
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleReportIssue = async () => {
        if (!reportForm.equipmentId || !reportForm.issue.trim()) {
            toast.error('Validation Error', 'Select equipment and describe the issue');
            return;
        }
        setLoading(true);
        try {
            await opsAPI.addEquipmentEvent({
                equipmentId: reportForm.equipmentId,
                eventType: 'issue_reported',
                severity: reportForm.severity,
                description: reportForm.issue.trim(),
                status: 'open',
            });
            await loadData();
            toast.success('Issue Reported', 'Equipment issue has been logged');
            setReportOpen(false);
            setReportForm({ equipmentId: '', severity: 'medium', issue: '' });
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async () => {
        if (!resolveNotes.trim()) {
            toast.error('Validation Error', 'Resolution notes are required');
            return;
        }
        if (!selectedReport) return;
        setLoading(true);
        try {
            await opsAPI.resolveEquipmentEvent(selectedReport.id);
            await opsAPI.updateEquipment(selectedReport.equipmentId, { status: 'operational' });
            await loadData();
            toast.success('Issue Resolved', 'Equipment event has been resolved');
            setResolveOpen(false);
            setSelectedReport(null);
            setResolveNotes('');
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const openResolve = (r: EventRow) => {
        setSelectedReport(r);
        setResolveNotes('');
        setResolveOpen(true);
    };

    const equipmentNameById = useMemo(() => new Map(equipment.map((e) => [e.id, e.name])), [equipment]);
    const openReports = reports.filter(r => r.status !== 'resolved');

    return (
        <div className="space-y-8">
            <PageHeader
                title="Equipment"
                subtitle="Manage gym equipment and resolve maintenance issues"
                action={
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-stretch">
                        <LoadingButton variant="secondary" icon={Wrench} onClick={() => setReportOpen(true)} size="md">
                            Report Issue
                        </LoadingButton>
                        <LoadingButton icon={Plus} onClick={() => setAddEquipOpen(true)} size="md">
                            Add Equipment
                        </LoadingButton>
                    </div>
                }
            />

            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Operational', value: equipment.filter(e => e.status === 'operational').length, icon: CheckCircle2, color: 'text-emerald-400' },
                    { label: 'Needs Maintenance', value: equipment.filter(e => e.status === 'maintenance').length, icon: AlertTriangle, color: 'text-amber-400' },
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
                <h2 className="text-lg font-semibold text-white mb-4">Equipment List ({equipment.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {equipment.length === 0 && <p className="text-zinc-500 text-sm col-span-2">No equipment found.</p>}
                    {equipment.map(e => (
                        <div key={e.id} className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-4">
                            <div>
                                <p className="text-white font-semibold">{e.name}</p>
                                <p className="text-zinc-500 text-sm capitalize">{e.category.replace('_', ' ')} · Zone: {e.zone} · Qty: {e.quantity}</p>
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
                <h2 className="text-lg font-semibold text-white mb-4">Open Issue Reports ({openReports.length})</h2>
                <div className="space-y-3">
                    {openReports.length === 0 && <p className="text-zinc-500 text-sm">No open issues.</p>}
                    {openReports.map(r => (
                        <div key={r.id} className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-4">
                            <div>
                                <p className="text-white font-semibold">{equipmentNameById.get(r.equipmentId) ?? 'Equipment'}</p>
                                <p className="text-zinc-400 text-sm">{r.issue}</p>
                                <span className={`text-xs font-medium ${
                                    r.severity === 'critical' ? 'text-red-400' : r.severity === 'high' ? 'text-orange-400' : r.severity === 'medium' ? 'text-amber-400' : 'text-zinc-400'
                                }`}>
                                    {r.severity} severity · {r.status}
                                </span>
                            </div>
                            <LoadingButton variant="secondary" size="sm" onClick={() => openResolve(r)}>
                                Mark Resolved
                            </LoadingButton>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Add Equipment Modal */}
            <Modal isOpen={addEquipOpen} onClose={() => setAddEquipOpen(false)} title="Add New Equipment" size="md">
                <div className="space-y-4">
                    <Input
                        id="eq-name"
                        label="Equipment Name"
                        value={addEquipForm.name}
                        onChange={e => setAddEquipForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Treadmill Pro X"
                        required
                    />
                    <Select
                        id="eq-category"
                        label="Category"
                        options={[
                            { value: 'cardio', label: 'Cardio' },
                            { value: 'strength_machine', label: 'Strength Machine' },
                            { value: 'free_weight', label: 'Free Weight' },
                            { value: 'bench', label: 'Bench' },
                            { value: 'accessory', label: 'Accessory' },
                            { value: 'other', label: 'Other' },
                        ]}
                        value={addEquipForm.category}
                        onChange={e => setAddEquipForm(f => ({ ...f, category: e.target.value as typeof addEquipForm.category }))}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            id="eq-zone"
                            label="Zone / Location"
                            value={addEquipForm.zoneLabel}
                            onChange={e => setAddEquipForm(f => ({ ...f, zoneLabel: e.target.value }))}
                            placeholder="e.g. Zone A"
                        />
                        <Input
                            id="eq-qty"
                            label="Quantity"
                            type="number"
                            value={addEquipForm.quantity}
                            onChange={e => setAddEquipForm(f => ({ ...f, quantity: e.target.value }))}
                            min="1"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setAddEquipOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleAddEquipment}>Add Equipment</LoadingButton>
                    </div>
                </div>
            </Modal>

            {/* Report Issue Modal */}
            <Modal isOpen={reportOpen} onClose={() => setReportOpen(false)} title="Report Equipment Issue" size="md">
                <div className="space-y-4">
                    <Select
                        id="report-eq"
                        label="Equipment"
                        options={equipment.map(e => ({ value: e.id, label: e.name }))}
                        value={reportForm.equipmentId}
                        onChange={e => setReportForm(f => ({ ...f, equipmentId: e.target.value }))}
                        placeholder="Select equipment"
                    />
                    <Select
                        id="report-severity"
                        label="Severity"
                        options={[
                            { value: 'low', label: 'Low' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'high', label: 'High' },
                            { value: 'critical', label: 'Critical' },
                        ]}
                        value={reportForm.severity}
                        onChange={e => setReportForm(f => ({ ...f, severity: e.target.value as typeof reportForm.severity }))}
                    />
                    <Textarea
                        id="report-issue"
                        label="Issue Description"
                        value={reportForm.issue}
                        onChange={e => setReportForm(f => ({ ...f, issue: e.target.value }))}
                        placeholder="Describe the issue in detail..."
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setReportOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleReportIssue}>Report Issue</LoadingButton>
                    </div>
                </div>
            </Modal>

            {/* Resolve Modal */}
            <Modal isOpen={resolveOpen} onClose={() => setResolveOpen(false)} title="Resolve Issue" description={selectedReport ? `Resolving: ${selectedReport.issue}` : ''} size="md">
                <div className="space-y-4">
                    <Textarea
                        id="resolve-notes"
                        label="Resolution Notes"
                        value={resolveNotes}
                        onChange={e => setResolveNotes(e.target.value)}
                        placeholder="Describe what was done to fix the issue..."
                        required
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setResolveOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleResolve}>Mark Resolved</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
