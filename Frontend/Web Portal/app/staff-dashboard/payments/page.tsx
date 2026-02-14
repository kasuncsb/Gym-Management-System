"use client";

import { useEffect, useState } from "react";
import { Loader2, DollarSign, Search, Check } from "lucide-react";
import { paymentAPI, memberAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function StaffPaymentsPage() {
    const [todayRevenue, setTodayRevenue] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ memberId: '', subscriptionId: '', amount: '', paymentMethod: 'cash', paymentType: 'subscription', transactionRef: '', notes: '' });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        paymentAPI.getTodayRevenue()
            .then(res => setTodayRevenue(res.data.data?.todayRevenue || 0))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const res = await memberAPI.search(searchQuery);
            setSearchResults(res.data.data || []);
        } catch (e) { console.error(e); }
        finally { setSearching(false); }
    };

    const selectMember = (member: any) => {
        setForm({ ...form, memberId: member.id || member.memberId });
        setSearchResults([]);
        setSearchQuery(member.name || member.email || '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSuccess(false);
        try {
            const payload: Record<string, unknown> = {
                memberId: form.memberId,
                amount: form.amount,
                paymentMethod: form.paymentMethod,
                paymentType: form.paymentType,
            };
            if (form.subscriptionId) payload.subscriptionId = form.subscriptionId;
            if (form.transactionRef) payload.transactionRef = form.transactionRef;
            if (form.notes) payload.notes = form.notes;

            await paymentAPI.record(payload);
            setSuccess(true);
            setForm({ memberId: '', subscriptionId: '', amount: '', paymentMethod: 'cash', paymentType: 'subscription', transactionRef: '', notes: '' });
            setSearchQuery('');
            // Refresh revenue
            const rev = await paymentAPI.getTodayRevenue().catch(() => ({ data: { data: { todayRevenue: 0 } } }));
            setTodayRevenue(rev.data.data?.todayRevenue || 0);
        } catch (e) { console.error(e); }
        finally { setSubmitting(false); }
    };

    const formatCurrency = (amount: number) => `Rs. ${new Intl.NumberFormat('en-LK').format(amount)}`;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div><h2 className="text-3xl font-bold text-white">Record Payment</h2><p className="text-zinc-400 mt-1">Process member payments at the front desk</p></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl border border-zinc-800 bg-black/40">
                    <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-xl bg-green-500/10 text-green-400"><DollarSign size={20} /></div><span className="text-sm text-zinc-400">Today&apos;s Revenue</span></div>
                    <div className="text-3xl font-bold text-green-400">{loading ? '...' : formatCurrency(todayRevenue)}</div>
                </div>
            </div>

            {success && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
                    <Check size={18} /> Payment recorded successfully!
                </div>
            )}

            <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-black/40 p-6 space-y-4 max-w-2xl">
                {/* Member Search */}
                <div>
                    <label className="block text-sm text-zinc-400 mb-1">Member *</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); if (e.target.value.length >= 2) handleSearch(); }}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none"
                            placeholder="Search member by name or email..."
                        />
                        {searchResults.length > 0 && (
                            <div className="absolute top-full mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-lg z-10 max-h-48 overflow-y-auto">
                                {searchResults.map((m: any, i: number) => (
                                    <button key={i} type="button" onClick={() => selectMember(m)} className="w-full px-3 py-2 text-left text-white hover:bg-zinc-800 text-sm">
                                        {m.name || m.fullName} — {m.email}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {form.memberId && <p className="text-xs text-green-400 mt-1">Member selected: {form.memberId.slice(0, 12)}...</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm text-zinc-400 mb-1">Amount (LKR) *</label><input required type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" placeholder="5000" /></div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Payment Method</label>
                        <select value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none">
                            <option value="cash">Cash</option>
                            <option value="credit_card">Credit Card</option>
                            <option value="debit_card">Debit Card</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="online">Online</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Payment Type</label>
                        <select value={form.paymentType} onChange={e => setForm({...form, paymentType: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none">
                            <option value="subscription">Subscription</option>
                            <option value="pt_session">PT Session</option>
                            <option value="product">Product</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div><label className="block text-sm text-zinc-400 mb-1">Transaction Ref</label><input value={form.transactionRef} onChange={e => setForm({...form, transactionRef: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" /></div>
                </div>
                <div><label className="block text-sm text-zinc-400 mb-1">Notes</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none" /></div>
                <button type="submit" disabled={submitting || !form.memberId} className="px-6 py-2.5 bg-red-700 text-white rounded-xl hover:bg-red-600 transition font-medium disabled:opacity-50">
                    {submitting ? 'Processing...' : 'Record Payment'}
                </button>
            </form>
        </div>
    );
}
