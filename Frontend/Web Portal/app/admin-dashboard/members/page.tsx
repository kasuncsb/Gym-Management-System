"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Search, ChevronLeft, ChevronRight, Mail, Phone, Shield, Eye } from "lucide-react";
import { memberAPI, getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader, Card, Badge, EmptyState, Modal, Tabs } from "@/components/ui/SharedComponents";
import { useDebounce } from "@/lib/hooks";

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: string;
    status: string;
    createdAt: string;
    subscriptionStatus?: string;
}

const statusVariant = (s: string): "success" | "warning" | "error" | "default" => {
    switch (s?.toLowerCase()) {
        case "active": return "success";
        case "pending": case "frozen": return "warning";
        case "inactive": case "expired": case "cancelled": return "error";
        default: return "default";
    }
};

const formatDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function AdminMembersPage() {
    const toast = useToast();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

    const debouncedSearch = useDebounce(searchQuery, 400);

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            if (debouncedSearch.length >= 2) {
                const res = await memberAPI.search(debouncedSearch);
                const data = res.data?.data || res.data || [];
                setMembers(Array.isArray(data) ? data : []);
                setTotalPages(1);
            } else {
                const status = statusFilter !== "all" ? statusFilter : undefined;
                const res = await memberAPI.getAll(page, 20, status);
                const data = res.data?.data || res.data || {};
                setMembers(data.members || data.items || data.data || []);
                setTotalPages(data.totalPages || data.pagination?.totalPages || 1);
            }
        } catch (err) {
            toast.error("Failed to load members", getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, statusFilter]);

    useEffect(() => { fetchMembers(); }, [fetchMembers]);

    useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

    const statusTabs = [
        { id: "all", label: "All" },
        { id: "active", label: "Active" },
        { id: "pending", label: "Pending" },
        { id: "inactive", label: "Inactive" },
    ];

    return (
        <div className="space-y-8 page-enter">
            <PageHeader
                title="Members"
                subtitle="Manage all gym members"
                action={
                    <button
                        onClick={() => toast.info("Coming soon", "Member registration from admin panel will be available in a future update.")}
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition"
                    >
                        Add New Member
                    </button>
                }
            />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative flex-1 max-w-md w-full">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition"
                    />
                </div>
                <Tabs tabs={statusTabs} activeTab={statusFilter} onChange={setStatusFilter} />
            </div>

            <Card padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-800">
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider p-4">Member</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider p-4 hidden md:table-cell">Contact</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider p-4 hidden lg:table-cell">Joined</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider p-4">Status</th>
                                <th className="text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} className="border-b border-zinc-800/50">
                                        <td className="p-4"><div className="flex items-center gap-3"><Skeleton className="w-10 h-10 rounded-full" /><div className="space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div></td>
                                        <td className="p-4 hidden md:table-cell"><Skeleton className="h-4 w-40" /></td>
                                        <td className="p-4 hidden lg:table-cell"><Skeleton className="h-4 w-24" /></td>
                                        <td className="p-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                                        <td className="p-4 text-right"><Skeleton className="h-8 w-8 rounded-lg ml-auto" /></td>
                                    </tr>
                                ))
                            ) : members.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12">
                                        <EmptyState
                                            icon={<Users className="w-12 h-12 text-zinc-600" />}
                                            title="No members found"
                                            description={searchQuery ? "Try adjusting your search query" : "No members match the selected filter"}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                members.map((m) => (
                                    <tr key={m.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white">
                                                    {m.firstName?.[0]}{m.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{m.firstName} {m.lastName}</p>
                                                    <p className="text-xs text-zinc-500">{m.role || "member"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 hidden md:table-cell">
                                            <div className="space-y-0.5 text-sm">
                                                <p className="text-zinc-300 flex items-center gap-1.5"><Mail size={12} className="text-zinc-500" /> {m.email}</p>
                                                {m.phone && <p className="text-zinc-500 flex items-center gap-1.5"><Phone size={12} /> {m.phone}</p>}
                                            </div>
                                        </td>
                                        <td className="p-4 hidden lg:table-cell text-sm text-zinc-400">
                                            {m.createdAt ? formatDate(m.createdAt) : "—"}
                                        </td>
                                        <td className="p-4">
                                            <Badge variant={statusVariant(m.status || m.subscriptionStatus || "")}>
                                                {m.status || m.subscriptionStatus || "unknown"}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => setSelectedMember(m)}
                                                className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition"
                                                title="View details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
                        <p className="text-sm text-zinc-500">Page {page} of {totalPages}</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page <= 1}
                                className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page >= totalPages}
                                className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Member Detail Modal */}
            <Modal open={!!selectedMember} onClose={() => setSelectedMember(null)} title="Member Details" size="md">
                {selectedMember && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl font-bold text-white">
                                {selectedMember.firstName?.[0]}{selectedMember.lastName?.[0]}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{selectedMember.firstName} {selectedMember.lastName}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={statusVariant(selectedMember.status || "")}>
                                        {selectedMember.status || "unknown"}
                                    </Badge>
                                    <span className="text-xs text-zinc-500 flex items-center gap-1"><Shield size={10} /> {selectedMember.role || "member"}</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { label: "Email", value: selectedMember.email },
                                { label: "Phone", value: selectedMember.phone || "—" },
                                { label: "Joined", value: selectedMember.createdAt ? formatDate(selectedMember.createdAt) : "—" },
                                { label: "ID", value: selectedMember.id },
                            ].map((item) => (
                                <div key={item.label} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                                    <p className="text-xs text-zinc-500 mb-1">{item.label}</p>
                                    <p className="text-sm font-medium text-white truncate">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
