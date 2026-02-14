"use client";

import { useEffect, useState } from "react";
import { memberAPI } from "@/lib/api";
import { Search, Filter, MoreHorizontal, User, Shield, Phone, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Member {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    phone?: string;
    joinDate?: string;
}

import { useAuth } from "@/context/AuthContext";

export default function MembersPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter(); // Ensure useRouter is imported (it is)
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
                return;
            }

            const isAdmin = user.role === 'admin';
            const isManager = user.role === 'manager';

            if (!isAdmin && !isManager) {
                if (user.role === 'member') {
                    router.push('/member');
                } else {
                    router.push('/staff-dashboard');
                }
                return;
            }

            fetchMembers();
        }
    }, [user, authLoading, router]);

    const fetchMembers = async () => {
        try {
            setIsLoading(true);
            const response = await memberAPI.getAll();
            // Assuming response structure: { data: { members: [...] } } or similar
            // Adjust based on actual API response
            const data = response.data.data || [];
            setMembers(data);
        } catch (error) {
            console.error("Failed to fetch members:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            fetchMembers();
            return;
        }

        try {
            setIsLoading(true);
            const response = await memberAPI.search(searchQuery);
            const data = response.data.data || [];
            setMembers(data);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Members</h2>
                    <p className="text-zinc-400 mt-1">Manage gym members and staff</p>
                </div>
                <button className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-700 shadow-lg shadow-red-600/20 transition font-medium">
                    Add New Member
                </button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex-1 relative group">
                    <Search className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-red-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search members by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all backdrop-blur-sm"
                    />
                </form>
                <div className="flex gap-3">
                    <button className="px-4 py-2.5 bg-black/40 border border-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-800 transition flex items-center gap-2 backdrop-blur-sm">
                        <Filter size={18} />
                        <span>Filter</span>
                    </button>
                </div>
            </div>

            {/* Members Table */}
            <div className="rounded-2xl border border-zinc-800 bg-black/40 backdrop-blur-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-900/50 text-zinc-400 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Member</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {isLoading ? (
                                // Loading Skeleton
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-10 w-32 bg-zinc-800 rounded-lg"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 w-16 bg-zinc-800 rounded-full"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 w-20 bg-zinc-800 rounded-lg"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 w-24 bg-zinc-800 rounded-lg"></div></td>
                                        <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-zinc-800 rounded-lg ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : members.length > 0 ? (
                                members.map((member) => (
                                    <tr key={member.id} className="group hover:bg-zinc-900/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-red-600/10 flex items-center justify-center text-red-500 font-bold border border-red-600/20 group-hover:border-red-600/50 transition-colors">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{member.name}</div>
                                                    <div className="text-xs text-zinc-500">{member.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-full text-xs font-medium border",
                                                member.status === 'active'
                                                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                    : "bg-red-500/10 text-red-400 border-red-500/20"
                                            )}>
                                                {member.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-zinc-300">
                                                <Shield size={14} className="text-zinc-500" />
                                                <span className="capitalize">{member.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {member.phone && (
                                                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                                                        <Phone size={12} /> {member.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                        No members found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
