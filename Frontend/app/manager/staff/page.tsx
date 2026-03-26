'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock, Dumbbell, Plus, Pencil, Calendar } from 'lucide-react';
import { PageHeader, Card, Modal, Input, Select, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

type StaffRow = {
    id: string;
    name: string;
    role: string;
    members: number;
    sessions: number;
    todayShift: string | null;
    shiftStatus: 'scheduled' | 'active' | 'completed' | 'missed' | 'none';
    checkedIn: boolean;
};

const SHIFT_TYPE_OPTIONS = [
    { value: 'morning',   label: 'Morning (6AM–2PM)' },
    { value: 'afternoon', label: 'Afternoon (2PM–10PM)' },
    { value: 'evening',   label: 'Evening (4PM–11PM)' },
    { value: 'full_day',  label: 'Full Day (6AM–10PM)' },
];

const SHIFT_TIMES: Record<string, { start: string; end: string }> = {
    morning:   { start: '06:00', end: '14:00' },
    afternoon: { start: '14:00', end: '22:00' },
    evening:   { start: '16:00', end: '23:00' },
    full_day:  { start: '06:00', end: '22:00' },
};

export default function ManagerStaffPage() {
    const toast = useToast();
    const [staff, setStaff] = useState<StaffRow[]>([]);
    const [addOpen, setAddOpen] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<StaffRow | null>(null);
    const [loading, setLoading] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', email: '', employeeCode: '', hireDate: '' });
    const [scheduleForm, setScheduleForm] = useState({
        shiftType: 'morning' as 'morning' | 'afternoon' | 'evening' | 'full_day',
        shiftDate: new Date().toISOString().slice(0, 10),
        notes: '',
    });

    const loadData = async () => {
        const [trainers, visits, ptSessions, members, shifts] = await Promise.all([
            opsAPI.users('trainer'),
            opsAPI.visits(500),
            opsAPI.allPtSessions(),
            opsAPI.members(),
            opsAPI.shifts(),
        ]);

        const activeByTrainer = new Map<string, number>();
        (members ?? []).forEach((m: any) => {
            if (m.assignedTrainerId) activeByTrainer.set(m.assignedTrainerId, (activeByTrainer.get(m.assignedTrainerId) ?? 0) + 1);
        });

        const sessionByTrainer = new Map<string, number>();
        (ptSessions ?? []).forEach((s: any) => {
            const key = s.trainerId ?? '';
            if (key) sessionByTrainer.set(key, (sessionByTrainer.get(key) ?? 0) + 1);
        });

        const activeVisits = new Set((visits ?? []).filter((v: any) => v.status === 'active').map((v: any) => v.personId));

        const today = new Date().toISOString().slice(0, 10);
        const todayShiftByTrainer = new Map<string, { shiftType: string; status: string }>();
        (shifts ?? []).forEach((sh: any) => {
            if (sh.shiftDate && String(sh.shiftDate).slice(0, 10) === today) {
                todayShiftByTrainer.set(sh.staffId, { shiftType: sh.shiftType, status: sh.status });
            }
        });

        setStaff((trainers ?? []).map((t: any) => {
            const todayShiftInfo = todayShiftByTrainer.get(t.id);
            return {
                id: t.id,
                name: t.fullName,
                role: 'Personal Trainer',
                members: activeByTrainer.get(t.id) ?? 0,
                sessions: sessionByTrainer.get(t.id) ?? 0,
                todayShift: todayShiftInfo ? `${todayShiftInfo.shiftType.replace('_', ' ')} (${todayShiftInfo.status})` : null,
                shiftStatus: (todayShiftInfo?.status ?? 'none') as StaffRow['shiftStatus'],
                checkedIn: activeVisits.has(t.id),
            };
        }));
    };

    useEffect(() => {
        loadData().catch((err) => toast.error('Failed to load team', getErrorMessage(err)));
    }, []);

    const onShift = useMemo(() => staff.filter((s) => s.checkedIn).length, [staff]);

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
                phone: addForm.employeeCode ? `EMP:${addForm.employeeCode}` : undefined,
            });
            await loadData();
            toast.success('Trainer added', `${addForm.name} has been added. Temp password: TempPass123!`);
            setAddOpen(false);
            setAddForm({ name: '', email: '', employeeCode: '', hireDate: '' });
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleSchedule = async () => {
        if (!selectedStaff) return;
        setLoading(true);
        try {
            const times = SHIFT_TIMES[scheduleForm.shiftType];
            await opsAPI.createShift({
                staffId: selectedStaff.id,
                shiftType: scheduleForm.shiftType,
                shiftDate: scheduleForm.shiftDate,
                startTime: times.start,
                endTime: times.end,
                notes: scheduleForm.notes || undefined,
            });
            await loadData();
            toast.success('Shift Scheduled', `${selectedStaff.name} assigned ${scheduleForm.shiftType} shift on ${scheduleForm.shiftDate}`);
            setScheduleOpen(false);
            setSelectedStaff(null);
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const shiftStatusColor = (status: StaffRow['shiftStatus']) => {
        if (status === 'active') return 'text-emerald-400 bg-emerald-500/20';
        if (status === 'scheduled') return 'text-blue-400 bg-blue-500/20';
        if (status === 'completed') return 'text-zinc-400 bg-zinc-500/20';
        if (status === 'missed') return 'text-red-400 bg-red-500/20';
        return 'text-zinc-500 bg-zinc-800';
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
                <Card padding="md" className="text-center">
                    <p className="text-3xl font-bold text-white">{staff.length}</p>
                    <p className="text-zinc-500 text-xs">Total Staff</p>
                </Card>
                <Card padding="md" className="text-center">
                    <p className="text-3xl font-bold text-emerald-400">{onShift}</p>
                    <p className="text-zinc-500 text-xs">Currently Checked In</p>
                </Card>
                <Card padding="md" className="text-center">
                    <p className="text-3xl font-bold text-amber-400">{staff.length - onShift}</p>
                    <p className="text-zinc-500 text-xs">Not Checked In</p>
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
                            <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.checkedIn ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-500'}`}>
                                {s.checkedIn ? (
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" /> Checked In
                                    </span>
                                ) : 'Not In'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-zinc-800/40 rounded-xl py-2">
                                <div className="flex items-center justify-center gap-1 text-sm font-bold text-white"><Dumbbell size={12} /> {s.members}</div>
                                <p className="text-zinc-600 text-[10px]">Assigned Members</p>
                            </div>
                            <div className="bg-zinc-800/40 rounded-xl py-2">
                                <div className="text-sm font-bold text-white">{s.sessions}</div>
                                <p className="text-zinc-600 text-[10px]">PT Sessions</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock size={11} className="text-zinc-500" />
                                {s.todayShift ? (
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${shiftStatusColor(s.shiftStatus)}`}>
                                        {s.todayShift}
                                    </span>
                                ) : (
                                    <span className="text-zinc-600 text-xs">No shift today</span>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedStaff(s);
                                    setScheduleForm({ shiftType: 'morning', shiftDate: new Date().toISOString().slice(0, 10), notes: '' });
                                    setScheduleOpen(true);
                                }}
                                className="text-red-400 hover:text-red-300 text-xs font-medium flex items-center gap-1"
                            >
                                <Calendar size={12} /> Assign Shift
                            </button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Add Staff Modal */}
            <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Staff Member" size="md">
                <div className="space-y-4">
                    <Input id="staff-name" label="Full Name" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" required />
                    <Input id="staff-email" label="Email" type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" required />
                    <Input id="staff-emp-code" label="Employee Code (optional)" value={addForm.employeeCode} onChange={e => setAddForm(f => ({ ...f, employeeCode: e.target.value }))} placeholder="EMP001" />
                    <Input id="staff-hire-date" label="Hire Date (optional)" type="date" value={addForm.hireDate} onChange={e => setAddForm(f => ({ ...f, hireDate: e.target.value }))} />
                    <p className="text-zinc-500 text-xs">Default password: <code className="text-zinc-300">TempPass123!</code> — they should change it on first login.</p>
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setAddOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleAddStaff}>Add Staff</LoadingButton>
                    </div>
                </div>
            </Modal>

            {/* Assign Shift Modal */}
            <Modal isOpen={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Assign Shift" description={selectedStaff ? `Scheduling shift for ${selectedStaff.name}` : ''} size="md">
                <div className="space-y-4">
                    <Input id="shift-date" label="Shift Date" type="date" value={scheduleForm.shiftDate} onChange={e => setScheduleForm(f => ({ ...f, shiftDate: e.target.value }))} required />
                    <Select
                        id="shift-type"
                        label="Shift Type"
                        options={SHIFT_TYPE_OPTIONS}
                        value={scheduleForm.shiftType}
                        onChange={e => setScheduleForm(f => ({ ...f, shiftType: e.target.value as typeof scheduleForm.shiftType }))}
                    />
                    <Input id="shift-notes" label="Notes (optional)" value={scheduleForm.notes} onChange={e => setScheduleForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special instructions" />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setScheduleOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleSchedule}>Assign Shift</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
