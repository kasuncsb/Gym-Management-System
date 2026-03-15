'use client';

import { useState } from 'react';
import { Wrench, Plus, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PageHeader, Card, Modal, Select, Input, Textarea, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';

type EqStatus = 'operational' | 'maintenance' | 'out_of_order';
type ReportStatus = 'open' | 'in_progress' | 'resolved';

const MOCK_EQUIPMENT = [
    { id: 1, name: 'Treadmill #1', category: 'Cardio', zone: 'Zone A', status: 'operational' as EqStatus },
    { id: 2, name: 'Treadmill #2', category: 'Cardio', zone: 'Zone A', status: 'maintenance' as EqStatus },
    { id: 3, name: 'Rowing Machine', category: 'Cardio', zone: 'Zone A', status: 'out_of_order' as EqStatus },
    { id: 4, name: 'Bench Press #1', category: 'Strength', zone: 'Zone B', status: 'operational' as EqStatus },
];

const MOCK_REPORTS = [
    { id: 1, eq: 'Treadmill #2', issue: 'Belt slipping', status: 'in_progress' as ReportStatus },
    { id: 2, eq: 'Rowing Machine', issue: 'Display not working', status: 'open' as ReportStatus },
];

export default function ManagerEquipmentPage() {
    const toast = useToast();
    const [addOpen, setAddOpen] = useState(false);
    const [resolveOpen, setResolveOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<typeof MOCK_REPORTS[0] | null>(null);
    const [loading, setLoading] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', category: 'Cardio', zone: '', quantity: '1' });
    const [resolveForm, setResolveForm] = useState({ notes: '', cost: '' });

    const handleAdd = async () => {
        if (!addForm.name.trim()) {
            toast.error('Validation Error', 'Equipment name is required');
            return;
        }
        setLoading(true);
        try {
            await new Promise(r => setTimeout(r, 600));
            toast.success('Equipment Added', `${addForm.name} has been added`);
            setAddOpen(false);
            setAddForm({ name: '', category: 'Cardio', zone: '', quantity: '1' });
        } catch {
            toast.error('Error', 'Failed to add equipment');
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
            await new Promise(r => setTimeout(r, 600));
            toast.success('Issue Resolved', 'Report has been marked resolved');
            setResolveOpen(false);
            setSelectedReport(null);
            setResolveForm({ notes: '', cost: '' });
        } catch {
            toast.error('Error', 'Failed to resolve');
        } finally {
            setLoading(false);
        }
    };

    const openResolve = (r: typeof MOCK_REPORTS[0]) => {
        setSelectedReport(r);
        setResolveForm({ notes: '', cost: '' });
        setResolveOpen(true);
    };

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
                    { label: 'Operational', value: MOCK_EQUIPMENT.filter(e => e.status === 'operational').length, icon: CheckCircle2, color: 'text-emerald-400' },
                    { label: 'Maintenance', value: MOCK_EQUIPMENT.filter(e => e.status === 'maintenance').length, icon: AlertTriangle, color: 'text-amber-400' },
                    { label: 'Out of Order', value: MOCK_EQUIPMENT.filter(e => e.status === 'out_of_order').length, icon: AlertTriangle, color: 'text-red-400' },
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
                    {MOCK_EQUIPMENT.map(e => (
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
                    {MOCK_REPORTS.map(r => (
                        <div key={r.id} className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-4">
                            <div>
                                <p className="text-white font-semibold">{r.eq} — {r.issue}</p>
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
                    <Input id="equipment-add-name" label="Name" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Treadmill #3" />
                    <Select id="equipment-add-category" label="Category" options={[{ value: 'Cardio', label: 'Cardio' }, { value: 'Strength', label: 'Strength' }]} value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))} />
                    <Input id="equipment-add-zone" label="Zone" value={addForm.zone} onChange={e => setAddForm(f => ({ ...f, zone: e.target.value }))} placeholder="e.g. Zone A" />
                    <Input id="equipment-add-quantity" label="Quantity" type="number" value={addForm.quantity} onChange={e => setAddForm(f => ({ ...f, quantity: e.target.value }))} />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setAddOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleAdd}>Add</LoadingButton>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={resolveOpen} onClose={() => setResolveOpen(false)} title="Resolve Issue" description={selectedReport ? `Resolving: ${selectedReport.eq}` : ''} size="md">
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
