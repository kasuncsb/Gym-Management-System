'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, User, Plus, X, CheckCircle, Star } from 'lucide-react';
import { PageHeader, Card, Modal, Input, Select, Textarea, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import axios from 'axios';
import { getErrorMessage, opsAPI, type PtBookingRules, type TrainerPtAvailability } from '@/lib/api';

function timeToMinutes(t: string): number {
    const [h, m] = t.split(':').map((x) => Number(x));
    return (h || 0) * 60 + (m || 0);
}

/** [slotStart, slotEnd) vs [busyStart, busyEnd) overlap, times HH:MM */
function slotOverlapsBusy(slotStart: string, slotEnd: string, busyStart: string, busyEnd: string): boolean {
    return timeToMinutes(slotStart) < timeToMinutes(busyEnd) && timeToMinutes(busyStart) < timeToMinutes(slotEnd);
}

function slotInsideWorkingHours(slotStart: string, slotEnd: string, windows: TrainerPtAvailability['workingWindows']): boolean {
    if (!windows.length) return true;
    const a = timeToMinutes(slotStart);
    const b = timeToMinutes(slotEnd);
    return windows.some((w) => a >= timeToMinutes(w.start) && b <= timeToMinutes(w.end));
}

function slotInsideGymHours(slotStart: string, slotEnd: string, gymOpen: string, gymClose: string): boolean {
    const a = timeToMinutes(slotStart);
    const b = timeToMinutes(slotEnd);
    return a >= timeToMinutes(gymOpen) && b <= timeToMinutes(gymClose);
}

interface Session {
    id: string;
    trainerId: string;
    trainerName: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    durationMinutes?: number;
    status: 'booked' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
    cancelReason?: string | null;
    reviewRating?: number | null;
    reviewComment?: string | null;
}

const SESSION_DURATION_CHOICES = [30, 45, 60, 90, 120] as const;

const SESSION_OPTIONS = [
    { value: 'Personal Training', label: 'Personal Training' },
    { value: 'Nutrition Consultation', label: 'Nutrition Consultation' },
    { value: 'Fitness Assessment', label: 'Fitness Assessment' },
    { value: 'Group Class', label: 'Group Class' },
];

const statusStyles: Record<string, string> = {
    booked:    'bg-blue-500/20 text-blue-400',
    confirmed: 'bg-green-500/20 text-green-400',
    completed: 'bg-zinc-500/20 text-zinc-400',
    cancelled: 'bg-red-500/20 text-red-400',
    no_show:   'bg-orange-500/20 text-orange-400',
};

const displayFilter = (s: string) => s.replace('_', ' ');

export default function AppointmentsPage() {
    const toast = useToast();
    const [filter, setFilter] = useState<'all' | 'booked' | 'confirmed' | 'completed' | 'cancelled'>('all');
    const [showModal, setShowModal] = useState(false);
    const [cancelModal, setCancelModal] = useState<{ id: string; trainerName: string } | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [form, setForm] = useState({
        trainer: '',
        date: '',
        time: '',
        type: '',
        durationMinutes: 60,
    });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [trainerOptions, setTrainerOptions] = useState<Array<{ value: string; label: string }>>([]);
    const [rateModal, setRateModal] = useState<Session | null>(null);
    const [rateStars, setRateStars] = useState(5);
    const [rateComment, setRateComment] = useState('');
    const [rateLoading, setRateLoading] = useState(false);
    const [availability, setAvailability] = useState<TrainerPtAvailability | null>(null);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [bookingRules, setBookingRules] = useState<PtBookingRules | null>(null);

    const loadSessions = async () => {
        try {
            const [rawSessions, trainers] = await Promise.all([
                opsAPI.myPtSessions(),
                opsAPI.trainers(),
            ]);
            const trainerMap = new Map((trainers ?? []).map((t: any) => [t.id, t.fullName]));
            setSessions((rawSessions ?? []).map((s: any) => ({
                id: s.id,
                trainerId: s.trainerId,
                trainerName: s.trainerName ?? trainerMap.get(s.trainerId) ?? s.trainerId,
                sessionDate: String(s.sessionDate).slice(0, 10),
                startTime: String(s.startTime).slice(0, 5),
                endTime: String(s.endTime).slice(0, 5),
                durationMinutes:
                    s.durationMinutes != null && Number.isFinite(Number(s.durationMinutes))
                        ? Number(s.durationMinutes)
                        : Math.max(0, timeToMinutes(String(s.endTime).slice(0, 5)) - timeToMinutes(String(s.startTime).slice(0, 5))),
                status: s.status,
                cancelReason: s.cancelReason ?? null,
                reviewRating: s.reviewRating ?? null,
                reviewComment: s.reviewComment ?? null,
            })));
            setTrainerOptions((trainers ?? []).map((t: any) => ({ value: t.id, label: t.fullName })));
        } catch {
            toast.error('Error', 'Failed to load appointments');
        }
    };

    useEffect(() => { loadSessions(); }, []);

    useEffect(() => {
        if (!showModal) {
            return;
        }
        let cancelled = false;
        opsAPI
            .ptBookingRules()
            .then((r) => {
                if (!cancelled) setBookingRules(r);
            })
            .catch(() => {
                if (!cancelled) setBookingRules(null);
            });
        return () => {
            cancelled = true;
        };
    }, [showModal]);

    useEffect(() => {
        if (!showModal || !form.trainer || !form.date) {
            setAvailability(null);
            return;
        }
        let cancelled = false;
        setAvailabilityLoading(true);
        opsAPI
            .trainerPtAvailability(form.trainer, form.date)
            .then((data) => {
                if (!cancelled) setAvailability(data);
            })
            .catch(() => {
                if (!cancelled) setAvailability(null);
            })
            .finally(() => {
                if (!cancelled) setAvailabilityLoading(false);
            });
        return () => { cancelled = true; };
    }, [showModal, form.trainer, form.date]);

    const slotPreview = (() => {
        if (!form.time) return null;
        const parts = form.time.split(':');
        const h = Number(parts[0]);
        const m = Number((parts[1] ?? '00').slice(0, 2));
        if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
        const startShort = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const endTotal = h * 60 + m + form.durationMinutes;
        if (endTotal > 24 * 60) return null;
        const eh = Math.floor(endTotal / 60);
        const em = endTotal % 60;
        const endShort = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
        return { startShort, endShort };
    })();

    const slotCheck = (() => {
        const rules = availability?.bookingRules ?? bookingRules;
        if (form.date && rules) {
            if (form.date < rules.minBookDate || form.date > rules.maxBookDate) {
                return {
                    tone: 'bad' as const,
                    message: `Pick a date between ${rules.minBookDate} and ${rules.maxBookDate} (branch ${rules.timezone}).`,
                };
            }
        }
        if (availability?.bookingRules?.isClosedDay) {
            return { tone: 'bad' as const, message: 'The gym is closed on this date. Choose another day.' };
        }
        if (form.time) {
            const sm = timeToMinutes(form.time.slice(0, 5));
            if (Number.isFinite(sm) && sm + form.durationMinutes > 24 * 60) {
                return {
                    tone: 'bad' as const,
                    message: 'Session extends past midnight; choose an earlier start or shorter duration.',
                };
            }
        }
        if (!availability || !slotPreview) return null;
        const { startShort, endShort } = slotPreview;
        const br = availability.bookingRules;
        if (!slotInsideGymHours(startShort, endShort, br.gymOpen, br.gymClose)) {
            return {
                tone: 'bad' as const,
                message: `Your ${form.durationMinutes}-minute session must fit within gym hours (${br.gymOpen}–${br.gymClose}, ${br.timezone}).`,
            };
        }
        const clashes = availability.busySlots.some((b) => slotOverlapsBusy(startShort, endShort, b.startTime, b.endTime));
        const inHours = slotInsideWorkingHours(startShort, endShort, availability.workingWindows);
        if (clashes) return { tone: 'bad' as const, message: 'This time overlaps another booking for this trainer. Pick a different slot.' };
        if (availability.hasShift && !inHours) return { tone: 'warn' as const, message: 'Outside this trainer’s listed shift for that day—they may still confirm manually.' };
        if (!availability.hasShift) return { tone: 'warn' as const, message: 'No shift on file for this day; you can still request a session and the trainer will confirm.' };
        return { tone: 'ok' as const, message: 'This time is inside their shift, within gym hours, and does not overlap existing bookings.' };
    })();

    const isUpcoming = (s: Session) => ['booked', 'confirmed'].includes(s.status);
    const filtered = filter === 'all' ? sessions : sessions.filter(s => s.status === filter);

    const handleBook = async () => {
        if (!form.trainer || !form.date || !form.time || !form.type) {
            toast.error('Validation Error', 'Please fill all fields');
            return;
        }
        if (slotCheck?.tone === 'bad') {
            toast.error('Cannot book', slotCheck.message);
            return;
        }
        setSubmitLoading(true);
        try {
            await opsAPI.createPtSession({
                memberId: 'self',
                trainerId: form.trainer,
                sessionDate: form.date,
                startTime: `${form.time}:00`,
                durationMinutes: form.durationMinutes,
            });
            toast.success('Booking Confirmed', `Session booked on ${form.date} at ${form.time} (${form.durationMinutes} min)`);
            setShowModal(false);
            setForm({ trainer: '', date: '', time: '', type: '', durationMinutes: 60 });
            await loadSessions();
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 409) {
                toast.error('Time Slot Unavailable', 'This time slot is already booked — please choose a different time.');
            } else if (axios.isAxiosError(err) && err.response?.status === 400) {
                toast.error('Cannot book session', getErrorMessage(err));
            } else {
                toast.error('Error', getErrorMessage(err));
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    const openRate = (s: Session) => {
        setRateStars(5);
        setRateComment('');
        setRateModal(s);
    };

    const handleSubmitReview = async () => {
        if (!rateModal) return;
        setRateLoading(true);
        try {
            await opsAPI.updatePtSession(rateModal.id, {
                reviewRating: rateStars,
                reviewComment: rateComment.trim() || null,
            });
            toast.success('Thanks!', 'Your session review was submitted.');
            setRateModal(null);
            await loadSessions();
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setRateLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!cancelModal) return;
        setCancelLoading(true);
        try {
            await opsAPI.updatePtSession(cancelModal.id, {
                status: 'cancelled',
                cancelReason: cancelReason.trim() || 'Cancelled by member',
            });
            toast.success('Session Cancelled', 'Your PT session has been cancelled.');
            setCancelModal(null);
            setCancelReason('');
            await loadSessions();
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setCancelLoading(false);
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

            <div className="flex gap-2 flex-wrap">
                {(['all', 'booked', 'confirmed', 'completed', 'cancelled'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-red-600 text-white border border-red-500' : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'}`}>
                        {displayFilter(f)}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-zinc-600">No {displayFilter(filter)} appointments.</div>
                )}
                {filtered.map(s => (
                    <Card key={s.id} padding="md" className="flex flex-col gap-3 min-w-0 overflow-hidden hover:border-zinc-700/50 transition-colors">
                        <div className="flex flex-col gap-3 min-w-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <div className="flex items-start gap-4 min-w-0 flex-1">
                            <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center shrink-0">
                                <User size={20} className="text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-white font-semibold break-words">{s.trainerName}</p>
                                <p className="text-zinc-500 text-sm">Personal Training</p>
                                {s.cancelReason && (
                                    <p className="text-zinc-600 text-xs mt-0.5">Reason: {s.cancelReason}</p>
                                )}
                            </div>
                            </div>
                            <div className="flex min-w-0 w-full flex-col gap-2 sm:w-auto sm:max-w-[min(100%,20rem)] sm:items-end sm:shrink-0">
                            <div className="text-right sm:min-w-[9rem]">
                                <p className="text-white text-sm font-semibold flex items-center gap-1 justify-end flex-wrap">
                                    <Calendar size={12} className="text-zinc-500 shrink-0" /> {s.sessionDate}
                                </p>
                                <p className="text-zinc-500 text-xs flex items-center gap-1 justify-end flex-wrap">
                                    <Clock size={11} className="shrink-0" /> {s.startTime} – {s.endTime}
                                    {s.durationMinutes != null ? (
                                        <span className="text-zinc-600 ml-1">({s.durationMinutes} min)</span>
                                    ) : null}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${statusStyles[s.status]}`}>
                                    {displayFilter(s.status)}
                                </span>
                                {isUpcoming(s) && (
                                    <button
                                        onClick={() => setCancelModal({ id: s.id, trainerName: s.trainerName })}
                                        title="Cancel session"
                                        className="shrink-0 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                                {s.status === 'confirmed' && (
                                    <span title="Confirmed by trainer" className="shrink-0 inline-flex"><CheckCircle size={16} className="text-green-400" /></span>
                                )}
                                {s.status === 'completed' && s.reviewRating == null && (
                                    <LoadingButton size="sm" variant="secondary" className="!py-1 !px-2 text-xs shrink-0" onClick={() => openRate(s)}>
                                        Rate session
                                    </LoadingButton>
                                )}
                            </div>
                            </div>
                        </div>
                        {s.status === 'completed' && s.reviewRating != null && (
                            <div className="mt-3 pt-3 border-t border-zinc-800/80 text-sm text-zinc-400">
                                <span className="text-amber-400 flex items-center gap-0.5">
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <Star key={i} size={14} className={i < (s.reviewRating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'} />
                                    ))}
                                </span>
                                {s.reviewComment ? <p className="mt-1 text-zinc-500">{s.reviewComment}</p> : null}
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            {/* Book modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Book a Session" description="See the trainer’s shift and existing bookings, then pick a time." size="lg">
                <div className="space-y-4">
                    <Select id="appointments-trainer" label="Trainer" options={trainerOptions} value={form.trainer} onChange={e => setForm(f => ({ ...f, trainer: e.target.value }))} placeholder="Select trainer" />
                    <Select id="appointments-type" label="Session Type" options={SESSION_OPTIONS} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} placeholder="Select type" />
                    <Input
                        id="appointments-date"
                        label="Date"
                        type="date"
                        value={form.date}
                        min={bookingRules?.minBookDate}
                        max={bookingRules?.maxBookDate}
                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    />
                    {bookingRules && (
                        <p className="text-zinc-500 text-xs -mt-2">
                            Branch hours {bookingRules.gymOpen}–{bookingRules.gymClose} ({bookingRules.timezone}). Book up to {bookingRules.advanceDaysMax} days ahead.
                        </p>
                    )}
                    {form.trainer && form.date && (
                        <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/40 p-4 text-sm">
                            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-2">Trainer availability — {form.date}</p>
                            {availabilityLoading && <p className="text-zinc-500">Loading schedule…</p>}
                            {!availabilityLoading && availability && (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-zinc-500 text-xs mb-1">Shift on this day</p>
                                        {availability.workingWindows.length === 0 ? (
                                            <p className="text-amber-400/90 text-sm">No published shift. You can still book; the trainer confirms when they see it.</p>
                                        ) : (
                                            <ul className="text-zinc-300 text-sm space-y-1">
                                                {availability.workingWindows.map((w, i) => (
                                                    <li key={i}>{w.start}–{w.end} <span className="text-zinc-600">({w.shiftType.replace('_', ' ')})</span></li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-zinc-500 text-xs mb-1">Already booked (not available)</p>
                                        {availability.busySlots.length === 0 ? (
                                            <p className="text-zinc-400 text-sm">No overlapping sessions — full day open aside from shift boundaries.</p>
                                        ) : (
                                            <ul className="text-zinc-300 text-sm space-y-1">
                                                {availability.busySlots.map((b, i) => (
                                                    <li key={i}>{b.startTime}–{b.endTime} <span className="text-zinc-600 capitalize">({b.status})</span></li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            id="appointments-time"
                            label="Start time"
                            type="time"
                            value={form.time}
                            onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                        />
                        <Select
                            id="appointments-duration"
                            label="Duration"
                            options={SESSION_DURATION_CHOICES.map((n) => ({ value: String(n), label: `${n} minutes` }))}
                            value={String(form.durationMinutes)}
                            onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) || 60 }))}
                        />
                    </div>
                    {slotPreview ? (
                        <p className="text-zinc-500 text-xs -mt-2">
                            Ends at {slotPreview.endShort} (within the same calendar day).
                        </p>
                    ) : null}
                    {slotCheck && (
                        <p className={`text-sm ${slotCheck.tone === 'ok' ? 'text-emerald-400' : slotCheck.tone === 'warn' ? 'text-amber-400' : 'text-rose-400'}`}>
                            {slotCheck.message}
                        </p>
                    )}
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setShowModal(false)}>Cancel</LoadingButton>
                        <LoadingButton
                            loading={submitLoading}
                            disabled={
                                slotCheck?.tone === 'bad'
                                || !form.trainer
                                || !form.date
                                || !form.time
                                || !form.type
                                || availabilityLoading
                                || !!(form.trainer && form.date && !availability && !availabilityLoading)
                            }
                            onClick={handleBook}
                        >
                            Confirm Booking
                        </LoadingButton>
                    </div>
                </div>
            </Modal>

            {/* Cancel confirmation modal */}
            <Modal
                isOpen={!!cancelModal}
                onClose={() => { setCancelModal(null); setCancelReason(''); }}
                title="Cancel Session"
                description={`Cancel your session with ${cancelModal?.trainerName ?? ''}?`}
                size="sm"
            >
                <div className="space-y-4">
                    <Input
                        id="cancel-reason"
                        label="Reason (optional)"
                        value={cancelReason}
                        onChange={e => setCancelReason(e.target.value)}
                        placeholder="Why are you cancelling?"
                    />
                    <div className="flex justify-end gap-3">
                        <LoadingButton variant="secondary" onClick={() => { setCancelModal(null); setCancelReason(''); }}>
                            Keep Session
                        </LoadingButton>
                        <LoadingButton variant="danger" loading={cancelLoading} onClick={handleCancel}>
                            Cancel Session
                        </LoadingButton>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={!!rateModal}
                onClose={() => { setRateModal(null); setRateComment(''); }}
                title="Rate your session"
                description={rateModal ? `How was your session with ${rateModal.trainerName}?` : undefined}
                size="sm"
            >
                <div className="space-y-4">
                    <div>
                        <p className="text-zinc-500 text-xs mb-2">Rating (required)</p>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setRateStars(n)}
                                    className="p-1 rounded-lg hover:bg-zinc-800/50 transition-colors"
                                    aria-label={`${n} stars`}
                                >
                                    <Star size={22} className={n <= rateStars ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'} />
                                </button>
                            ))}
                        </div>
                    </div>
                    <Textarea
                        label="Comment (optional)"
                        placeholder="Share feedback for your trainer…"
                        value={rateComment}
                        onChange={(e) => setRateComment(e.target.value)}
                        rows={3}
                    />
                    <div className="flex justify-end gap-3">
                        <LoadingButton variant="secondary" onClick={() => { setRateModal(null); setRateComment(''); }}>Cancel</LoadingButton>
                        <LoadingButton loading={rateLoading} onClick={handleSubmitReview}>Submit review</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
