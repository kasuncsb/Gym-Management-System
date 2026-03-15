'use client';

import { useEffect, useMemo, useState } from 'react';
import { Users, Plus, Pencil, UserX } from 'lucide-react';
import {
    PageHeader,
    Card,
    SearchInput,
    Badge,
    LoadingButton,
    Modal,
    Input,
    Select,
} from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

type Role = 'member' | 'trainer' | 'manager' | 'admin';
type UserStatus = 'active' | 'inactive' | 'suspended';

interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    status: UserStatus;
    joined: string | null;
}

const roleColor: Record<Role, string> = {
    admin: 'text-purple-400 bg-purple-500/20',
    manager: 'text-blue-400 bg-blue-500/20',
    trainer: 'text-amber-400 bg-amber-500/20',
    member: 'text-emerald-400 bg-emerald-500/20',
};

const statusVariant: Record<UserStatus, 'success' | 'error' | 'warning' | 'default'> = {
    active: 'success',
    inactive: 'warning',
    suspended: 'error',
};

const ROLE_OPTIONS = [
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'trainer', label: 'Trainer' },
    { value: 'member', label: 'Member' },
];

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
];

export default function AdminUsersPage() {
    const toast = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({ name: '', email: '', role: 'member' as Role, status: 'active' as UserStatus, password: '' });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
    const [deactivateLoading, setDeactivateLoading] = useState(false);

    const loadUsers = async () => {
        const data = await opsAPI.users();
        const mapped: User[] = (data ?? []).map((u: any) => ({
            id: u.id,
            name: u.fullName,
            email: u.email,
            role: u.role,
            status: u.role === 'member'
                ? (u.memberStatus ?? 'inactive')
                : (u.isActive === false ? 'inactive' : 'active'),
            joined: u.joinDate ? String(u.joinDate).slice(0, 10) : (u.createdAt ? String(u.createdAt).slice(0, 10) : null),
        }));
        setUsers(mapped);
    };

    useEffect(() => {
        loadUsers()
            .catch((err) => toast.error('Failed to load users', getErrorMessage(err)))
            .finally(() => setPageLoading(false));
    }, []);

    const filtered = users.filter(u => {
        const matchS = u.name.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search) || u.email.includes(search);
        const matchR = roleFilter === 'all' || u.role === roleFilter;
        return matchS && matchR;
    });

    const openAdd = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', role: 'member', status: 'active', password: '' });
        setModalOpen(true);
    };

    const openEdit = (u: User) => {
        setEditingUser(u);
        setFormData({ name: u.name, email: u.email, role: u.role, status: u.status, password: '' });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.email.trim()) {
            toast.error('Validation Error', 'Name and email are required');
            return;
        }
        setSubmitLoading(true);
        try {
            if (editingUser) {
                await opsAPI.updateUser(editingUser.id, {
                    fullName: formData.name.trim(),
                    role: formData.role,
                    isActive: formData.status !== 'suspended',
                    ...(formData.role === 'member' ? { memberStatus: formData.status } : {}),
                });
                toast.success('User Updated', `${formData.name} has been updated successfully`);
            } else {
                if (formData.password.trim().length < 8) {
                    toast.error('Validation Error', 'Password must be at least 8 characters');
                    return;
                }
                await opsAPI.createUser({
                    fullName: formData.name.trim(),
                    email: formData.email.trim(),
                    role: formData.role,
                    password: formData.password.trim(),
                });
                toast.success('User Added', `${formData.name} has been added successfully`);
            }
            await loadUsers();
            setModalOpen(false);
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDeactivate = async () => {
        if (!deactivateTarget) return;
        setDeactivateLoading(true);
        try {
            await opsAPI.updateUser(deactivateTarget.id, { isActive: false });
            toast.success('User Deactivated', `${deactivateTarget.name} has been deactivated.`);
            setDeactivateTarget(null);
            await loadUsers();
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setDeactivateLoading(false);
        }
    };

    const roleCounts = useMemo(() => {
        return {
            admin: users.filter((u) => u.role === 'admin').length,
            manager: users.filter((u) => u.role === 'manager').length,
            trainer: users.filter((u) => u.role === 'trainer').length,
            member: users.filter((u) => u.role === 'member').length,
        };
    }, [users]);

    return (
        <div className="space-y-8">
            <PageHeader
                title="User Management"
                subtitle="Manage all system users — PowerWorld Kiribathgoda"
                action={
                    <LoadingButton icon={Plus} onClick={openAdd} size="md">
                        Add User
                    </LoadingButton>
                }
            />

            {/* Role summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(['admin', 'manager', 'trainer', 'member'] as Role[]).map(r => (
                    <Card key={r} padding="md" className="text-center hover:border-zinc-700/50 transition-colors">
                        <p className="text-2xl font-bold text-white">{roleCounts[r]}</p>
                        <p className={`text-xs font-semibold capitalize mt-1 ${roleColor[r].split(' ')[0]}`}>{r}s</p>
                    </Card>
                ))}
            </div>

            {/* Search + role filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <SearchInput
                    id="admin-users-search"
                    value={search}
                    onChange={setSearch}
                    placeholder="Search by name, ID or email..."
                    className="flex-1 min-w-0"
                    aria-label="Search by name, ID or email"
                />
                <div className="flex gap-2 flex-wrap">
                    {(['all', 'admin', 'manager', 'trainer', 'member'] as const).map(r => (
                        <button
                            key={r}
                            onClick={() => setRoleFilter(r as Role | 'all')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${roleFilter === r
                                ? 'bg-red-600 text-white border border-red-500'
                                : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                                }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <Card padding="none">
                <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase">
                                <th className="px-5 py-3 text-left">User</th>
                                <th className="px-5 py-3 text-left">Email</th>
                                <th className="px-5 py-3 text-left">Joined</th>
                                <th className="px-5 py-3 text-center">Role</th>
                                <th className="px-5 py-3 text-center">Status</th>
                                <th className="px-5 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((u, i) => (
                                <tr key={u.id} className={`border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors ${i === filtered.length - 1 ? 'border-none' : ''}`}>
                                    <td className="px-5 py-4">
                                        <p className="text-white text-sm font-semibold">{u.name}</p>
                                        <p className="text-zinc-500 text-xs">{u.id}</p>
                                    </td>
                                    <td className="px-5 py-4 text-zinc-400 text-sm">{u.email}</td>
                                    <td className="px-5 py-4 text-zinc-400 text-sm">{u.joined ?? '—'}</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${roleColor[u.role]}`}>{u.role}</span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <Badge variant={statusVariant[u.status]}>{u.status}</Badge>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => openEdit(u)}
                                                className="inline-flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
                                            >
                                                <Pencil size={14} /> Edit
                                            </button>
                                            {u.status !== 'inactive' && (
                                                <button
                                                    onClick={() => setDeactivateTarget(u)}
                                                    className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 font-medium transition-colors"
                                                >
                                                    <UserX size={14} /> Deactivate
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div className="py-12 text-center text-zinc-500 text-sm">{pageLoading ? 'Loading users...' : 'No users found.'}</div>
                )}
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingUser ? 'Edit User' : 'Add User'}
                description={editingUser ? `Editing ${editingUser.name}` : 'Create a new system user'}
                size="md"
            >
                <div className="space-y-4">
                    <Input
                        label="Full Name"
                        placeholder="Enter full name"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                    />
                    <Input
                        label="Email"
                        type="email"
                        placeholder="user@example.com"
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        disabled={!!editingUser}
                    />
                    <Select
                        label="Role"
                        options={ROLE_OPTIONS}
                        value={formData.role}
                        onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as Role }))}
                    />
                    <Select
                        label="Status"
                        options={STATUS_OPTIONS}
                        value={formData.status}
                        onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as UserStatus }))}
                    />
                    {!editingUser && (
                        <Input
                            label="Temporary Password"
                            type="password"
                            placeholder="Minimum 8 characters"
                            value={formData.password}
                            onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            required
                        />
                    )}
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </LoadingButton>
                        <LoadingButton loading={submitLoading} onClick={handleSubmit}>
                            {editingUser ? 'Save Changes' : 'Create User'}
                        </LoadingButton>
                    </div>
                </div>
            </Modal>
            {/* Deactivate Confirmation Modal */}
            <Modal
                isOpen={!!deactivateTarget}
                onClose={() => setDeactivateTarget(null)}
                title="Deactivate User"
                description={`Are you sure you want to deactivate ${deactivateTarget?.name}? They will no longer be able to log in.`}
                size="sm"
            >
                <div className="flex justify-end gap-3 pt-2">
                    <LoadingButton variant="secondary" onClick={() => setDeactivateTarget(null)}>Cancel</LoadingButton>
                    <LoadingButton variant="danger" loading={deactivateLoading} onClick={handleDeactivate}>
                        Deactivate
                    </LoadingButton>
                </div>
            </Modal>
        </div>
    );
}
