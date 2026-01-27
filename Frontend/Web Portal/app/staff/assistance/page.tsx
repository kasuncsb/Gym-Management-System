"use client";

import { useEffect, useState } from "react";
import { leadAPI } from "@/lib/api";
import { Loader2, PhoneCall, Mail, UserPlus } from "lucide-react";

interface Lead {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    status: string;
    source?: string;
    createdAt?: string;
}

export default function StaffAssistancePage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchLeads = async () => {
        try {
            const response = await leadAPI.list();
            setLeads(response.data.data || []);
        } catch (error) {
            console.error("Failed to load leads:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const updateStatus = async (leadId: string, status: string) => {
        try {
            setUpdatingId(leadId);
            await leadAPI.updateStatus(leadId, status);
            await fetchLeads();
        } catch (error) {
            console.error("Failed to update lead status:", error);
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-red-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
                <h1 className="text-3xl font-bold text-white">Lead Assistance</h1>
                <p className="text-zinc-400 mt-1">Track walk-ins and follow-ups assigned to staff.</p>
            </header>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 backdrop-blur-md overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <UserPlus size={18} className="text-red-500" />
                        <h2 className="text-lg font-semibold text-white">Open Leads</h2>
                    </div>
                    <span className="text-xs text-zinc-500">{leads.length} leads</span>
                </div>
                {leads.length === 0 ? (
                    <div className="p-10 text-center text-zinc-500">No leads available.</div>
                ) : (
                    <div className="divide-y divide-zinc-800">
                        {leads.map((lead) => (
                            <div key={lead.id} className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-white">{lead.name}</p>
                                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-400">
                                        {lead.email && (
                                            <span className="flex items-center gap-1">
                                                <Mail size={12} /> {lead.email}
                                            </span>
                                        )}
                                        {lead.phone && (
                                            <span className="flex items-center gap-1">
                                                <PhoneCall size={12} /> {lead.phone}
                                            </span>
                                        )}
                                        <span>Source: {lead.source || "walk_in"}</span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {["new", "contacted", "converted", "lost"].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => updateStatus(lead.id, status)}
                                            disabled={updatingId === lead.id}
                                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                                lead.status === status
                                                    ? "border-red-500 bg-red-500/10 text-red-400"
                                                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                                            }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
