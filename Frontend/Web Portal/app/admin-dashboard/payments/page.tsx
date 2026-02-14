"use client";

import { useEffect, useState } from "react";
import { Loader2, DollarSign, TrendingUp, Calendar, RefreshCw } from "lucide-react";
import { paymentAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Payment {
    id: string;
    memberId: string;
    subscriptionId: string | null;
    amount: string;
    paymentMethod: string;
    paymentType: string;
    transactionRef: string | null;
    status: string;
    paidAt: string;
    members?: { users?: { fullName: string; email: string } } | null;
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [todayRevenue, setTodayRevenue] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => { fetchData(); }, [page]);

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
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleRefund = async (paymentId: string) => {
        const reason = prompt('Refund reason:');
        if (!reason) return;
        try {
            await paymentAPI.refund(paymentId, reason);
            fetchData();
        } catch (e) { console.error(e); }
    };

    const formatCurrency = (amount: string | number) => `Rs. ${new Intl.NumberFormat('en-LK').format(typeof amount === 'string' ? parseFloat(amount) : amount)}`;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h2 className="text-3xl font-bold text-white">Payments</h2>
                <p className="text-zinc-400 mt-1">Track all payment transactions</p>
            </div>

            {/* Revenue Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl border border-zinc-800 bg-black/40">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-xl bg-green-500/10 text-green-400"><TrendingUp size={20} /></div>
                        <span className="text-sm text-zinc-400">Today&apos;s Revenue</span>
                    </div>
                    <div className="text-3xl font-bold text-green-400">{formatCurrency(todayRevenue)}</div>
                </div>
            </div>

            {/* Payments Table */}
            <div className="rounded-2xl border border-zinc-800 bg-black/40 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-red-500" size={32} /></div>
                ) : (
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
                                    <tr key={p.id} className="hover:bg-zinc-900/30">
                                        <td className="px-6 py-3 text-zinc-300">{new Date(p.paidAt).toLocaleDateString('en-LK')}</td>
                                        <td className="px-6 py-3 text-white">{(p as any).memberName || p.memberId.slice(0, 8)}</td>
                                        <td className="px-6 py-3 text-white font-medium">{formatCurrency(p.amount)}</td>
                                        <td className="px-6 py-3 text-zinc-300 capitalize">{p.paymentMethod.replace('_', ' ')}</td>
                                        <td className="px-6 py-3 text-zinc-300 capitalize">{p.paymentType.replace('_', ' ')}</td>
                                        <td className="px-6 py-3">
                                            <span className={cn("px-2 py-1 rounded-full text-xs border",
                                                p.status === 'completed' ? "text-green-400 border-green-500/20 bg-green-500/10" :
                                                p.status === 'refunded' ? "text-yellow-400 border-yellow-500/20 bg-yellow-500/10" :
                                                "text-zinc-400 border-zinc-600/20 bg-zinc-600/10"
                                            )}>{p.status}</span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            {p.status === 'completed' && (
                                                <button onClick={() => handleRefund(p.id)} className="p-1.5 text-zinc-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition" title="Refund">
                                                    <RefreshCw size={14} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 p-4 border-t border-zinc-800">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 transition">Prev</button>
                        <span className="text-sm text-zinc-500">Page {page} of {totalPages}</span>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 transition">Next</button>
                    </div>
                )}
            </div>
        </div>
    );
}
