"use client";

import { useEffect, useState } from "react";
import { managerAPI } from "@/lib/api";
import { Loader2, BadgeCheck, BadgeAlert } from "lucide-react";

interface StaffMember {
    id: string;
    employeeCode: string;
    name: string;
    email: string;
    designation: string;
    status: string;
    hireDate: string;
}

export default function ManagerStaffPage() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const response = await managerAPI.getStaffList();
                setStaff(response.data.data || []);
            } catch (error) {
                console.error("Failed to load staff list:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStaff();
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
                <h1 className="text-3xl font-bold text-white">Staff Directory</h1>
                <p className="text-zinc-400 mt-1">Overview of active team members across your branch.</p>
            </header>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 backdrop-blur-md overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 px-6 py-4 text-xs uppercase text-zinc-500 border-b border-zinc-800">
                    <span>Employee</span>
                    <span>Role</span>
                    <span>Contact</span>
                    <span>Hire Date</span>
                    <span>Status</span>
                </div>
                {staff.length === 0 ? (
                    <div className="p-10 text-center text-zinc-500">No staff records found.</div>
                ) : (
                    staff.map((member) => (
                        <div key={member.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 px-6 py-4 border-b border-zinc-800 text-sm text-zinc-300">
                            <div>
                                <p className="font-semibold text-white">{member.name}</p>
                                <p className="text-xs text-zinc-500">{member.employeeCode}</p>
                            </div>
                            <div>{member.designation || "Team Member"}</div>
                            <div>{member.email}</div>
                            <div>{new Date(member.hireDate).toLocaleDateString("en-LK")}</div>
                            <div className="flex items-center gap-2">
                                {member.status === "active" ? (
                                    <BadgeCheck size={16} className="text-emerald-400" />
                                ) : (
                                    <BadgeAlert size={16} className="text-yellow-400" />
                                )}
                                <span className="capitalize">{member.status}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
