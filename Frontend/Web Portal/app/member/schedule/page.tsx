"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock, Users, MapPin, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { trainerAPI, qrAPI, getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader, Card, EmptyState, ErrorAlert, Badge, LoadingButton, Tabs } from "@/components/ui/SharedComponents";

interface Session {
    id: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    sessionType: string;
    status: string;
    notes?: string;
    trainer?: { users?: { fullName: string } };
    trainerName?: string;
}

interface AttendanceRecord {
    id: string;
    scanTime: string;
    direction: string;
    authorized: boolean;
}

const statusConfig: Record<string, { variant: "success" | "warning" | "info" | "error" | "default"; label: string }> = {
    scheduled: { variant: "info", label: "Scheduled" },
    confirmed: { variant: "success", label: "Confirmed" },
    completed: { variant: "success", label: "Completed" },
    cancelled: { variant: "error", label: "Cancelled" },
    no_show: { variant: "warning", label: "No Show" },
};

const sessionTypeLabels: Record<string, string> = {
    personal_training: "Personal Training",
    group_session: "Group Session",
    consultation: "Consultation",
    assessment: "Assessment",
};

export default function SchedulePage() {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState("sessions");
    const [sessions, setSessions] = useState<Session[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sessRes, attRes] = await Promise.allSettled([
                trainerAPI.getMySessions(),
                qrAPI.getAttendanceHistory(14),
            ]);
            if (sessRes.status === "fulfilled") setSessions(sessRes.value.data.data || []);
            if (attRes.status === "fulfilled") setAttendance(attRes.value.data.data || []);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const cancelSession = async (sessionId: string) => {
        setCancellingId(sessionId);
        try {
            await trainerAPI.updateSessionStatus(sessionId, "cancelled", "Cancelled by member");
            toast.success("Session cancelled", "Your session has been cancelled.");
            fetchData();
        } catch (err) {
            toast.error("Failed to cancel", getErrorMessage(err));
        } finally {
            setCancellingId(null);
        }
    };

    const upcoming = sessions.filter((s) => s.status === "scheduled" || s.status === "confirmed");
    const past = sessions.filter((s) => s.status === "completed" || s.status === "cancelled" || s.status === "no_show");

    const tabs = [
        { key: "sessions", label: "Training Sessions", count: upcoming.length },
        { key: "attendance", label: "Attendance", count: attendance.length },
        { key: "history", label: "Past Sessions", count: past.length },
    ];

    if (loading) {
        return (
            <div className="space-y-8 page-enter">
                <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-72" /></div>
                <Skeleton className="h-12 w-full rounded-xl" />
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>
            </div>
        );
    }

    return (
        <div className="space-y-8 page-enter">
            <PageHeader
                title="Schedule"
                subtitle={`Today is ${new Date().toLocaleDateString("en-LK", { weekday: "long", month: "long", day: "numeric" })}`}
                badge={upcoming.length > 0 ? `${upcoming.length} upcoming` : undefined}
                badgeColor="blue"
            />

            {error && <ErrorAlert message={error} onRetry={fetchData} />}

            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            {/* Upcoming Training Sessions */}
            {activeTab === "sessions" && (
                <div className="space-y-4">
                    {upcoming.length === 0 ? (
                        <Card>
                            <EmptyState
                                icon={CalendarDays}
                                title="No upcoming sessions"
                                description="Book a session with a trainer to see it here."
                                action={
                                    <a href="/member/trainers" className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-xl text-sm hover:bg-red-600 transition">
                                        Browse Trainers
                                    </a>
                                }
                            />
                        </Card>
                    ) : (
                        <div className="stagger-in space-y-3">
                            {upcoming.map((s) => (
                                <Card key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center shrink-0">
                                            <span className="text-xs text-red-400 font-medium">
                                                {new Date(s.scheduledDate).toLocaleDateString("en-LK", { month: "short" })}
                                            </span>
                                            <span className="text-lg font-bold text-white leading-none">
                                                {new Date(s.scheduledDate).getDate()}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-semibold text-white">
                                                    {sessionTypeLabels[s.sessionType] || s.sessionType}
                                                </p>
                                                <Badge variant={statusConfig[s.status]?.variant || "default"}>
                                                    {statusConfig[s.status]?.label || s.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} /> {s.startTime} – {s.endTime}
                                                </span>
                                                {(s.trainer?.users?.fullName || s.trainerName) && (
                                                    <span className="flex items-center gap-1">
                                                        <Users size={12} /> {s.trainer?.users?.fullName || s.trainerName}
                                                    </span>
                                                )}
                                            </div>
                                            {s.notes && <p className="text-xs text-zinc-500 mt-1.5">{s.notes}</p>}
                                        </div>
                                    </div>
                                    <LoadingButton
                                        loading={cancellingId === s.id}
                                        variant="ghost"
                                        size="sm"
                                        icon={XCircle}
                                        onClick={() => cancelSession(s.id)}
                                    >
                                        Cancel
                                    </LoadingButton>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Attendance Tab */}
            {activeTab === "attendance" && (
                <Card padding="none" className="overflow-hidden">
                    {attendance.length === 0 ? (
                        <EmptyState icon={MapPin} title="No attendance records" description="Your gym check-ins will appear here." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-900/50 text-zinc-400 text-xs uppercase">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Date & Time</th>
                                        <th className="px-6 py-3 font-medium">Direction</th>
                                        <th className="px-6 py-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {attendance.map((a) => (
                                        <tr key={a.id} className="hover:bg-zinc-900/30 transition-colors">
                                            <td className="px-6 py-3 text-white">
                                                {new Date(a.scanTime).toLocaleString("en-LK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                            </td>
                                            <td className="px-6 py-3">
                                                <Badge variant={a.direction === "entry" ? "success" : "default"}>
                                                    {a.direction === "entry" ? "Check In" : "Check Out"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-3">
                                                {a.authorized ? (
                                                    <span className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle2 size={14} /> Authorized</span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-red-400 text-xs"><AlertCircle size={14} /> Denied</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {/* Past Sessions Tab */}
            {activeTab === "history" && (
                <div className="space-y-3">
                    {past.length === 0 ? (
                        <Card><EmptyState icon={CalendarDays} title="No past sessions" description="Your completed sessions will appear here." /></Card>
                    ) : (
                        past.map((s) => (
                            <Card key={s.id} className="flex items-center justify-between gap-4 opacity-75">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-zinc-800/50 border border-zinc-700/50 flex flex-col items-center justify-center shrink-0">
                                        <span className="text-[10px] text-zinc-500">{new Date(s.scheduledDate).toLocaleDateString("en-LK", { month: "short" })}</span>
                                        <span className="text-sm font-bold text-zinc-400">{new Date(s.scheduledDate).getDate()}</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-zinc-300">{sessionTypeLabels[s.sessionType] || s.sessionType}</p>
                                        <p className="text-xs text-zinc-500">{s.startTime} – {s.endTime} {s.trainer?.users?.fullName ? `· ${s.trainer.users.fullName}` : ""}</p>
                                    </div>
                                </div>
                                <Badge variant={statusConfig[s.status]?.variant || "default"}>
                                    {statusConfig[s.status]?.label || s.status}
                                </Badge>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
