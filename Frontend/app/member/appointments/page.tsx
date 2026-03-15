'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, User, Plus } from 'lucide-react';
import { PageHeader, Card, Modal, Input, Select, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

interface Appointment {
    id: string;
    trainer: string;
    date: string;
    time: string;
    type: string;
    status: 'upcoming' | 'completed' | 'cancelled';
}
const SESSION_OPTIONS = [
    { value: 'Personal Training', label: 'Personal Training' },
    { value: 'Nutrition Consultation', label: 'Nutrition Consultation' },
    { value: 'Fitness Assessment', label: 'Fitness Assessment' },
    { value: 'Group Class', label: 'Group Class' },
];

const statusStyles: Record<string, string> = {
    upcoming:  'bg-blue-500/20 text-blue-400',
    completed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
};

export default function AppointmentsPage() {
    const toast = useToast();
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ trainer: '', date: '', time: '', type: '' });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [trainerOptions, setTrainerOptions] = useState<Array<{ value: string; label: string }>>([]);

    useEffect(() => {
        Promise.all([
            opsAPI.myPtSessions(),
            opsAPI.users('trainer'),
        ]).then(([sessions, trainers]) => {
            const trainerMap = new Map((trainers ?? []).map((t: any) => [t.id, t.fullName]));
            const mapped = (sessions ?? []).map((s: any) => {
                const status: Appointment['status'] = s.status === 'completed'
                    ? 'completed'
                    : s.status === 'cancelled' ? 'cancelled' : 'upcoming';
                const date = String(s.sessionDate).slice(0, 10);
                return {
                    id: s.id,
                    trainer: trainerMap.get(s.trainerId) ?? s.trainerId,
                    date,
                    time: String(s.startTime).slice(0, 5),
                    type: 'Personal Training',
                    status,
                };
            }) as Appointment[];
            setAppointments(mapped);
            setTrainerOptions((trainers ?? []).map((t: any) => ({ value: t.id, label: t.fullName })));
        }).catch(() => {
            toast.error('Error', 'Failed to load appointments');
        });
    }, []);

    const filtered = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

    const handleBook = async () => {
        if (!form.trainer || !form.date || !form.time || !form.type) {
            toast.error('Validation Error', 'Please fill all fields');
            return;
        }
        setSubmitLoading(true);
        try {
            const endHour = Math.min(23, Number(form.time.slice(0, 2)) + 1);
            const endTime = `${String(endHour).padStart(2, '0')}:${form.time.slice(3, 5)}:00`;
            await opsAPI.createPtSession({
                memberId: 'self',
                trainerId: form.trainer,
                sessionDate: form.date,
                startTime: `${form.time}:00`,
                endTime,
            });
            const refreshed = await opsAPI.myPtSessions();
            const trainerMap = new Map(trainerOptions.map((t) => [t.value, t.label]));
            setAppointments((refreshed ?? []).map((s: any) => ({
                id: s.id,
                trainer: trainerMap.get(s.trainerId) ?? s.trainerId,
                date: String(s.sessionDate).slice(0, 10),
                time: String(s.startTime).slice(0, 5),
                type: 'Personal Training',
                status: s.status === 'completed' ? 'completed' : s.status === 'cancelled' ? 'cancelled' : 'upcoming',
            })));
            toast.success('Booking Confirmed', `Session booked on ${form.date} at ${form.time}`);
            setShowModal(false);
            setForm({ trainer: '', date: '', time: '', type: '' });
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="Appointments"
                subtitle="Manage your personal training sessions"
                action={
                    <LoadingButton icon={Plus} onClick={() => setShowModal(true)} size="md">
                        Book Session
                    </LoadingButton>
                }
            />

            <div className="flex gap-2">
                {(['all', 'upcoming', 'completed', 'cancelled'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-red-600 text-white border border-red-500' : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'}`}>
                        {f}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-zinc-600">No {filter} appointments.</div>
                )}
                {filtered.map(a => (
                    <Card key={a.id} padding="md" className="flex items-center justify-between hover:border-zinc-700/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center">
                                <User size={20} className="text-blue-400" />
                            </div>
                            <div>
                                <p className="text-white font-semibold">{a.trainer}</p>
                                <p className="text-zinc-500 text-sm">{a.type}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-white text-sm font-semibold flex items-center gap-1 justify-end">
                                    <Calendar size={12} className="text-zinc-500" /> {a.date}
                                </p>
                                <p className="text-zinc-500 text-xs flex items-center gap-1 justify-end">
                                    <Clock size={11} /> {a.time}
                                </p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusStyles[a.status]}`}>{a.status}</span>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Book modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Book a Session" description="Schedule a personal training or consultation" size="md">
                <div className="space-y-4">
                    <Select id="appointments-trainer" label="Trainer" options={trainerOptions} value={form.trainer} onChange={e => setForm(f => ({ ...f, trainer: e.target.value }))} placeholder="Select trainer" />
                    <Select id="appointments-type" label="Session Type" options={SESSION_OPTIONS} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} placeholder="Select type" />
                    <Input id="appointments-date" label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                    <Input id="appointments-time" label="Time" type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setShowModal(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={submitLoading} onClick={handleBook}>Confirm Booking</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
