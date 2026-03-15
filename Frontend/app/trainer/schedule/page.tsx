'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { PageHeader, Card, Modal, Input, Select, Textarea, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

type OverrideType = 'day_off' | 'extra_shift' | 'modified_hours';

type SessionRow = { date: string; time: string; member: string };
type ShiftRow = { day: string; start: string; end: string; type: 'shift' | 'off' };

const OVERRIDE_OPTIONS = [
    { value: 'day_off', label: 'Day Off' },
    { value: 'extra_shift', label: 'Extra Shift' },
    { value: 'modified_hours', label: 'Modified Hours' },
];

export default function TrainerSchedulePage() {
    const toast = useToast();
    const [shifts, setShifts] = useState<ShiftRow[]>([]);
    const [sessions, setSessions] = useState<SessionRow[]>([]);
    const [overrides, setOverrides] = useState<Array<{ date: string; type: OverrideType; notes: string }>>([]);
    const [overrideOpen, setOverrideOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [overrideForm, setOverrideForm] = useState({ date: '', type: 'day_off' as string, notes: '' });
    const [view, setView] = useState<'week' | 'month'>('week');

    const loadSchedule = async () => {
        const [pt, myVisits] = await Promise.all([opsAPI.trainerPtSessions(), opsAPI.myVisits(50)]);
        setSessions((pt ?? []).slice(0, 10).map((s: any) => ({
            date: String(s.sessionDate).slice(0, 10),
            time: String(s.startTime).slice(0, 5),
            member: s.memberId,
        })));
        const byDay = new Map<number, ShiftRow>();
        (myVisits ?? []).forEach((v: any) => {
            const d = new Date(v.checkInAt);
            const day = (d.getDay() + 6) % 7;
            if (!byDay.has(day)) {
                byDay.set(day, {
                    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day],
                    start: String(v.checkInAt).slice(11, 16),
                    end: v.checkOutAt ? String(v.checkOutAt).slice(11, 16) : '—',
                    type: 'shift',
                });
            }
        });
        setShifts(Array.from({ length: 7 }, (_, idx) => byDay.get(idx) ?? { day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx], start: '—', end: '—', type: 'off' }));
    };

    useEffect(() => {
        loadSchedule().catch((err) => toast.error('Failed to load schedule', getErrorMessage(err)));
    }, []);

    const handleRequestOverride = async () => {
        if (!overrideForm.date || !overrideForm.type) {
            toast.error('Validation Error', 'Please fill required fields');
            return;
        }
        setLoading(true);
        try {
            setOverrides((prev) => [{ date: overrideForm.date, type: overrideForm.type as OverrideType, notes: overrideForm.notes }, ...prev].slice(0, 8));
            toast.success('Request Sent', 'Your override request has been submitted.');
            setOverrideOpen(false);
            setOverrideForm({ date: '', type: 'day_off', notes: '' });
        } catch {
            toast.error('Error', 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="My Schedule"
                subtitle="View shifts, PT sessions, and request overrides"
                action={
                    <LoadingButton icon={Plus} variant="secondary" onClick={() => setOverrideOpen(true)} size="sm">
                        Request Override
                    </LoadingButton>
                }
            />

            <div className="flex gap-2">
                {(['week', 'month'] as const).map(v => (
                    <button key={v} onClick={() => setView(v)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${view === v ? 'bg-red-600 text-white' : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'}`}>
                        {v}
                    </button>
                ))}
            </div>

            <Card padding="lg">
                <h2 className="text-lg font-semibold text-white mb-6">Recurring Shifts</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {shifts.map((s, i) => (
                        <div key={i} className="bg-zinc-800/30 rounded-xl p-4 text-center">
                            <p className="text-white font-semibold">{s.day}</p>
                            {s.type === 'shift' ? (
                                <>
                                    <p className="text-zinc-400 text-sm mt-1 flex items-center justify-center gap-1">
                                        <Clock size={12} /> {s.start} – {s.end}
                                    </p>
                                </>
                            ) : (
                                <p className="text-zinc-500 text-sm mt-1">Off</p>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            <Card padding="lg">
                <h2 className="text-lg font-semibold text-white mb-6">Upcoming PT Sessions</h2>
                <div className="space-y-3">
                    {sessions.map((s, i) => (
                        <div key={i} className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center">
                                    <Calendar size={18} className="text-red-400" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold">{s.member}</p>
                                    <p className="text-zinc-500 text-sm">{s.date} · {s.time}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card padding="lg">
                <h2 className="text-lg font-semibold text-white mb-6">Overrides</h2>
                <div className="space-y-3">
                    {overrides.map((o, i) => (
                        <div key={i} className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-4">
                            <div>
                                <p className="text-white font-semibold">{o.date} · {o.type.replace('_', ' ')}</p>
                                {o.notes && <p className="text-zinc-500 text-sm">{o.notes}</p>}
                            </div>
                            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">Pending</span>
                        </div>
                    ))}
                    {overrides.length === 0 && (
                        <p className="text-zinc-500 text-sm">No overrides</p>
                    )}
                </div>
            </Card>

            <Modal isOpen={overrideOpen} onClose={() => setOverrideOpen(false)} title="Request Override" size="md">
                <div className="space-y-4">
                    <Input
                        label="Date"
                        type="date"
                        value={overrideForm.date}
                        onChange={e => setOverrideForm(f => ({ ...f, date: e.target.value }))}
                    />
                    <Select
                        label="Type"
                        options={OVERRIDE_OPTIONS}
                        value={overrideForm.type}
                        onChange={e => setOverrideForm(f => ({ ...f, type: e.target.value }))}
                    />
                    <Textarea
                        label="Notes (optional)"
                        placeholder="Reason or details"
                        value={overrideForm.notes}
                        onChange={e => setOverrideForm(f => ({ ...f, notes: e.target.value }))}
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setOverrideOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleRequestOverride}>Submit Request</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
