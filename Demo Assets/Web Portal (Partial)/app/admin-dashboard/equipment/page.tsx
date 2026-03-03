"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Dumbbell, AlertTriangle, Wrench, Plus, X,
    CheckCircle2, Search
} from "lucide-react";
import { equipmentAPI, getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader, Card, Badge, EmptyState, Modal, LoadingButton, Tabs } from "@/components/ui/SharedComponents";
import { cn } from "@/lib/utils";

interface Equipment {
    id: string;
    name: string;
    category: string;
    branchId: string;
    status: string;
    purchaseDate?: string;
    warrantyExpiry?: string;
    lastMaintenanceDate?: string;
    notes?: string;
}

interface EquipmentIssue {
    id: string;
    equipmentId: string;
    equipmentName?: string;
    description: string;
    severity: string;
    status: string;
    reportedBy: string;
    createdAt: string;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "error" | "default"> = {
    operational: "success",
    maintenance: "warning",
    out_of_order: "error",
    retired: "default",
};

const SEVERITY_VARIANT: Record<string, "success" | "warning" | "error" | "default"> = {
    low: "default",
    medium: "warning",
    high: "error",
    critical: "error",
};

export default function AdminEquipmentPage() {
    const toast = useToast();
    const [tab, setTab] = useState("inventory");
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [issues, setIssues] = useState<EquipmentIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Add Equipment
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState({ name: "", category: "cardio", status: "operational", notes: "" });
    const [submitting, setSubmitting] = useState(false);

    // Report Issue
    const [issueTarget, setIssueTarget] = useState<Equipment | null>(null);
    const [issueForm, setIssueForm] = useState({ description: "", severity: "medium" });

    // Maintenance
    const [maintenanceTarget, setMaintenanceTarget] = useState<Equipment | null>(null);
    const [maintenanceForm, setMaintenanceForm] = useState({ maintenanceType: "routine", description: "", cost: "" });

    const fetchData = useCallback(async () => {
        try {
            const [equipRes, issuesRes] = await Promise.all([
                equipmentAPI.list(),
                equipmentAPI.getOpenIssues(),
            ]);
            setEquipment(equipRes.data.data || []);
            setIssues(issuesRes.data.data || []);
        } catch (err) {
            toast.error("Failed to load equipment", getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAddEquipment = async () => {
        if (!addForm.name.trim()) return;
        setSubmitting(true);
        try {
            await equipmentAPI.create(addForm);
            toast.success("Equipment added successfully");
            setShowAddModal(false);
            setAddForm({ name: "", category: "cardio", status: "operational", notes: "" });
            fetchData();
        } catch (err) {
            toast.error("Failed to add equipment", getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const handleReportIssue = async () => {
        if (!issueTarget || !issueForm.description.trim()) return;
        setSubmitting(true);
        try {
            await equipmentAPI.reportIssue(issueTarget.id, issueForm);
            toast.success("Issue reported", `Reported for ${issueTarget.name}`);
            setIssueTarget(null);
            setIssueForm({ description: "", severity: "medium" });
            fetchData();
        } catch (err) {
            toast.error("Failed to report issue", getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogMaintenance = async () => {
        if (!maintenanceTarget || !maintenanceForm.description.trim()) return;
        setSubmitting(true);
        try {
            await equipmentAPI.logMaintenance(maintenanceTarget.id, {
                ...maintenanceForm,
                cost: maintenanceForm.cost ? parseFloat(maintenanceForm.cost) : undefined,
            });
            toast.success("Maintenance logged", `Logged for ${maintenanceTarget.name}`);
            setMaintenanceTarget(null);
            setMaintenanceForm({ maintenanceType: "routine", description: "", cost: "" });
            fetchData();
        } catch (err) {
            toast.error("Failed to log maintenance", getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const filteredEquipment = equipment.filter(e => {
        const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || e.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const stats = {
        total: equipment.length,
        operational: equipment.filter(e => e.status === "operational").length,
        maintenance: equipment.filter(e => e.status === "maintenance").length,
        outOfOrder: equipment.filter(e => e.status === "out_of_order").length,
        openIssues: issues.length,
    };

    if (loading) {
        return (
            <div className="space-y-8 page-enter">
                <div className="space-y-2"><Skeleton className="h-8 w-40" /><Skeleton className="h-4 w-64" /></div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
            </div>
        );
    }

    const tabItems = [
        { id: "inventory", label: `Inventory (${equipment.length})` },
        { id: "issues", label: `Open Issues (${issues.length})` },
    ];

    return (
        <div className="space-y-8 page-enter">
            <PageHeader
                title="Equipment"
                subtitle="Manage gym equipment, report issues, and log maintenance"
                action={
                    <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition">
                        <Plus size={16} /> Add Equipment
                    </button>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: "Total", value: stats.total, color: "text-white" },
                    { label: "Operational", value: stats.operational, color: "text-emerald-400" },
                    { label: "Maintenance", value: stats.maintenance, color: "text-yellow-400" },
                    { label: "Out of Order", value: stats.outOfOrder, color: "text-red-400" },
                    { label: "Open Issues", value: stats.openIssues, color: "text-orange-400" },
                ].map(s => (
                    <Card key={s.label} padding="sm">
                        <p className="text-sm text-zinc-400 mb-1">{s.label}</p>
                        <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                    </Card>
                ))}
            </div>

            <Tabs tabs={tabItems} activeTab={tab} onChange={setTab} />

            {/* Inventory Tab */}
            {tab === "inventory" && (
                <>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search equipment..."
                                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600/50 transition"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600/50"
                        >
                            <option value="all">All Status</option>
                            <option value="operational">Operational</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="out_of_order">Out of Order</option>
                            <option value="retired">Retired</option>
                        </select>
                    </div>

                    {filteredEquipment.length === 0 ? (
                        <EmptyState
                            icon={<Dumbbell className="w-12 h-12 text-zinc-600" />}
                            title="No Equipment Found"
                            description={search || statusFilter !== "all" ? "Try adjusting your filters." : "Add equipment to get started."}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredEquipment.map(item => (
                                <Card key={item.id} className="hover:border-zinc-700 transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-zinc-800 text-zinc-300"><Dumbbell size={20} /></div>
                                            <div>
                                                <h4 className="font-semibold text-white">{item.name}</h4>
                                                <span className="text-xs text-zinc-500 capitalize">{item.category.replace("_", " ")}</span>
                                            </div>
                                        </div>
                                        <Badge variant={STATUS_VARIANT[item.status] || "default"}>{item.status.replace("_", " ")}</Badge>
                                    </div>

                                    {item.lastMaintenanceDate && (
                                        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                                            <Wrench size={12} /> Last maintenance: {new Date(item.lastMaintenanceDate).toLocaleDateString()}
                                        </div>
                                    )}

                                    {item.notes && <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{item.notes}</p>}

                                    <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800">
                                        <button
                                            onClick={() => { setIssueTarget(item); setIssueForm({ description: "", severity: "medium" }); }}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-orange-500/20 text-orange-400 hover:bg-orange-500/10 transition"
                                        >
                                            <AlertTriangle size={12} /> Report Issue
                                        </button>
                                        <button
                                            onClick={() => { setMaintenanceTarget(item); setMaintenanceForm({ maintenanceType: "routine", description: "", cost: "" }); }}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-500/20 text-blue-400 hover:bg-blue-500/10 transition"
                                        >
                                            <Wrench size={12} /> Maintenance
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Issues Tab */}
            {tab === "issues" && (
                <>
                    {issues.length === 0 ? (
                        <EmptyState
                            icon={<CheckCircle2 className="w-12 h-12 text-emerald-600" />}
                            title="No Open Issues"
                            description="All equipment is in good condition."
                        />
                    ) : (
                        <Card padding="none" className="overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-zinc-800">
                                            <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider p-4">Equipment</th>
                                            <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider p-4">Description</th>
                                            <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider p-4">Severity</th>
                                            <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider p-4">Status</th>
                                            <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider p-4">Reported</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {issues.map(issue => (
                                            <tr key={issue.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                                                <td className="p-4 text-white font-medium">{issue.equipmentName || issue.equipmentId.slice(0, 8)}</td>
                                                <td className="p-4 text-zinc-300 max-w-xs truncate">{issue.description}</td>
                                                <td className="p-4"><Badge variant={SEVERITY_VARIANT[issue.severity] || "default"}>{issue.severity}</Badge></td>
                                                <td className="p-4"><Badge variant="warning">{issue.status}</Badge></td>
                                                <td className="p-4 text-zinc-500 text-xs">{new Date(issue.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </>
            )}

            {/* Add Equipment Modal */}
            <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Equipment" size="md">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Name *</label>
                        <input
                            value={addForm.name}
                            onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600/50"
                            placeholder="e.g. Treadmill Pro X200"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Category</label>
                            <select value={addForm.category} onChange={e => setAddForm({ ...addForm, category: e.target.value })}
                                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-600/50">
                                <option value="cardio">Cardio</option><option value="strength">Strength</option>
                                <option value="free_weights">Free Weights</option><option value="machines">Machines</option>
                                <option value="flexibility">Flexibility</option><option value="accessories">Accessories</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Status</label>
                            <select value={addForm.status} onChange={e => setAddForm({ ...addForm, status: e.target.value })}
                                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-600/50">
                                <option value="operational">Operational</option><option value="maintenance">Maintenance</option>
                                <option value="out_of_order">Out of Order</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Notes</label>
                        <input value={addForm.notes} onChange={e => setAddForm({ ...addForm, notes: e.target.value })}
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600/50"
                            placeholder="Optional notes" />
                    </div>
                    <LoadingButton onClick={handleAddEquipment} loading={submitting} disabled={!addForm.name.trim()} className="w-full">
                        Add Equipment
                    </LoadingButton>
                </div>
            </Modal>

            {/* Report Issue Modal */}
            <Modal open={!!issueTarget} onClose={() => setIssueTarget(null)} title={`Report Issue — ${issueTarget?.name || ""}`} size="md">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Description *</label>
                        <textarea
                            value={issueForm.description}
                            onChange={e => setIssueForm({ ...issueForm, description: e.target.value })}
                            placeholder="Describe the issue..."
                            rows={3}
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600/50 resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Severity</label>
                        <select value={issueForm.severity} onChange={e => setIssueForm({ ...issueForm, severity: e.target.value })}
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-600/50">
                            <option value="low">Low</option><option value="medium">Medium</option>
                            <option value="high">High</option><option value="critical">Critical</option>
                        </select>
                    </div>
                    <LoadingButton onClick={handleReportIssue} loading={submitting} disabled={!issueForm.description.trim()} variant="danger" className="w-full">
                        Submit Report
                    </LoadingButton>
                </div>
            </Modal>

            {/* Maintenance Modal */}
            <Modal open={!!maintenanceTarget} onClose={() => setMaintenanceTarget(null)} title={`Log Maintenance — ${maintenanceTarget?.name || ""}`} size="md">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Type</label>
                        <select value={maintenanceForm.maintenanceType} onChange={e => setMaintenanceForm({ ...maintenanceForm, maintenanceType: e.target.value })}
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-600/50">
                            <option value="routine">Routine</option><option value="repair">Repair</option>
                            <option value="inspection">Inspection</option><option value="replacement">Parts Replacement</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Description *</label>
                        <textarea
                            value={maintenanceForm.description}
                            onChange={e => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                            placeholder="Maintenance details..."
                            rows={3}
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600/50 resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Cost (Rs.)</label>
                        <input type="number" value={maintenanceForm.cost} onChange={e => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })}
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600/50"
                            placeholder="Optional" />
                    </div>
                    <LoadingButton onClick={handleLogMaintenance} loading={submitting} disabled={!maintenanceForm.description.trim()} className="w-full">
                        Log Maintenance
                    </LoadingButton>
                </div>
            </Modal>
        </div>
    );
}
