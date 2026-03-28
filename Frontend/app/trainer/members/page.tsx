'use client';

import { useEffect, useState } from 'react';
import { Users, Eye, Activity, Dumbbell, Calendar, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { PageHeader, SearchInput, Card, Modal, Select, Input, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

type MemberRow = { id: string; name: string; plan: string; status: string; lastVisit: string };

type DetailTab = 'metrics' | 'plans' | 'sessions';

interface MemberDetail {
    member: MemberRow;
    metrics: any[];
    plans: any[];
    sessions: any[];
    loading: boolean;
}

const DIFFICULTY_OPTIONS = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
];

export default function TrainerMembersPage() {
    const toast = useToast();
    const [search, setSearch] = useState('');
    const [members, setMembers] = useState<MemberRow[]>([]);
    const [planExercises, setPlanExercises] = useState<Record<string, any[]>>({});
    const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
    const [expandedExDay, setExpandedExDay] = useState<number | null>(null);
    const [vitalsOpen, setVitalsOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);
    const [detail, setDetail] = useState<MemberDetail | null>(null);
    const [detailTab, setDetailTab] = useState<DetailTab>('metrics');
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
        })));
    };

    useEffect(() => {
        loadMembers().catch(err => toast.error('Failed to load members', getErrorMessage(err)));
    }, []);

    const filtered = members.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) || m.id.includes(search)
    );

    const openDetail = async (m: MemberRow) => {
        setSelectedMember(m);
        setDetail({ member: m, metrics: [], plans: [], sessions: [], loading: true });
        setDetailTab('metrics');
        setDetailOpen(true);
        try {
            const [metrics, plans, sessions] = await Promise.all([
                opsAPI.memberMetrics(m.id),
                opsAPI.memberWorkoutPlans(m.id),
                opsAPI.allPtSessions().then((all: any[]) => all.filter((s: any) => s.memberId === m.id)),
            ]);
            setDetail({ member: m, metrics: metrics ?? [], plans: plans ?? [], sessions: sessions ?? [], loading: false });
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
            setDetail(prev => prev ? { ...prev, loading: false } : null);
        }
    };

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
            toast.success('Vitals Recorded', `Logged for ${selectedMember.name}`);
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
            toast.success('Workout Assigned', `Assigned to ${selectedMember.name}`);
            setAssignOpen(false);
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader title="My Members" subtitle="Assigned members — log vitals, assign workouts, view history" />

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
                                    <p className="text-zinc-600 text-xs font-mono">{m.id.slice(0, 8)}…</p>
                                </div>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${m.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                                {m.status}
                            </span>
                        </div>
                        <div className="space-y-1 text-sm text-zinc-400 mb-4">
                            <p>Plan: {m.plan}</p>
                            <p>Last visit: {m.lastVisit}</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <LoadingButton variant="secondary" size="sm" onClick={() => openVitals(m)}>
                                Log Vitals
                            </LoadingButton>
                            <LoadingButton variant="secondary" size="sm" onClick={() => openAssign(m)}>
                                Assign Workout
                            </LoadingButton>
                            <button
                                onClick={() => openDetail(m)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white transition-colors border border-zinc-700/50"
                            >
                                <Eye size={12} /> View Details
                            </button>
                        </div>
                    </Card>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-16 text-zinc-500">No assigned members found.</div>
            )}

            {/* Member Detail Drawer */}
            <Modal
                isOpen={detailOpen}
                onClose={() => setDetailOpen(false)}
                title={detail?.member.name ?? 'Member Details'}
                description="Metrics, workout plans, and PT session history"
                size="lg"
            >
                {detail?.loading ? (
                    <div className="text-center py-10 text-zinc-500">Loading member data…</div>
                ) : detail && (
                    <div className="space-y-4">
                        {/* Tab navigation */}
                        <div className="flex gap-2 border-b border-zinc-800 pb-3">
                            {(['metrics', 'plans', 'sessions'] as DetailTab[]).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setDetailTab(tab)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${detailTab === tab ? 'bg-red-600/20 text-red-400 border border-red-600/30' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    {tab === 'metrics' && <Activity size={12} />}
                                    {tab === 'plans' && <Dumbbell size={12} />}
                                    {tab === 'sessions' && <Calendar size={12} />}
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Metrics tab */}
                        {detailTab === 'metrics' && (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {detail.metrics.length === 0 && <p className="text-zinc-500 text-sm">No metrics recorded yet.</p>}
                                {detail.metrics.map((m: any, i: number) => (
                                    <div key={i} className="bg-zinc-800/30 rounded-xl p-3 grid grid-cols-4 gap-3 text-sm">
                                        <div>
                                            <p className="text-zinc-500 text-xs">Weight</p>
                                            <p className="text-white">{m.weightKg ? `${m.weightKg} kg` : '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 text-xs">Height</p>
                                            <p className="text-white">{m.heightCm ? `${m.heightCm} cm` : '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 text-xs">BMI</p>
                                            <p className="text-white">{m.bmi ?? '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 text-xs">Recorded</p>
                                            <p className="text-zinc-400 text-xs">{m.recordedAt ? new Date(m.recordedAt).toLocaleDateString() : '—'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Plans tab */}
                        {detailTab === 'plans' && (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {detail.plans.length === 0 && <p className="text-zinc-500 text-sm">No workout plans assigned yet.</p>}
                                {detail.plans.map((p: any, i: number) => {
                                    const isExpanded = expandedPlanId === p.id;
                                    const exs = planExercises[p.id];
                                    return (
                                        <div key={i} className="bg-zinc-800/30 rounded-xl overflow-hidden">
                                            <div className="p-3 flex justify-between items-center">
                                                <div>
                                                    <p className="text-white font-semibold text-sm">{p.name}</p>
                                                    <p className="text-zinc-500 text-xs">{p.daysPerWeek} days/week · {p.durationWeeks} weeks · <span className="capitalize">{p.difficulty}</span></p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${p.source === 'ai_generated' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                        {p.source === 'ai_generated' ? 'AI' : 'Trainer'}
                                                    </span>
                                                    <button
                                                        onClick={async () => {
                                                            if (isExpanded) { setExpandedPlanId(null); return; }
                                                            setExpandedPlanId(p.id);
                                                            setExpandedExDay(null);
                                                            if (!planExercises[p.id]) {
                                                                const data = await opsAPI.planExercises(p.id).catch(() => []);
                                                                setPlanExercises(prev => ({ ...prev, [p.id]: data }));
                                                            }
                                                        }}
                                                        className="text-zinc-400 hover:text-white transition-colors"
                                                    >
                                                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                            {isExpanded && (
                                                <div className="border-t border-zinc-700/50 p-3 space-y-2">
                                                    {!exs ? (
                                                        <p className="text-zinc-500 text-xs">Loading…</p>
                                                    ) : exs.length === 0 ? (
                                                        <p className="text-zinc-500 text-xs">No exercises linked to this plan yet.</p>
                                                    ) : (
                                                        Array.from(new Set(exs.map(e => e.dayNumber))).sort((a, b) => a - b).map(day => {
                                                            const dayExs = exs.filter(e => e.dayNumber === day).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
                                                            const isDayOpen = expandedExDay === day;
                                                            return (
                                                                <div key={day} className="border border-zinc-700/50 rounded-lg overflow-hidden">
                                                                    <button
                                                                        onClick={() => setExpandedExDay(isDayOpen ? null : day)}
                                                                        className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800/40 hover:bg-zinc-700/40 transition-colors"
                                                                    >
                                                                        <span className="text-white text-xs font-medium">Day {day}</span>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-zinc-500 text-xs">{dayExs.length} exercises</span>
                                                                            {isDayOpen ? <ChevronUp size={12} className="text-zinc-500" /> : <ChevronDown size={12} className="text-zinc-500" />}
                                                                        </div>
                                                                    </button>
                                                                    {isDayOpen && (
                                                                        <div className="divide-y divide-zinc-800/50">
                                                                            {dayExs.map((ex, j) => (
                                                                                <div key={j} className="px-3 py-2">
                                                                                    <div className="flex items-center justify-between gap-2">
                                                                                        <div>
                                                                                            <p className="text-white text-xs font-medium">{ex.exerciseName ?? 'Exercise'}</p>
                                                                                            {ex.muscleGroup && <p className="text-zinc-500 text-[10px] capitalize">{ex.muscleGroup}</p>}
                                                                                        </div>
                                                                                        <div className="flex gap-1 text-[10px]">
                                                                                            {ex.sets && <span className="bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded">{ex.sets}×</span>}
                                                                                            {ex.reps && <span className="bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded">{ex.reps}</span>}
                                                                                            {ex.durationSec && <span className="bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded">{ex.durationSec}s</span>}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Sessions tab */}
                        {detailTab === 'sessions' && (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {detail.sessions.length === 0 && <p className="text-zinc-500 text-sm">No PT sessions found.</p>}
                                {detail.sessions.map((s: any, i: number) => (
                                    <div key={i} className="bg-zinc-800/30 rounded-xl p-3 flex justify-between items-center">
                                        <div>
                                            <p className="text-white text-sm">{String(s.sessionDate).slice(0, 10)} · {String(s.startTime).slice(0, 5)}–{String(s.endTime).slice(0, 5)}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${s.status === 'completed' ? 'bg-zinc-500/20 text-zinc-400' : s.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {s.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between pt-2">
                            <div className="flex gap-2">
                                <LoadingButton variant="secondary" size="sm" onClick={() => { setDetailOpen(false); openVitals(detail.member); }}>
                                    Log Vitals
                                </LoadingButton>
                                <LoadingButton variant="secondary" size="sm" onClick={() => { setDetailOpen(false); openAssign(detail.member); }}>
                                    Assign Workout
                                </LoadingButton>
                            </div>
                            <LoadingButton variant="secondary" size="sm" onClick={() => setDetailOpen(false)}>
                                Close
                            </LoadingButton>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Log Vitals modal */}
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

            {/* Assign Workout modal */}
            <Modal isOpen={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Workout" description={selectedMember ? `Assign plan to ${selectedMember.name}` : ''} size="md">
                <div className="space-y-4">
                    <Input id="trainer-assign-plan" label="Workout Plan Name" value={assignForm.plan} onChange={e => setAssignForm(f => ({ ...f, plan: e.target.value }))} placeholder="e.g. Fat Loss Starter - Week 1" />
                    <Input id="trainer-assign-start-date" label="Start Date" type="date" value={assignForm.startDate} onChange={e => setAssignForm(f => ({ ...f, startDate: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-3">
                        <Input id="trainer-assign-duration" label="Duration (weeks)" type="number" value={assignForm.durationWeeks} onChange={e => setAssignForm(f => ({ ...f, durationWeeks: e.target.value }))} />
                        <Input id="trainer-assign-days" label="Days / week" type="number" value={assignForm.daysPerWeek} onChange={e => setAssignForm(f => ({ ...f, daysPerWeek: e.target.value }))} />
                    </div>
                    <Select id="trainer-assign-difficulty" label="Difficulty" options={DIFFICULTY_OPTIONS} value={assignForm.difficulty} onChange={e => setAssignForm(f => ({ ...f, difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced' }))} />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setAssignOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleAssign}>Assign</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
