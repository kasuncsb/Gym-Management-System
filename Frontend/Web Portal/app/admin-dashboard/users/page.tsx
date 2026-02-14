'use client';

import { useState, useEffect } from 'react';
import { adminAPI, getErrorMessage } from '@/lib/api';
import { Users, ChevronLeft, ChevronRight, Mail, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { PageHeader, Card, Badge, EmptyState } from '@/components/ui/SharedComponents';

interface User {
    id: string;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
    isEmailVerified: boolean;
    createdAt: string;
}

const ROLE_VARIANT: Record<string, "success" | "warning" | "error" | "default" | "info"> = {
    admin: "error",
    manager: "info",
    trainer: "success",
    staff: "warning",
    member: "default",
};

export default function AdminUsersPage() {
    const toast = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchUsers = async (pageNum: number) => {
        setLoading(true);
        try {
            const response = await adminAPI.getAllUsers(pageNum, 20);
            if (response.data.success) {
                setUsers(response.data.data);
                const pagination = response.data.pagination;
                if (pagination) {
                    setTotalPages(Math.ceil(pagination.total / pagination.limit));
                }
            }
        } catch (err) {
            toast.error("Failed to load users", getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(page); }, [page]);

    return (
        <div className="space-y-8 page-enter">
            <PageHeader
                title="User Management"
                subtitle="View and manage all system users"
            />

            <Card padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-800">
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider p-4">User</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider p-4 hidden md:table-cell">Email</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider p-4">Role</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider p-4">Status</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider p-4 hidden lg:table-cell">Verified</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} className="border-b border-zinc-800/50">
                                        <td className="p-4"><div className="flex items-center gap-3"><Skeleton className="w-10 h-10 rounded-full" /><Skeleton className="h-4 w-32" /></div></td>
                                        <td className="p-4 hidden md:table-cell"><Skeleton className="h-4 w-44" /></td>
                                        <td className="p-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                                        <td className="p-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                                        <td className="p-4 hidden lg:table-cell"><Skeleton className="h-4 w-16" /></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12">
                                        <EmptyState
                                            icon={<Users className="w-12 h-12 text-zinc-600" />}
                                            title="No users found"
                                            description="No users match the current criteria"
                                        />
                                    </td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white">
                                                    {user.fullName?.charAt(0) || '?'}
                                                </div>
                                                <span className="font-medium text-white">{user.fullName}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 hidden md:table-cell">
                                            <span className="text-sm text-zinc-400 flex items-center gap-1.5"><Mail size={12} className="text-zinc-500" /> {user.email}</span>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant={ROLE_VARIANT[user.role] || "default"}>{user.role}</Badge>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant={user.isActive ? "success" : "error"}>
                                                {user.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </td>
                                        <td className="p-4 hidden lg:table-cell">
                                            {user.isEmailVerified ? (
                                                <span className="flex items-center gap-1 text-xs text-emerald-400"><ShieldCheck size={12} /> Verified</span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs text-amber-400"><ShieldAlert size={12} /> Pending</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
                        <p className="text-sm text-zinc-500">Page {page} of {totalPages}</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
