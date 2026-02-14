"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, User, FileText, Check, X, Play } from "lucide-react";
import { trainerAPI, getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader, Card, EmptyState, Badge, Modal, LoadingButton, Tabs } from "@/components/ui/SharedComponents";

interface Session {
    id: string;
    memberId: string;
    memberName?: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    status: string;
    sessionType?: string;
    notes?: string;
}

const statusConfig: Record<string, { variant: "success" | "warning" | "info" | "error" | "default"; label: string }> = {
    scheduled: { variant: "info", label: "Scheduled" },
    in_progress: { variant: "warning", label: "In Progress" },
    completed: { variant: "success", label: "Completed" },
    cancelled: { variant: "error", label: "Cancelled" },
    no_show: { variant: "default", label: "No Show" },
};

export default function TrainerSessionsPage() {
    const toast = useToast();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("upcoming");
    const [notesModal, setNotesModal] = useState<Session | null>(null);
    const [noteText, setNoteText] = useState("");
    const [saving, setSaving] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const res = await trainerAPI.getMySessions();
            setSessions(res.data.data || []);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSessions(); }, []);

    const filtered = sessions.filter((s) => {
        if (filter === "upcoming") return s.status === "scheduled" || s.status === "in_progress";
        if (filter === "completed") return s.status === "completed";
        return true;
    });

    const updateStatus = async (sessionId: string, status: string) => {
        setUpdatingId(sessionId);
        try {
            await trainerAPI.updateSessionStatus(sessionId, status);
            toast.success("Status updated", `Session marked as ${status.replace("_", " ")}`);
            fetchSessions();
        } catch (err) {
            toast.error("Update failed", getErrorMessage(err));
        } finally {
            setUpdatingId(null);
        }
    };

    const saveNotes = async () => {
        if (!notesModal) return;
        setSaving(true);
        try {
            await trainerAPI.addSessionNotes(notesModal.id, { notes: noteText });
            toast.success("Notes saved", "Session notes have been updated.");
            setNotesModal(null);
            fetchSessions();
        } catch (err) {
            toast.error("Failed to save", getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { key: "upcoming", label: "Upcoming", count: sessions.filter((s) => s.status === "scheduled" || s.status === "in_progress").length },
        { key: "completed", label: "Completed", count: sessions.filter((s) => s.status === "completed").length },
        { key: "all", label: "All", count: sessions.length },
    ];

    if (loading) {
        return (
            <div className="space-y-8 page-enter">
                <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64" /></div>
                <Skeleton className="h-12 w-full rounded-xl" />
                <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
            </div>
        );
    }

    return (
        <div className="space-y-8 page-enter">
            <PageHeader title="My Sessions" subtitle="Manage your personal training sessions" />

            <Tabs tabs={tabs} activeTab={filter} onChange={setFilter} />

            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

            {filtered.length === 0 ? (
                <Card><EmptyState icon={Calendar} title="No sessions found" description={`No ${filter} sessions at the moment.`} /></Card>
            ) : (
                <div className="space-y-3 stagger-in">
                    {filtered.map((session) => (
                        <Card key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center shrink-0">
                                    <span className="text-[10px] text-blue-400">{new Date(session.sessionDate).toLocaleDateString("en-LK", { month: "short" })}</span>
                                    <span className="text-sm font-bold text-white leading-none">{new Date(session.sessionDate).getDate()}</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <User size={14} className="text-zinc-500" />
                                        <span className="text-white font-medium">{session.memberName || session.memberId.slice(0, 12)}</span>
                                        <Badge variant={statusConfig[session.status]?.variant || "default"}>{statusConfig[session.status]?.label || session.status}</Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-zinc-500 mt-1">
                                        <span className="flex items-center gap-1"><Clock size={12} /> {session.startTime} – {session.endTime}</span>
                                        {session.sessionType && <span className="capitalize">{session.sessionType.replace("_", " ")}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {session.status === "scheduled" && (
                                    <>
                                        <button
                                            onClick={() => updateStatus(session.id, "in_progress")}
                                            disabled={updatingId === session.id}
                                            className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition disabled:opacity-50"
                                            title="Start"
                                        >
                                            <Play size={16} />
                                        </button>
                                        <button
                                            onClick={() => updateStatus(session.id, "no_show")}
                                            disabled={updatingId === session.id}
                                            className="p-2 rounded-lg bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20 transition disabled:opacity-50"
                                            title="No Show"
                                        >
                                            <X size={16} />
                                        </button>
                                    </>
                                )}
                                {session.status === "in_progress" && (
                                    <button
                                        onClick={() => updateStatus(session.id, "completed")}
                                        disabled={updatingId === session.id}
                                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50"
                                        title="Complete"
                                    >
                                        <Check size={16} />
                                    </button>
                                )}
                                <button
                                    onClick={() => { setNotesModal(session); setNoteText(session.notes || ""); }}
                                    className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition"
                                    title="Notes"
                                >
                                    <FileText size={16} />
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Notes Modal */}
            <Modal isOpen={!!notesModal} onClose={() => setNotesModal(null)} title="Session Notes" description={`Notes for ${notesModal?.memberName || "session"}`}>
                <div className="space-y-4">
                    <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        rows={5}
                        className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all resize-none"
                        placeholder="Add session notes, progress updates, exercises performed..."
                    />
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setNotesModal(null)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancel</button>
                        <LoadingButton loading={saving} onClick={saveNotes}>Save Notes</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
