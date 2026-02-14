"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, RefreshCw } from "lucide-react";
import { paymentAPI, getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader, Card, EmptyState, ErrorAlert, Badge, Modal, LoadingButton } from "@/components/ui/SharedComponents";
import { cn } from "@/lib/utils";

interface Payment {
    id: string;
    memberId: string;
    memberName?: string;
    subscriptionId: string | null;
    amount: string;
    paymentMethod: string;
    paymentType: string;
    transactionRef: string | null;
    status: string;
    paidAt: string;
}

const formatCurrency = (amount: string | number) => `Rs. ${new Intl.NumberFormat("en-LK").format(typeof amount === "string" ? parseFloat(amount) : amount)}`;

export default function AdminPaymentsPage() {
    const toast = useToast();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [todayRevenue, setTodayRevenue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [refundModal, setRefundModal] = useState<Payment | null>(null);
    const [refundReason, setRefundReason] = useState("");
    const [refunding, setRefunding] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [paymentsRes, revenueRes] = await Promise.all([
                paymentAPI.getAll(page, 20),
                paymentAPI.getTodayRevenue().catch(() => ({ data: { data: { todayRevenue: 0 } } })),
            ]);
            setPayments(paymentsRes.data.data || []);
            setTotalPages(paymentsRes.data.meta?.totalPages || 1);
            setTodayRevenue(revenueRes.data.data?.todayRevenue || 0);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [page]);

    const handleRefund = async () => {
        if (!refundModal || !refundReason.trim()) return;
        setRefunding(true);
        try {
            await paymentAPI.refund(refundModal.id, refundReason);
            toast.success("Refund processed", `${formatCurrency(refundModal.amount)} has been refunded.`);
            setRefundModal(null);
            setRefundReason("");
            fetchData();
        } catch (err) {
            toast.error("Refund failed", getErrorMessage(err));
        } finally {
            setRefunding(false);
        }
    };

    if (loading && page === 1) {
        return (
            <div className="space-y-8 page-enter">
                <div className="space-y-2"><Skeleton className="h-8 w-40" /><Skeleton className="h-4 w-60" /></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Skeleton className="h-28 rounded-2xl" /></div>
                <Skeleton className="h-96 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-8 page-enter">
            <PageHeader title="Payments" subtitle="Track all payment transactions" />

            {error && <ErrorAlert message={error} onRetry={fetchData} />}

            {/* Revenue Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-xl bg-green-500/10 text-green-400"><TrendingUp size={20} /></div>
                        <span className="text-sm text-zinc-400">Today&apos;s Revenue</span>
                    </div>
                    <div className="text-3xl font-bold text-green-400">{formatCurrency(todayRevenue)}</div>
                </Card>
            </div>

            {/* Payments Table */}
            <Card padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-900/50 text-zinc-400 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Member</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Method</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {payments.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-zinc-500">No payments found.</td></tr>
                            ) : payments.map(p => (
                                <tr key={p.id} className="hover:bg-zinc-900/30 transition">
                                    <td className="px-6 py-3 text-zinc-300">{new Date(p.paidAt).toLocaleDateString("en-LK")}</td>
                                    <td className="px-6 py-3 text-white">{p.memberName || p.memberId.slice(0, 8)}</td>
                                    <td className="px-6 py-3 text-white font-medium">{formatCurrency(p.amount)}</td>
                                    <td className="px-6 py-3 text-zinc-300 capitalize">{p.paymentMethod.replace("_", " ")}</td>
                                    <td className="px-6 py-3 text-zinc-300 capitalize">{p.paymentType.replace("_", " ")}</td>
                                    <td className="px-6 py-3">
                                        <Badge variant={p.status === "completed" ? "success" : p.status === "refunded" ? "warning" : "default"}>{p.status}</Badge>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        {p.status === "completed" && (
                                            <button onClick={() => setRefundModal(p)} className="p-1.5 text-zinc-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition" title="Refund">
                                                <RefreshCw size={14} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 p-4 border-t border-zinc-800">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 transition">Prev</button>
                        <span className="text-sm text-zinc-500">Page {page} of {totalPages}</span>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 transition">Next</button>
                    </div>
                )}
            </Card>

            {/* Refund Modal (replaces prompt()) */}
            <Modal isOpen={!!refundModal} onClose={() => { setRefundModal(null); setRefundReason(""); }} title="Process Refund" description={`Refund ${refundModal ? formatCurrency(refundModal.amount) : ""} to member?`}>
                <div className="space-y-4">
                    <textarea
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all resize-none"
                        placeholder="Reason for refund..."
                        autoFocus
                    />
                    <div className="flex justify-end gap-3">
                        <button onClick={() => { setRefundModal(null); setRefundReason(""); }} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancel</button>
                        <LoadingButton loading={refunding} onClick={handleRefund} disabled={!refundReason.trim()} variant="danger">Process Refund</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
