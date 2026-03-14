'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { PageHeader, SearchInput, Card, Modal, Select, Input, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';

const MOCK_MEMBERS = [
    { id: 'PW2025001', name: 'Nimal Perera', plan: 'Premium', status: 'active', lastVisit: 'Today', ptLeft: 4 },
    { id: 'PW2025012', name: 'Chathurika Silva', plan: 'Basic', status: 'active', lastVisit: '2 days ago', ptLeft: 2 },
    { id: 'PW2025034', name: 'Thilini Wijesinghe', plan: 'Elite', status: 'active', lastVisit: 'Yesterday', ptLeft: 6 },
];

const MOCK_PLANS = [
    { value: 'full_body', label: 'Full Body Power' },
    { value: 'cardio', label: 'Cardio Blast' },
    { value: 'flexibility', label: 'Flexibility & Recovery' },
];

export default function TrainerMembersPage() {
    const toast = useToast();
    const [search, setSearch] = useState('');
    const [vitalsOpen, setVitalsOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<typeof MOCK_MEMBERS[0] | null>(null);
    const [loading, setLoading] = useState(false);

    const [vitalsForm, setVitalsForm] = useState({ weight: '', height: '', bodyFat: '', notes: '' });
    const [assignForm, setAssignForm] = useState({ plan: '', startDate: '' });

    const filtered = MOCK_MEMBERS.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) || m.id.includes(search)
    );

    const openVitals = (m: typeof MOCK_MEMBERS[0]) => {
        setSelectedMember(m);
        setVitalsForm({ weight: '', height: '', bodyFat: '', notes: '' });
        setVitalsOpen(true);
    };

    const openAssign = (m: typeof MOCK_MEMBERS[0]) => {
        setSelectedMember(m);
        setAssignForm({ plan: '', startDate: '' });
        setAssignOpen(true);
    };

    const handleVitals = async () => {
        if (!vitalsForm.weight || !vitalsForm.height) {
            toast.error('Validation Error', 'Weight and height are required');
            return;
        }
        setLoading(true);
        try {
            await new Promise(r => setTimeout(r, 600));
            toast.success('Vitals Recorded', `Logged for ${selectedMember?.name}`);
            setVitalsOpen(false);
        } catch {
            toast.error('Error', 'Failed to record vitals');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!assignForm.plan || !assignForm.startDate) {
            toast.error('Validation Error', 'Please select plan and start date');
            return;
        }
        setLoading(true);
        try {
            await new Promise(r => setTimeout(r, 600));
            toast.success('Workout Assigned', `Assigned to ${selectedMember?.name}`);
            setAssignOpen(false);
        } catch {
            toast.error('Error', 'Failed to assign workout');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="My Members"
                subtitle="Assigned members — log vitals, assign workouts"
            />

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <SearchInput value={search} onChange={setSearch} placeholder="Search by name or ID..." className="w-full sm:w-64" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(m => (
                    <Card key={m.id} padding="md" className="hover:border-zinc-700/50 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center">
                                    <Users size={20} className="text-red-400" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold">{m.name}</p>
                                    <p className="text-zinc-500 text-xs">{m.id}</p>
                                </div>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${m.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                                {m.status}
                            </span>
                        </div>
                        <div className="space-y-1 text-sm text-zinc-400">
                            <p>Plan: {m.plan}</p>
                            <p>Last visit: {m.lastVisit}</p>
                            <p>PT sessions left: {m.ptLeft}</p>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <LoadingButton variant="secondary" size="sm" onClick={() => openVitals(m)}>
                                Log Vitals
                            </LoadingButton>
                            <LoadingButton variant="secondary" size="sm" onClick={() => openAssign(m)}>
                                Assign Workout
                            </LoadingButton>
                        </div>
                    </Card>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-16 text-zinc-500">No assigned members found.</div>
            )}

            <Modal isOpen={vitalsOpen} onClose={() => setVitalsOpen(false)} title="Log Member Vitals" description={selectedMember ? `Record vitals for ${selectedMember.name}` : ''} size="md">
                <div className="space-y-4">
                    <Input label="Weight (kg)" type="number" value={vitalsForm.weight} onChange={e => setVitalsForm(f => ({ ...f, weight: e.target.value }))} placeholder="e.g. 75" />
                    <Input label="Height (cm)" type="number" value={vitalsForm.height} onChange={e => setVitalsForm(f => ({ ...f, height: e.target.value }))} placeholder="e.g. 175" />
                    <Input label="Body Fat % (optional)" type="number" value={vitalsForm.bodyFat} onChange={e => setVitalsForm(f => ({ ...f, bodyFat: e.target.value }))} placeholder="e.g. 18" />
                    <Input label="Notes (optional)" value={vitalsForm.notes} onChange={e => setVitalsForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setVitalsOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleVitals}>Save</LoadingButton>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Workout" description={selectedMember ? `Assign plan to ${selectedMember.name}` : ''} size="md">
                <div className="space-y-4">
                    <Select label="Workout Plan" options={MOCK_PLANS} value={assignForm.plan} onChange={e => setAssignForm(f => ({ ...f, plan: e.target.value }))} placeholder="Select plan" />
                    <Input label="Start Date" type="date" value={assignForm.startDate} onChange={e => setAssignForm(f => ({ ...f, startDate: e.target.value }))} />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setAssignOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleAssign}>Assign</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
