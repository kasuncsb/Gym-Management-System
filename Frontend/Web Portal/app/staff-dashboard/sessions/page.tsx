"use client";

import { useEffect, useState } from "react";
import { Loader2, Calendar, Clock, User, FileText, Check, X, Play } from "lucide-react";
import { trainerAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

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

export default function TrainerSessionsPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
    const [notesModal, setNotesModal] = useState<{ sessionId: string; existing: string } | null>(null);
    const [noteText, setNoteText] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const res = await trainerAPI.getMySessions();
            let data: Session[] = res.data.data || [];
            if (filter === 'upcoming') data = data.filter(s => s.status === 'scheduled' || s.status === 'in_progress');
            else if (filter === 'completed') data = data.filter(s => s.status === 'completed');
            setSessions(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchSessions(); }, [filter]);

    const updateStatus = async (sessionId: string, status: string) => {
        try {
            await trainerAPI.updateSessionStatus(sessionId, status);
            fetchSessions();
        } catch (e) { console.error(e); }
    };

    const saveNotes = async () => {
        if (!notesModal) return;
        setSaving(true);
        try {
            await trainerAPI.addSessionNotes(notesModal.sessionId, { notes: noteText });
            setNotesModal(null);
            setNoteText('');
            fetchSessions();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const statusBadge = (status: string) => {
        const styles: Record<string, string> = {
            scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            in_progress: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            completed: 'bg-green-500/10 text-green-400 border-green-500/20',
            cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
            no_show: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
        };
        return <span className={cn('px-2 py-0.5 rounded-full text-xs border', styles[status] || styles.scheduled)}>{status.replace('_', ' ')}</span>;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div><h2 className="text-3xl font-bold text-white">My Sessions</h2><p className="text-zinc-400 mt-1">Manage your personal training sessions</p></div>

            <div className="flex gap-2">
                {(['upcoming', 'completed', 'all'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={cn('px-4 py-2 rounded-xl text-sm font-medium transition', filter === f ? 'bg-red-700 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white')}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-zinc-400" size={24} /></div>
            ) : sessions.length === 0 ? (
                <div className="text-center py-20"><Calendar className="mx-auto text-zinc-600 mb-4" size={48} /><p className="text-zinc-400">No sessions found</p></div>
            ) : (
                <div className="space-y-4">
                    {sessions.map(session => (
                        <div key={session.id} className="rounded-2xl border border-zinc-800 bg-black/40 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <User size={16} className="text-zinc-500" />
                                        <span className="text-white font-medium">{session.memberName || session.memberId.slice(0, 12)}</span>
                                        {statusBadge(session.status)}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                                        <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(session.sessionDate).toLocaleDateString('en-LK')}</span>
                                        <span className="flex items-center gap-1"><Clock size={14} /> {session.startTime} – {session.endTime}</span>
                                        {session.sessionType && <span>Type: {session.sessionType}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {session.status === 'scheduled' && (
                                        <>
                                            <button onClick={() => updateStatus(session.id, 'in_progress')} className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition" title="Start"><Play size={16} /></button>
                                            <button onClick={() => updateStatus(session.id, 'no_show')} className="p-2 rounded-lg bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20 transition" title="No Show"><X size={16} /></button>
                                        </>
                                    )}
                                    {session.status === 'in_progress' && (
                                        <button onClick={() => updateStatus(session.id, 'completed')} className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition" title="Complete"><Check size={16} /></button>
                                    )}
                                    <button onClick={() => { setNotesModal({ sessionId: session.id, existing: session.notes || '' }); setNoteText(session.notes || ''); }} className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition" title="Notes"><FileText size={16} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {notesModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-lg space-y-4">
                        <h3 className="text-lg font-semibold text-white">Session Notes</h3>
                        <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={5} className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" placeholder="Add notes about this session..." />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setNotesModal(null)} className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white transition">Cancel</button>
                            <button onClick={saveNotes} disabled={saving} className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50">{saving ? 'Saving...' : 'Save Notes'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
