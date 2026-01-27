'use client';

import { useState, useEffect } from 'react';
import { managerAPI } from '@/lib/api';
import { Mail, Phone, Calendar, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Member {
    id: string;
    fullName: string;
    email: string;
    memberCode: string;
    status: string; // active, inactive, etc.
    joinDate: string;
    phone?: string;
}

export default function ManagerMembersPage() {
    const router = useRouter();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchMembers = async (pageNum: number) => {
        try {
            setLoading(true);
            const response = await managerAPI.getBranchMembers(pageNum, 20);
            if (response.data.success) {
                setMembers(response.data.data);
                const pagination = response.data.pagination;
                if (pagination) {
                    setTotalPages(Math.ceil(pagination.total / pagination.limit));
                }
            } else {
                setError('Failed to load members');
            }
        } catch (err: any) {
            setError(err.message || 'Error loading members');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers(page);
    }, [page]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    Branch Members
                </h1>
                <button
                    onClick={() => fetchMembers(page)}
                    className="p-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"
                >
                    Refresh
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl">
                    {error}
                </div>
            )}

            <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Basic Info</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Contact</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Join Date</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="border-b border-white/5 animate-pulse">
                                        <td className="py-4 px-6"><div className="h-4 bg-white/10 rounded w-32 mb-2"></div><div className="h-3 bg-white/5 rounded w-20"></div></td>
                                        <td className="py-4 px-6"><div className="h-4 bg-white/10 rounded w-48"></div></td>
                                        <td className="py-4 px-6"><div className="h-4 bg-white/10 rounded w-24"></div></td>
                                        <td className="py-4 px-6"><div className="h-6 bg-white/10 rounded w-20"></div></td>
                                    </tr>
                                ))
                            ) : members.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-gray-500">
                                        No members found in this branch
                                    </td>
                                </tr>
                            ) : (
                                members.map((member) => (
                                    <tr key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-sm">
                                                    {member.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{member.fullName}</div>
                                                    <div className="text-xs text-gray-500">{member.memberCode}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                                    <Mail size={12} /> {member.email}
                                                </div>
                                                {member.phone && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                                        <Phone size={12} /> {member.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-400 text-sm">
                                            {new Date(member.joinDate).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                ${member.status === 'active'
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                    : member.status === 'pending'
                                                        ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                        : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : member.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                                                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="border-t border-white/5 p-4 flex justify-between items-center">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-400">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
