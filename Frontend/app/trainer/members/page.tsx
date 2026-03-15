'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { PageHeader, SearchInput, Card, Modal, Select, Input, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

type MemberRow = { id: string; name: string; plan: string; status: string; lastVisit: string; ptLeft: number };

export default function TrainerMembersPage() {
    const toast = useToast();
    const [search, setSearch] = useState('');
    const [members, setMembers] = useState<MemberRow[]>([]);
    const [vitalsOpen, setVitalsOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);
    const [loading, setLoading] = useState(false);

    const [vitalsForm, setVitalsForm] = useState({ weight: '', height: '', bodyFat: '', notes: '' });
    const [assignForm, setAssignForm] = useState({ plan: '', startDate: '', durationWeeks: '6', daysPerWeek: '3', difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced' });

    const loadMembers = async () => {
        const [rows, visits] = await Promise.all([opsAPI.members(), opsAPI.visits(500)]);
        const latestVisit = new Map<string, string>();
        (visits ?? []).forEach((v: any) => {
            if (!latestVisit.has(v.personId)) {
                latestVisit.set(v.personId, new Date(v.checkInAt ?? v.createdAt).toLocaleDateString());
            }
        });
        setMembers((rows ?? []).map((m: any) => ({
            id: m.id,
            name: m.fullName,
            plan: m.currentPlanName ?? 'Unassigned',
            status: m.memberStatus ?? 'inactive',
            lastVisit: latestVisit.get(m.id) ?? '—',
            ptLeft: Number(m.ptSessionsLeft ?? 0),
        })));
    };

    useEffect(() => {
        loadMembers().catch((err) => toast.error('Failed to load members', getErrorMessage(err)));
    }, []);

    const filtered = members.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) || m.id.includes(search)
    );

    const openVitals = (m: MemberRow) => {
        setSelectedMember(m);
        setVitalsForm({ weight: '', height: '', bodyFat: '', notes: '' });
        setVitalsOpen(true);
    };

    const openAssign = (m: MemberRow) => {
        setSelectedMember(m);
        setAssignForm({ plan: '', startDate: '', durationWeeks: '6', daysPerWeek: '3', difficulty: 'beginner' });
        setAssignOpen(true);
    };

    const handleVitals = async () => {
        if (!vitalsForm.weight || !vitalsForm.height) {
            toast.error('Validation Error', 'Weight and height are required');
            return;
        }
        setLoading(true);
        try {
            if (!selectedMember) return;
            const weight = Number(vitalsForm.weight);
            const height = Number(vitalsForm.height);
            const bmi = weight > 0 && height > 0 ? Number((weight / ((height / 100) ** 2)).toFixed(1)) : undefined;
            await opsAPI.addMemberMetric(selectedMember.id, {
                weightKg: weight || undefined,
                heightCm: height || undefined,
                bmi,
                notes: `BF%=${vitalsForm.bodyFat || '-'} ${vitalsForm.notes || ''}`.trim(),
            });
            toast.success('Vitals Recorded', `Logged for ${selectedMember?.name}`);
            setVitalsOpen(false);
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
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
            if (!selectedMember) return;
            await opsAPI.assignWorkoutPlan({
                memberId: selectedMember.id,
                name: assignForm.plan.trim(),
                description: `Start date: ${assignForm.startDate || 'immediate'}`,
                difficulty: assignForm.difficulty,
                durationWeeks: Math.max(1, Number(assignForm.durationWeeks) || 6),
                daysPerWeek: Math.max(1, Number(assignForm.daysPerWeek) || 3),
            });
            toast.success('Workout Assigned', `Assigned to ${selectedMember?.name}`);
            setAssignOpen(false);
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
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
                <SearchInput id="trainer-members-search" value={search} onChange={setSearch} placeholder="Search by name or ID..." className="w-full sm:w-64" aria-label="Search by name or ID" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(m => (
                    <Card key={m.id} padding="md" className="hover:border-zinc-700/50 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center">
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
                    <Input id="trainer-vitals-weight" label="Weight (kg)" type="number" value={vitalsForm.weight} onChange={e => setVitalsForm(f => ({ ...f, weight: e.target.value }))} placeholder="e.g. 75" />
                    <Input id="trainer-vitals-height" label="Height (cm)" type="number" value={vitalsForm.height} onChange={e => setVitalsForm(f => ({ ...f, height: e.target.value }))} placeholder="e.g. 175" />
                    <Input id="trainer-vitals-body-fat" label="Body Fat % (optional)" type="number" value={vitalsForm.bodyFat} onChange={e => setVitalsForm(f => ({ ...f, bodyFat: e.target.value }))} placeholder="e.g. 18" />
                    <Input id="trainer-vitals-notes" label="Notes (optional)" value={vitalsForm.notes} onChange={e => setVitalsForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setVitalsOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleVitals}>Save</LoadingButton>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Workout" description={selectedMember ? `Assign plan to ${selectedMember.name}` : ''} size="md">
                <div className="space-y-4">
                    <Input id="trainer-assign-plan" label="Workout Plan Name" value={assignForm.plan} onChange={e => setAssignForm(f => ({ ...f, plan: e.target.value }))} placeholder="e.g. Fat Loss Starter - Week 1" />
                    <Input id="trainer-assign-start-date" label="Start Date" type="date" value={assignForm.startDate} onChange={e => setAssignForm(f => ({ ...f, startDate: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-3">
                        <Input id="trainer-assign-duration" label="Duration (weeks)" type="number" value={assignForm.durationWeeks} onChange={e => setAssignForm(f => ({ ...f, durationWeeks: e.target.value }))} />
                        <Input id="trainer-assign-days" label="Days / week" type="number" value={assignForm.daysPerWeek} onChange={e => setAssignForm(f => ({ ...f, daysPerWeek: e.target.value }))} />
                    </div>
                    <Select
                        id="trainer-assign-difficulty"
                        label="Difficulty"
                        options={[{ value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' }]}
                        value={assignForm.difficulty}
                        onChange={e => setAssignForm(f => ({ ...f, difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced' }))}
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setAssignOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleAssign}>Assign</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
