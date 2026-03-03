"use client";

import { useState, useEffect } from "react";
import { Wrench, AlertTriangle, Activity, RefreshCw } from "lucide-react";
import { staffAPI, getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader, Card, EmptyState, ErrorAlert, Badge, LoadingButton, ConfirmDialog } from "@/components/ui/SharedComponents";

interface Equipment {
    id: string;
    name: string;
    type: string;
    status: string;
    lastMaintained: string | null;
}

export default function StaffEquipmentPage() {
    const toast = useToast();
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [confirmTarget, setConfirmTarget] = useState<Equipment | null>(null);

    const fetchEquipment = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await staffAPI.getEquipmentStatus();
            setEquipmentList(res.data.data || []);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEquipment(); }, []);

    const handleReportIssue = async () => {
        if (!confirmTarget) return;
        setProcessingId(confirmTarget.id);
        setConfirmTarget(null);
        try {
            await staffAPI.reportEquipmentIssue(confirmTarget.id);
            toast.success("Issue reported", `${confirmTarget.name} has been flagged for maintenance.`);
            fetchEquipment();
        } catch (err) {
            toast.error("Failed to report", getErrorMessage(err));
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 page-enter">
                <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
                </div>
            </div>
        );
    }

    const active = equipmentList.filter((e) => e.status === "active");
    const maintenance = equipmentList.filter((e) => e.status !== "active");

    return (
        <div className="space-y-8 page-enter">
            <PageHeader
                title="Equipment Status"
                subtitle="View and report equipment issues"
                badge={maintenance.length > 0 ? `${maintenance.length} issues` : "All Clear"}
                badgeColor={maintenance.length > 0 ? "red" : "green"}
                actions={
                    <LoadingButton icon={RefreshCw} variant="secondary" onClick={fetchEquipment}>
                        Refresh
                    </LoadingButton>
                }
            />

            {error && <ErrorAlert message={error} onRetry={fetchEquipment} />}

            {equipmentList.length === 0 ? (
                <Card><EmptyState icon={Wrench} title="No equipment found" description="Equipment data is not available yet." /></Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-in">
                    {equipmentList.map((eq) => (
                        <Card key={eq.id} className={`relative overflow-hidden ${eq.status !== "active" ? "border-red-500/30" : ""}`}>
                            {eq.status !== "active" && <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500" />}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-semibold text-white">{eq.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
                                        {eq.type === "cardio" ? <Activity size={14} /> : <Wrench size={14} />}
                                        <span className="capitalize">{eq.type}</span>
                                    </div>
                                </div>
                                <Badge variant={eq.status === "active" ? "success" : "error"}>
                                    {eq.status === "active" ? "Active" : "Maintenance"}
                                </Badge>
                            </div>

                            <p className="text-xs text-zinc-500 mb-4">
                                Last Maintained: {eq.lastMaintained ? new Date(eq.lastMaintained).toLocaleDateString("en-LK") : "Never"}
                            </p>

                            {eq.status === "active" ? (
                                <LoadingButton
                                    loading={processingId === eq.id}
                                    variant="ghost"
                                    size="sm"
                                    icon={AlertTriangle}
                                    onClick={() => setConfirmTarget(eq)}
                                    className="w-full"
                                >
                                    Report Issue
                                </LoadingButton>
                            ) : (
                                <div className="w-full py-2 px-4 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center gap-2 text-sm font-medium">
                                    <Wrench size={14} /> Under Maintenance
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            <ConfirmDialog
                isOpen={!!confirmTarget}
                onClose={() => setConfirmTarget(null)}
                onConfirm={handleReportIssue}
                title="Report Equipment Issue"
                message={`Are you sure you want to report an issue for "${confirmTarget?.name}"? This will mark it as needing maintenance.`}
                confirmText="Report Issue"
                variant="warning"
            />
        </div>
    );
}
