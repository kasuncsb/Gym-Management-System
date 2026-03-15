'use client';

import { useEffect, useMemo, useState } from 'react';
import { UserCheck, Star, Clock, Dumbbell, Plus, Pencil } from 'lucide-react';
import { PageHeader, Card, Modal, Input, Select, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

const ROLE_OPTIONS = [
    { value: 'trainer', label: 'Personal Trainer' },
    { value: 'senior_trainer', label: 'Senior Trainer' },
    { value: 'consultant', label: 'Fitness Consultant' },
    { value: 'operations', label: 'Operations Staff' },
];

type StaffRow = { id: string; name: string; role: string; members: number; sessions: number; rating: number; shift: string; status: 'on_shift' | 'off_shift' };

export default function ManagerStaffPage() {
    const toast = useToast();
    const [staff, setStaff] = useState<StaffRow[]>([]);
    const [addOpen, setAddOpen] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<StaffRow | null>(null);
    const [loading, setLoading] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', email: '', role: 'trainer', employeeCode: '', hireDate: '' });
    const [scheduleForm, setScheduleForm] = useState({ shifts: '', notes: '' });

    const loadData = async () => {
        const [trainers, visits, sessions, members] = await Promise.all([
            opsAPI.users('trainer'),
            opsAPI.visits(500),
            opsAPI.recentReports(),
            opsAPI.members(),
        ]);
        const activeByTrainer = new Map<string, number>();
        (members ?? []).forEach((m: any) => {
            if (m.assignedTrainerId) activeByTrainer.set(m.assignedTrainerId, (activeByTrainer.get(m.assignedTrainerId) ?? 0) + 1);
        });
        const sessionByTrainer = new Map<string, number>();
        (sessions ?? []).forEach((s: any) => {
            const key = s.trainerId ?? '';
            if (key) sessionByTrainer.set(key, (sessionByTrainer.get(key) ?? 0) + 1);
        });
        const activeVisits = new Set((visits ?? []).filter((v: any) => v.status === 'active').map((v: any) => v.personId));
        setStaff((trainers ?? []).map((t: any) => ({
            id: t.id,
            name: t.fullName,
            role: 'Personal Trainer',
            members: activeByTrainer.get(t.id) ?? 0,
            sessions: sessionByTrainer.get(t.id) ?? 0,
            rating: 4.5,
            shift: 'Assigned via schedule',
            status: activeVisits.has(t.id) ? 'on_shift' : 'off_shift',
        })));
    };

    useEffect(() => {
        loadData().catch((err) => toast.error('Failed to load staff', getErrorMessage(err)));
    }, []);

    const onShift = useMemo(() => staff.filter((s) => s.status === 'on_shift').length, [staff]);

    const handleAddStaff = async () => {
        if (!addForm.name.trim() || !addForm.email.trim()) {
            toast.error('Validation Error', 'Name and email are required');
            return;
        }
        setLoading(true);
        try {
            await opsAPI.createUser({
                fullName: addForm.name.trim(),
                email: addForm.email.trim(),
                role: 'trainer',
                password: 'TempPass123!',
            });
            await loadData();
            toast.success('Staff Added', `${addForm.name} has been added`);
            setAddOpen(false);
            setAddForm({ name: '', email: '', role: 'trainer', employeeCode: '', hireDate: '' });
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleSchedule = async () => {
        setLoading(true);
        try {
            if (selectedStaff) {
                await opsAPI.simulateTrainerShift({
                    trainerId: selectedStaff.id,
                    action: scheduleForm.notes.toLowerCase().includes('off') ? 'out' : 'in',
                });
                await loadData();
            }
            toast.success('Schedule Updated', 'Schedule has been saved');
            setScheduleOpen(false);
            setSelectedStaff(null);
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="Staff Management"
                subtitle="Staff overview for PowerWorld Kiribathgoda"
                action={
                    <LoadingButton icon={Plus} onClick={() => setAddOpen(true)} size="md">
                        Add Staff
                    </LoadingButton>
                }
            />

            <div className="grid grid-cols-3 gap-4">
                <Card padding="md" className="text-center hover:border-zinc-700/50 transition-colors">
                    <p className="text-3xl font-bold text-white">{staff.length}</p>
                    <p className="text-zinc-500 text-xs">Total Staff</p>
                </Card>
                <Card padding="md" className="text-center hover:border-zinc-700/50 transition-colors">
                    <p className="text-3xl font-bold text-emerald-400">{onShift}</p>
                    <p className="text-zinc-500 text-xs">Currently On Shift</p>
                </Card>
                <Card padding="md" className="text-center hover:border-zinc-700/50 transition-colors">
                    <p className="text-3xl font-bold text-amber-400">{staff.length - onShift}</p>
                    <p className="text-zinc-500 text-xs">Off Shift</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {staff.map((s) => (
                    <Card key={s.id} padding="md" className="flex flex-col gap-4 hover:border-zinc-700/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-white font-bold">
                                {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                                <p className="text-white font-semibold">{s.name}</p>
                                <p className="text-zinc-500 text-xs">{s.role}</p>
                            </div>
                            <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.status === 'on_shift' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-500'}`}>
                                {s.status === 'on_shift' ? (
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" /> On Shift
                                </span>
                            ) : 'Off Shift'}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-zinc-800/40 rounded-xl py-2">
                                <div className="flex items-center justify-center gap-1 text-sm font-bold text-white"><Dumbbell size={12} /> {s.members}</div>
                                <p className="text-zinc-600 text-[10px]">Members</p>
                            </div>
                            <div className="bg-zinc-800/40 rounded-xl py-2">
                                <div className="text-sm font-bold text-white">{s.sessions}</div>
                                <p className="text-zinc-600 text-[10px]">Sessions</p>
                            </div>
                            <div className="bg-zinc-800/40 rounded-xl py-2">
                                <div className="flex items-center justify-center gap-1 text-sm font-bold text-yellow-400"><Star size={11} /> {s.rating}</div>
                                <p className="text-zinc-600 text-[10px]">Rating</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-xs text-zinc-500">
                                <Clock size={11} /> Shift: {s.shift}
                            </span>
                            <button onClick={() => { setSelectedStaff(s); setScheduleOpen(true); }} className="text-red-400 hover:text-red-300 text-xs font-medium flex items-center gap-1">
                                <Pencil size={12} /> Edit Schedule
                            </button>
                        </div>
                    </Card>
                ))}
            </div>

            <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Staff" size="md">
                <div className="space-y-4">
                    <Input id="staff-add-name" label="Full Name" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" required />
                    <Input id="staff-add-email" label="Email" type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" required />
                    <Select id="staff-add-role" label="Role" options={ROLE_OPTIONS} value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))} />
                    <Input id="staff-add-employee-code" label="Employee Code" value={addForm.employeeCode} onChange={e => setAddForm(f => ({ ...f, employeeCode: e.target.value }))} placeholder="Optional" />
                    <Input id="staff-add-hire-date" label="Hire Date" type="date" value={addForm.hireDate} onChange={e => setAddForm(f => ({ ...f, hireDate: e.target.value }))} />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setAddOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleAddStaff}>Add Staff</LoadingButton>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Edit Schedule" description={selectedStaff ? `Schedule for ${selectedStaff.name}` : ''} size="md">
                <div className="space-y-4">
                    <Input id="staff-schedule-shifts" label="Recurring Shifts" value={scheduleForm.shifts} onChange={e => setScheduleForm(f => ({ ...f, shifts: e.target.value }))} placeholder="e.g. Mon-Fri 6AM-2PM" />
                    <Input id="staff-schedule-notes" label="Notes / Overrides" value={scheduleForm.notes} onChange={e => setScheduleForm(f => ({ ...f, notes: e.target.value }))} placeholder="Day off, extra shift, etc." />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setScheduleOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleSchedule}>Save Schedule</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
