'use client';

import { useState } from 'react';
import { UserCheck, Star, Clock, Dumbbell, Plus, Pencil } from 'lucide-react';
import { PageHeader, Card, Modal, Input, Select, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';

const ROLE_OPTIONS = [
    { value: 'trainer', label: 'Personal Trainer' },
    { value: 'senior_trainer', label: 'Senior Trainer' },
    { value: 'consultant', label: 'Fitness Consultant' },
    { value: 'operations', label: 'Operations Staff' },
];

const initialStaff = [
    { name: 'Chathurika Silva',  role: 'Personal Trainer',      members: 14, sessions: 52, rating: 4.9, shift: '6AM – 2PM',  status: 'on_shift' },
    { name: 'Isuru Bandara',     role: 'Personal Trainer',      members: 11, sessions: 44, rating: 4.7, shift: '2PM – 10PM', status: 'off_shift' },
    { name: 'Ruwan Jayawardena', role: 'Senior Trainer',        members: 18, sessions: 67, rating: 4.8, shift: '6AM – 2PM',  status: 'on_shift' },
    { name: 'Nirosha Senanayake',role: 'Fitness Consultant',    members: 8,  sessions: 31, rating: 4.5, shift: '10AM – 6PM', status: 'on_shift' },
    { name: 'Kasun Perera',      role: 'Operations Staff',      members: 0,  sessions: 0,  rating: 4.6, shift: '6AM – 2PM',  status: 'on_shift' },
];

export default function ManagerStaffPage() {
    const toast = useToast();
    const [staff, setStaff] = useState(initialStaff);
    const [addOpen, setAddOpen] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<typeof initialStaff[0] | null>(null);
    const [loading, setLoading] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', email: '', role: 'trainer', employeeCode: '', hireDate: '' });
    const [scheduleForm, setScheduleForm] = useState({ shifts: '', notes: '' });

    const onShift = staff.filter((s: { status: string }) => s.status === 'on_shift').length;

    const handleAddStaff = async () => {
        if (!addForm.name.trim() || !addForm.email.trim()) {
            toast.error('Validation Error', 'Name and email are required');
            return;
        }
        setLoading(true);
        try {
            await new Promise(r => setTimeout(r, 600));
            toast.success('Staff Added', `${addForm.name} has been added`);
            setAddOpen(false);
            setAddForm({ name: '', email: '', role: 'trainer', employeeCode: '', hireDate: '' });
        } catch {
            toast.error('Error', 'Failed to add staff');
        } finally {
            setLoading(false);
        }
    };

    const handleSchedule = async () => {
        setLoading(true);
        try {
            await new Promise(r => setTimeout(r, 600));
            toast.success('Schedule Updated', 'Schedule has been saved');
            setScheduleOpen(false);
            setSelectedStaff(null);
        } catch {
            toast.error('Error', 'Failed to update schedule');
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
                {staff.map((s, i) => (
                    <Card key={i} padding="md" className="flex flex-col gap-4 hover:border-zinc-700/50 transition-colors">
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
