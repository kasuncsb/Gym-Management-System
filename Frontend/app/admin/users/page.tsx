'use client';

import { useState } from 'react';
import { Users, Plus, Pencil } from 'lucide-react';
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

type Role = 'member' | 'trainer' | 'manager' | 'admin';
type UserStatus = 'active' | 'inactive' | 'suspended';

interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    status: UserStatus;
    joined: string;
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

const initialUsers: User[] = [
    { id: 'PW-A001', name: 'Admin User', email: 'admin@powerworld.lk', role: 'admin', status: 'active', joined: '2023-01-01' },
    { id: 'PW-M001', name: 'Branch Manager', email: 'manager@powerworld.lk', role: 'manager', status: 'active', joined: '2023-06-01' },
    { id: 'PW-T001', name: 'Chathurika Silva', email: 'c.silva@powerworld.lk', role: 'trainer', status: 'active', joined: '2024-01-15' },
    { id: 'PW-T002', name: 'Isuru Bandara', email: 'i.bandara@powerworld.lk', role: 'trainer', status: 'active', joined: '2024-03-01' },
    { id: 'PW2025001', name: 'Nimal Perera', email: 'nimal.p@email.com', role: 'member', status: 'active', joined: '2025-01-05' },
    { id: 'PW2024087', name: 'Saman Jayasinghe', email: 'saman.j@email.com', role: 'member', status: 'suspended', joined: '2024-08-20' },
    { id: 'PW2025022', name: 'Gayani Fernando', email: 'gayani.f@email.com', role: 'member', status: 'active', joined: '2025-01-10' },
];

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
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({ name: '', email: '', role: 'member' as Role, status: 'active' as UserStatus });
    const [submitLoading, setSubmitLoading] = useState(false);

    const filtered = users.filter(u => {
        const matchS = u.name.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search) || u.email.includes(search);
        const matchR = roleFilter === 'all' || u.role === roleFilter;
        return matchS && matchR;
    });

    const openAdd = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', role: 'member', status: 'active' });
        setModalOpen(true);
    };

    const openEdit = (u: User) => {
        setEditingUser(u);
        setFormData({ name: u.name, email: u.email, role: u.role, status: u.status });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.email.trim()) {
            toast.error('Validation Error', 'Name and email are required');
            return;
        }
        setSubmitLoading(true);
        try {
            await new Promise(r => setTimeout(r, 600));
            if (editingUser) {
                setUsers(prev => prev.map(u => u.id === editingUser.id
                    ? { ...u, ...formData }
                    : u));
                toast.success('User Updated', `${formData.name} has been updated successfully`);
            } else {
                const newUser: User = {
                    id: `PW${Date.now().toString().slice(-6)}`,
                    ...formData,
                    joined: new Date().toISOString().split('T')[0],
                };
                setUsers(prev => [newUser, ...prev]);
                toast.success('User Added', `${formData.name} has been added successfully`);
            }
            setModalOpen(false);
        } catch {
            toast.error('Error', 'Failed to save user');
        } finally {
            setSubmitLoading(false);
        }
    };

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
                        <p className="text-2xl font-bold text-white">{users.filter(u => u.role === r).length}</p>
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
                                    <td className="px-5 py-4 text-zinc-400 text-sm">{u.joined}</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${roleColor[u.role]}`}>{u.role}</span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <Badge variant={statusVariant[u.status]}>{u.status}</Badge>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <button
                                            onClick={() => openEdit(u)}
                                            className="inline-flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
                                        >
                                            <Pencil size={14} /> Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div className="py-12 text-center text-zinc-500 text-sm">No users found.</div>
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
        </div>
    );
}
