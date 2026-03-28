'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, User, Plus, X, CheckCircle, Star } from 'lucide-react';
import { PageHeader, Card, Modal, Input, Select, Textarea, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import axios from 'axios';
import { getErrorMessage, opsAPI } from '@/lib/api';

interface Session {
    id: string;
    trainerId: string;
    trainerName: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    status: 'booked' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
    cancelReason?: string | null;
    reviewRating?: number | null;
    reviewComment?: string | null;
}

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
    const [form, setForm] = useState({ trainer: '', date: '', time: '', type: '' });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [trainerOptions, setTrainerOptions] = useState<Array<{ value: string; label: string }>>([]);
    const [rateModal, setRateModal] = useState<Session | null>(null);
    const [rateStars, setRateStars] = useState(5);
    const [rateComment, setRateComment] = useState('');
    const [rateLoading, setRateLoading] = useState(false);

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

    const isUpcoming = (s: Session) => ['booked', 'confirmed'].includes(s.status);
    const filtered = filter === 'all' ? sessions : sessions.filter(s => s.status === filter);

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
            toast.success('Booking Confirmed', `Session booked on ${form.date} at ${form.time}`);
            setShowModal(false);
            setForm({ trainer: '', date: '', time: '', type: '' });
            await loadSessions();
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 409) {
                toast.error('Time Slot Unavailable', 'This time slot is already booked — please choose a different time.');
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
                    <Card key={s.id} padding="md" className="flex flex-col gap-3 hover:border-zinc-700/50 transition-colors">
                        <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center shrink-0">
                                <User size={20} className="text-blue-400" />
                            </div>
                            <div>
                                <p className="text-white font-semibold">{s.trainerName}</p>
                                <p className="text-zinc-500 text-sm">Personal Training</p>
                                {s.cancelReason && (
                                    <p className="text-zinc-600 text-xs mt-0.5">Reason: {s.cancelReason}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-white text-sm font-semibold flex items-center gap-1 justify-end">
                                    <Calendar size={12} className="text-zinc-500" /> {s.sessionDate}
                                </p>
                                <p className="text-zinc-500 text-xs flex items-center gap-1 justify-end">
                                    <Clock size={11} /> {s.startTime} – {s.endTime}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${statusStyles[s.status]}`}>
                                    {displayFilter(s.status)}
                                </span>
                                {isUpcoming(s) && (
                                    <button
                                        onClick={() => setCancelModal({ id: s.id, trainerName: s.trainerName })}
                                        title="Cancel session"
                                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                                {s.status === 'confirmed' && (
                                    <span title="Confirmed by trainer"><CheckCircle size={16} className="text-green-400" /></span>
                                )}
                                {s.status === 'completed' && s.reviewRating == null && (
                                    <LoadingButton size="sm" variant="secondary" className="!py-1 !px-2 text-xs" onClick={() => openRate(s)}>
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
