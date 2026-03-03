"use client";

import { useEffect, useState } from "react";
import { DollarSign, Search, Check } from "lucide-react";
import { paymentAPI, memberAPI, getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader, Card, LoadingButton } from "@/components/ui/SharedComponents";
import { useDebounce } from "@/lib/hooks";

const inputClass = "w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all";

export default function StaffPaymentsPage() {
    const toast = useToast();
    const [todayRevenue, setTodayRevenue] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const debouncedSearch = useDebounce(searchQuery, 300);
    const [form, setForm] = useState({
        amount: "", paymentMethod: "cash", paymentType: "subscription",
        transactionRef: "", notes: "",
    });

    useEffect(() => {
        paymentAPI.getTodayRevenue()
            .then((res) => setTodayRevenue(res.data.data?.todayRevenue || 0))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (debouncedSearch.length < 2) { setSearchResults([]); return; }
        memberAPI.search(debouncedSearch)
            .then((res) => setSearchResults(res.data.data || []))
            .catch(() => {});
    }, [debouncedSearch]);

    const selectMember = (member: any) => {
        setSelectedMember(member);
        setSearchQuery(member.fullName || member.name || member.email);
        setSearchResults([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) {
            toast.warning("No member selected", "Search and select a member first.");
            return;
        }
        setSubmitting(true);
        try {
            const payload: Record<string, unknown> = {
                memberId: selectedMember.id || selectedMember.memberId,
                amount: form.amount,
                paymentMethod: form.paymentMethod,
                paymentType: form.paymentType,
            };
            if (form.transactionRef) payload.transactionRef = form.transactionRef;
            if (form.notes) payload.notes = form.notes;

            await paymentAPI.record(payload);
            toast.success("Payment recorded", `Rs. ${Number(form.amount).toLocaleString("en-LK")} from ${selectedMember.fullName || "N/A"}`);
            setForm({ amount: "", paymentMethod: "cash", paymentType: "subscription", transactionRef: "", notes: "" });
            setSelectedMember(null);
            setSearchQuery("");
            const rev = await paymentAPI.getTodayRevenue().catch(() => ({ data: { data: { todayRevenue: 0 } } }));
            setTodayRevenue(rev.data.data?.todayRevenue || 0);
        } catch (err) {
            toast.error("Payment failed", getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => `Rs. ${new Intl.NumberFormat("en-LK").format(amount)}`;

    return (
        <div className="space-y-8 page-enter">
            <PageHeader title="Record Payment" subtitle="Process member payments at the front desk" />

            {/* Revenue Card */}
            <Card className="max-w-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
                <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <DollarSign size={18} className="text-emerald-400" />
                        </div>
                        <span className="text-xs text-zinc-500 font-medium">Today&apos;s Revenue</span>
                    </div>
                    <span className="text-3xl font-bold text-emerald-400">
                        {loading ? <Skeleton className="h-9 w-40 inline-block" /> : formatCurrency(todayRevenue)}
                    </span>
                </div>
            </Card>

            {/* Payment Form */}
            <Card className="max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Member Search */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Member *</label>
                        <div className="relative">
                            <Search size={16} className="absolute left-4 top-3 text-zinc-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setSelectedMember(null); }}
                                className={inputClass + " pl-10"}
                                placeholder="Search member by name or email..."
                            />
                        </div>
                        {searchResults.length > 0 && (
                            <div className="absolute top-full mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-xl z-20 max-h-48 overflow-y-auto shadow-lg">
                                {searchResults.map((m: any, i: number) => (
                                    <button key={i} type="button" onClick={() => selectMember(m)} className="w-full px-4 py-2.5 text-left text-white hover:bg-zinc-800 text-sm transition-colors flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 font-bold text-xs shrink-0">{(m.fullName || m.name || "?").charAt(0)}</div>
                                        <div>
                                            <p className="font-medium">{m.fullName || m.name}</p>
                                            <p className="text-xs text-zinc-500">{m.email}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        {selectedMember && (
                            <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1"><Check size={12} /> Selected: {selectedMember.fullName || selectedMember.name}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Amount (LKR) *</label>
                            <input required type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass} placeholder="5000" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Payment Method</label>
                            <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className={inputClass}>
                                <option value="cash">Cash</option>
                                <option value="credit_card">Credit Card</option>
                                <option value="debit_card">Debit Card</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="online">Online</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Payment Type</label>
                            <select value={form.paymentType} onChange={(e) => setForm({ ...form, paymentType: e.target.value })} className={inputClass}>
                                <option value="subscription">Subscription</option>
                                <option value="pt_session">PT Session</option>
                                <option value="product">Product</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Transaction Ref</label>
                            <input value={form.transactionRef} onChange={(e) => setForm({ ...form, transactionRef: e.target.value })} className={inputClass} placeholder="Optional" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Notes</label>
                        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={inputClass + " resize-none"} placeholder="Optional payment notes" />
                    </div>
                    <div className="flex justify-end pt-4 border-t border-zinc-800">
                        <LoadingButton loading={submitting} disabled={selectedMember!} type="submit">
                            Record Payment
                        </LoadingButton>
                    </div>
                </form>
            </Card>
        </div>
    );
}
