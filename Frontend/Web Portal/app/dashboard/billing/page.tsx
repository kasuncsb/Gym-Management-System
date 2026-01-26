"use client";

import { CreditCard, Download, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const invoices = [
    {
        id: "INV-2025-001",
        date: "Jan 01, 2025",
        amount: "$49.99",
        status: "Paid",
        plan: "Premium Monthly"
    },
    {
        id: "INV-2024-012",
        date: "Dec 01, 2024",
        amount: "$49.99",
        status: "Paid",
        plan: "Premium Monthly"
    },
    {
        id: "INV-2024-011",
        date: "Nov 01, 2024",
        amount: "$49.99",
        status: "Paid",
        plan: "Premium Monthly"
    }
];

export default function BillingPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white">Billing & Subscription</h2>
                <p className="text-zinc-400 mt-1">Manage your plan and payment history</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Current Plan Card */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-900/40 via-black to-black border border-indigo-500/30 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-start gap-6">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wide mb-4">
                                    <CheckCircle size={12} /> Active Plan
                                </div>
                                <h3 className="text-4xl font-bold text-white mb-2">Premium Access</h3>
                                <p className="text-zinc-400 max-w-md">
                                    Unlimited access to all gym facilities, group classes, and spa recovery zones.
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-white">$49.99<span className="text-lg text-zinc-500 font-medium">/mo</span></p>
                                <p className="text-sm text-zinc-500 mt-1">Next billing: <span className="text-white">Feb 01, 2025</span></p>
                            </div>
                        </div>

                        <div className="relative z-10 mt-8 flex flex-wrap gap-4">
                            <button className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition shadow-lg shadow-white/10">
                                Upgrade Plan
                            </button>
                            <button className="px-6 py-3 bg-black/40 border border-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-800 transition">
                                Cancel Subscription
                            </button>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="p-6 rounded-2xl bg-black/40 border border-zinc-800 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white">Payment Method</h3>
                            <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">Edit</button>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                            <div className="w-12 h-8 rounded bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                <div className="flex gap-0.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80 -ml-1.5" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-medium">Mastercard ending in 8842</p>
                                <p className="text-xs text-zinc-500">Expires 12/28</p>
                            </div>
                            <CheckCircle size={20} className="text-green-500" />
                        </div>
                    </div>
                </div>

                {/* Invoice History */}
                <div className="lg:col-span-1">
                    <div className="p-6 rounded-2xl bg-black/40 border border-zinc-800 backdrop-blur-md h-full">
                        <h3 className="text-lg font-bold text-white mb-6">Billing History</h3>
                        <div className="space-y-4">
                            {invoices.map((inv) => (
                                <div key={inv.id} className="group p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-900/80 hover:border-zinc-700 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-white font-medium">{inv.amount}</p>
                                            <p className="text-xs text-zinc-500">{inv.date}</p>
                                        </div>
                                        <div className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-500/10 text-green-400 border border-green-500/20">
                                            {inv.status}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-800/50">
                                        <p className="text-xs text-zinc-500">{inv.plan}</p>
                                        <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
                                            <Download size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-2.5 text-sm font-medium text-zinc-400 hover:text-white border border-zinc-800 rounded-xl hover:bg-zinc-800 transition">
                            View All Invoices
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
