'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, Plus, XCircle, User, Star } from 'lucide-react';
import { PageHeader, Card, Modal, Input, Select, Textarea, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

type OverrideType = 'day_off' | 'extra_shift' | 'modified_hours';
type SessionStatus = 'booked' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

interface PTSession {
    id: string;
    memberId: string;
    memberName?: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    status: SessionStatus;
    cancelReason?: string | null;
    reviewRating?: number | null;
    reviewComment?: string | null;
}

type ShiftRow = { day: string; start: string; end: string; type: 'shift' | 'off' };

const OVERRIDE_OPTIONS = [
    { value: 'day_off', label: 'Day Off' },
    { value: 'extra_shift', label: 'Extra Shift' },
    { value: 'modified_hours', label: 'Modified Hours' },
];

const statusStyles: Record<string, string> = {
    booked:    'bg-blue-500/20 text-blue-400',
    confirmed: 'bg-green-500/20 text-green-400',
    completed: 'bg-zinc-500/20 text-zinc-400',
    cancelled: 'bg-red-500/20 text-red-400',
    no_show:   'bg-orange-500/20 text-orange-400',
};

export default function TrainerSchedulePage() {
    const toast = useToast();
    const [shifts, setShifts] = useState<ShiftRow[]>([]);
    const [sessions, setSessions] = useState<PTSession[]>([]);
    const [overrideOpen, setOverrideOpen] = useState(false);
    const [overrideLoading, setOverrideLoading] = useState(false);
    const [overrideForm, setOverrideForm] = useState({ date: '', type: 'day_off' as string, notes: '' });
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [cancelModal, setCancelModal] = useState<string | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelSubmitting, setCancelSubmitting] = useState(false);

    const loadSchedule = async () => {
        const [pt, myShiftRows] = await Promise.all([
            opsAPI.trainerPtSessions(),
            opsAPI.myShifts(),
        ]);
        setSessions((pt ?? []).map((s: any) => ({
            id: s.id,
            memberId: s.memberId,
            memberName: s.memberName ?? s.memberId,
            sessionDate: String(s.sessionDate).slice(0, 10),
            startTime: String(s.startTime).slice(0, 5),
            endTime: String(s.endTime).slice(0, 5),
            status: s.status,
            cancelReason: s.cancelReason ?? null,
            reviewRating: s.reviewRating ?? null,
            reviewComment: s.reviewComment ?? null,
        })));

        const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const byDay = new Map<number, ShiftRow>();
        (myShiftRows ?? []).forEach((sh: any) => {
            const d = new Date(sh.shiftDate);
            const day = (d.getDay() + 6) % 7;
            if (!byDay.has(day)) {
                byDay.set(day, {
                    day: DAY_LABELS[day],
                    start: sh.startTime?.slice(0, 5) ?? '—',
                    end: sh.endTime?.slice(0, 5) ?? '—',
                    type: sh.status === 'missed' || sh.status === 'swapped' ? 'off' : 'shift',
                });
            }
        });
        setShifts(Array.from({ length: 7 }, (_, idx) =>
            byDay.get(idx) ?? { day: DAY_LABELS[idx], start: '—', end: '—', type: 'off' }
        ));
    };

    useEffect(() => {
        loadSchedule().catch(err => toast.error('Failed to load schedule', getErrorMessage(err)));
    }, []);

    const handleStatusUpdate = async (id: string, status: 'confirmed' | 'completed' | 'cancelled' | 'no_show', reason?: string) => {
        setActionLoading(`${id}:${status}`);
        try {
            await opsAPI.updatePtSession(id, { status, cancelReason: reason });
            toast.success('Updated', `Session marked as ${status.replace('_', ' ')}.`);
            await loadSchedule();
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async () => {
        if (!cancelModal) return;
        setCancelSubmitting(true);
        try {
            await handleStatusUpdate(cancelModal, 'cancelled', cancelReason.trim() || 'Cancelled by trainer');
            setCancelModal(null);
            setCancelReason('');
        } finally {
            setCancelSubmitting(false);
        }
    };

    const handleRequestOverride = async () => {
        if (!overrideForm.date || !overrideForm.type) {
            toast.error('Validation Error', 'Please fill required fields');
            return;
        }
        setOverrideLoading(true);
        try {
            // Send override request as an in-app message to managers
            await opsAPI.staffBroadcast({
                subject: `Schedule Override Request — ${overrideForm.date}`,
                body: `Trainer requested override on ${overrideForm.date}: ${overrideForm.type.replace('_', ' ')}. ${overrideForm.notes ? `Notes: ${overrideForm.notes}` : ''}`,
                targetRole: 'manager',
                priority: 'normal',
            });
            toast.success('Request Sent', 'Your override request has been submitted to the manager.');
            setOverrideOpen(false);
            setOverrideForm({ date: '', type: 'day_off', notes: '' });
        } catch {
            toast.error('Error', 'Failed to submit request');
        } finally {
            setOverrideLoading(false);
        }
    };

    const upcoming = sessions.filter(s => ['booked', 'confirmed'].includes(s.status));
    const past = sessions.filter(s => ['completed', 'cancelled', 'no_show'].includes(s.status));

    return (
        <div className="space-y-8">
            <PageHeader
                title="My Schedule"
                subtitle="View shifts, PT sessions, and manage bookings"
                action={
                    <LoadingButton icon={Plus} variant="secondary" onClick={() => setOverrideOpen(true)} size="sm">
                        Request Override
                    </LoadingButton>
                }
            />

            {/* Recurring Shifts */}
            <Card padding="lg">
                <h2 className="text-lg font-semibold text-white mb-6">Recurring Shifts</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                    {shifts.map((s, i) => (
                        <div key={i} className="bg-zinc-800/30 rounded-xl p-3 text-center">
                            <p className="text-white font-semibold text-sm">{s.day}</p>
                            {s.type === 'shift' ? (
                                <p className="text-zinc-400 text-xs mt-1 flex items-center justify-center gap-1">
                                    <Clock size={11} /> {s.start}–{s.end}
                                </p>
                            ) : (
                                <p className="text-zinc-600 text-xs mt-1">Off</p>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Upcoming PT Sessions with action buttons */}
            <Card padding="lg">
                <h2 className="text-lg font-semibold text-white mb-6">
                    Upcoming PT Sessions
                    {upcoming.length > 0 && (
                        <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{upcoming.length}</span>
                    )}
                </h2>
                {upcoming.length === 0 && (
                    <p className="text-zinc-500 text-sm">No upcoming sessions</p>
                )}
                <div className="space-y-3">
                    {upcoming.map(s => (
                        <div key={s.id} className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-4 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center shrink-0">
                                    <User size={18} className="text-red-400" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold">{s.memberName}</p>
                                    <p className="text-zinc-500 text-sm">{s.sessionDate} · {s.startTime}–{s.endTime}</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize w-fit ${statusStyles[s.status]}`}>
                                    {s.status}
                                </span>
                                <div className="flex flex-wrap items-center gap-1.5 justify-end">
                                {s.status === 'booked' && (
                                    <LoadingButton
                                        size="sm"
                                        variant="secondary"
                                        className="!py-1 !px-2 text-[11px]"
                                        loading={actionLoading === `${s.id}:confirmed`}
                                        disabled={!!actionLoading}
                                        onClick={() => handleStatusUpdate(s.id, 'confirmed')}
                                    >
                                        Confirm
                                    </LoadingButton>
                                )}
                                {(s.status === 'booked' || s.status === 'confirmed') && (
                                    <LoadingButton
                                        size="sm"
                                        className="!py-1 !px-2 text-[11px]"
                                        loading={actionLoading === `${s.id}:completed`}
                                        disabled={!!actionLoading}
                                        onClick={() => handleStatusUpdate(s.id, 'completed')}
                                    >
                                        Mark completed
                                    </LoadingButton>
                                )}
                                <LoadingButton
                                    size="sm"
                                    variant="secondary"
                                    className="!py-1 !px-2 text-[11px] border-orange-500/30 text-orange-300"
                                    loading={actionLoading === `${s.id}:no_show`}
                                    disabled={!!actionLoading}
                                    onClick={() => handleStatusUpdate(s.id, 'no_show')}
                                >
                                    No-show
                                </LoadingButton>
                                <button
                                    type="button"
                                    disabled={!!actionLoading}
                                    onClick={() => setCancelModal(s.id)}
                                    title="Cancel session"
                                    className="text-[11px] px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                                >
                                    <XCircle size={12} /> Cancel
                                </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Past sessions */}
            {past.length > 0 && (
                <Card padding="lg">
                    <h2 className="text-lg font-semibold text-white mb-4">Recent Sessions</h2>
                    <div className="space-y-2">
                        {past.slice(0, 6).map(s => (
                            <div key={s.id} className="bg-zinc-800/20 rounded-xl p-3 gap-2">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-zinc-300 text-sm font-semibold">{s.memberName}</p>
                                        <p className="text-zinc-500 text-xs">{s.sessionDate} · {s.startTime}–{s.endTime}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize shrink-0 ${statusStyles[s.status]}`}>
                                        {s.status.replace('_', ' ')}
                                    </span>
                                </div>
                                {s.status === 'completed' && s.reviewRating != null && (
                                    <div className="mt-2 pt-2 border-t border-zinc-700/40 text-xs text-zinc-500">
                                        <span className="text-amber-400 flex items-center gap-0.5">
                                            {Array.from({ length: 5 }, (_, i) => (
                                                <Star key={i} size={12} className={i < (s.reviewRating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'} />
                                            ))}
                                        </span>
                                        {s.reviewComment ? <p className="mt-1 text-zinc-400">{s.reviewComment}</p> : null}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Override request modal */}
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
                        <LoadingButton loading={overrideLoading} onClick={handleRequestOverride}>Submit Request</LoadingButton>
                    </div>
                </div>
            </Modal>

            {/* Cancel confirmation modal */}
            <Modal
                isOpen={!!cancelModal}
                onClose={() => { setCancelModal(null); setCancelReason(''); }}
                title="Cancel Session"
                description="Cancel this PT session and notify the member?"
                size="sm"
            >
                <div className="space-y-4">
                    <Input
                        label="Reason (required)"
                        value={cancelReason}
                        onChange={e => setCancelReason(e.target.value)}
                        placeholder="Please provide a reason"
                    />
                    <div className="flex justify-end gap-3">
                        <LoadingButton variant="secondary" onClick={() => { setCancelModal(null); setCancelReason(''); }}>
                            Keep Session
                        </LoadingButton>
                        <LoadingButton
                            variant="danger"
                            loading={cancelSubmitting}
                            onClick={handleCancel}
                        >
                            Cancel Session
                        </LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
