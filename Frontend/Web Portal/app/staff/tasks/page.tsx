"use client";

import { useEffect, useState } from "react";
import { staffAPI } from "@/lib/api";
import { Loader2, Wrench, BadgeCheck } from "lucide-react";

interface EquipmentItem {
    id: string;
    name: string;
    status: string;
    lastServicedAt?: string;
}

export default function StaffTasksPage() {
    const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                const response = await staffAPI.getEquipmentStatus();
                setEquipment(response.data.data || []);
            } catch (error) {
                console.error("Failed to load equipment tasks:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEquipment();
    }, []);

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
                <h1 className="text-3xl font-bold text-white">Daily Tasks</h1>
                <p className="text-zinc-400 mt-1">Monitor equipment health and prioritize maintenance.</p>
            </header>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 backdrop-blur-md overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Equipment Status</h2>
                    <span className="text-xs text-zinc-500">{equipment.length} items</span>
                </div>
                {equipment.length === 0 ? (
                    <div className="p-10 text-center text-zinc-500">No equipment data available.</div>
                ) : (
                    <div className="divide-y divide-zinc-800">
                        {equipment.map((item) => (
                            <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    {item.status === "maintenance" ? (
                                        <Wrench className="text-red-500" size={18} />
                                    ) : (
                                        <BadgeCheck className="text-emerald-400" size={18} />
                                    )}
                                    <div>
                                        <p className="text-sm font-semibold text-white">{item.name}</p>
                                        <p className="text-xs text-zinc-500">Status: {item.status}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-500">
                                    Last serviced: {item.lastServicedAt ? new Date(item.lastServicedAt).toLocaleDateString("en-LK") : "N/A"}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
