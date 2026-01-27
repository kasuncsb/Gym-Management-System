'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
    isEmailVerified: boolean;
    createdAt: string;
}

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchUsers = async (pageNum: number) => {
        try {
            setLoading(true);
            const response = await adminAPI.getAllUsers(pageNum, 20);
            if (response.data.success) {
                setUsers(response.data.data);
                const pagination = response.data.pagination;
                if (pagination) {
                    setTotalPages(Math.ceil(pagination.total / pagination.limit));
                }
            } else {
                setError('Failed to load users');
            }
        } catch (err: any) {
            setError(err.message || 'Error loading users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(page);
    }, [page]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    User Management
                </h1>
                <button
                    onClick={() => fetchUsers(page)}
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
                                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Name</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Email</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Role</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Status</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Verified</th>
                                { /* <th className="text-right py-4 px-6 text-sm font-medium text-gray-400">Actions</th> */}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="border-b border-white/5 animate-pulse">
                                        <td className="py-4 px-6"><div className="h-4 bg-white/10 rounded w-32"></div></td>
                                        <td className="py-4 px-6"><div className="h-4 bg-white/10 rounded w-48"></div></td>
                                        <td className="py-4 px-6"><div className="h-4 bg-white/10 rounded w-20"></div></td>
                                        <td className="py-4 px-6"><div className="h-4 bg-white/10 rounded w-16"></div></td>
                                        <td className="py-4 px-6"><div className="h-4 bg-white/10 rounded w-16"></div></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-500">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="font-medium text-white">{user.fullName}</div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-400">{user.email}</td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                                                    user.role === 'manager' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                        user.role === 'staff' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                            user.role === 'trainer' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                                'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                ${user.isActive
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                    : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            {user.isEmailVerified ? (
                                                <span className="text-emerald-500 text-xs">Verified</span>
                                            ) : (
                                                <span className="text-amber-500 text-xs">Pending</span>
                                            )}
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
