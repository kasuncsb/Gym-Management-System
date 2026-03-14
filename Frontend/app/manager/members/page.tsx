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

type MemberStatus = 'active' | 'inactive' | 'suspended';

interface Member {
    id: string;
    name: string;
    plan: string;
    joined: string;
    status: MemberStatus;
    checkins: number;
    trainerName: string;
}

const initialMembers: Member[] = [
    { id: 'PW2025001', name: 'Nimal Perera', plan: 'Premium', joined: '2025-01-05', status: 'active', checkins: 18, trainerName: 'Chathurika Silva' },
    { id: 'PW2025009', name: 'Chathurika Silva', plan: 'Elite', joined: '2024-11-12', status: 'active', checkins: 32, trainerName: 'Isuru Bandara' },
    { id: 'PW2024087', name: 'Saman Jayasinghe', plan: 'Basic', joined: '2024-08-20', status: 'inactive', checkins: 4, trainerName: '—' },
    { id: 'PW2025022', name: 'Gayani Fernando', plan: 'Premium', joined: '2025-01-10', status: 'active', checkins: 12, trainerName: 'Chathurika Silva' },
    { id: 'PW2025031', name: 'Thilini Wijesinghe', plan: 'Basic', joined: '2025-01-15', status: 'active', checkins: 6, trainerName: '—' },
    { id: 'PW2024066', name: 'Ruwan Jayawardena', plan: 'Annual Basic', joined: '2024-06-01', status: 'suspended', checkins: 0, trainerName: '—' },
];

const statusVariant: Record<MemberStatus, 'success' | 'error' | 'warning' | 'default'> = {
    active: 'success',
    inactive: 'warning',
    suspended: 'error',
};

const PLAN_OPTIONS = [
    { value: 'Basic', label: 'Basic' },
    { value: 'Premium', label: 'Premium' },
    { value: 'Elite', label: 'Elite' },
    { value: 'Annual Basic', label: 'Annual Basic' },
];

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
];

const TRAINER_OPTIONS = [
    { value: '—', label: 'No trainer' },
    { value: 'Chathurika Silva', label: 'Chathurika Silva' },
    { value: 'Isuru Bandara', label: 'Isuru Bandara' },
];

export default function ManagerMembersPage() {
    const toast = useToast();
    const [members, setMembers] = useState<Member[]>(initialMembers);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<MemberStatus | 'all'>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        plan: 'Basic',
        status: 'active' as MemberStatus,
        trainerName: '—',
    });
    const [submitLoading, setSubmitLoading] = useState(false);

    const filtered = members.filter(m => {
        const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.id.includes(search);
        const matchStatus = filter === 'all' || m.status === filter;
        return matchSearch && matchStatus;
    });

    const openAdd = () => {
        setEditingMember(null);
        setFormData({ name: '', plan: 'Basic', status: 'active', trainerName: '—' });
        setModalOpen(true);
    };

    const openEdit = (m: Member) => {
        setEditingMember(m);
        setFormData({ name: m.name, plan: m.plan, status: m.status, trainerName: m.trainerName });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error('Validation Error', 'Member name is required');
            return;
        }
        setSubmitLoading(true);
        try {
            await new Promise(r => setTimeout(r, 600));
            if (editingMember) {
                setMembers(prev => prev.map(m => m.id === editingMember.id
                    ? { ...m, ...formData }
                    : m));
                toast.success('Member Updated', `${formData.name} has been updated successfully`);
            } else {
                const newMember: Member = {
                    id: `PW${Date.now().toString().slice(-6)}`,
                    ...formData,
                    joined: new Date().toISOString().split('T')[0],
                    checkins: 0,
                };
                setMembers(prev => [newMember, ...prev]);
                toast.success('Member Added', `${formData.name} has been added successfully`);
            }
            setModalOpen(false);
        } catch {
            toast.error('Error', 'Failed to save member');
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="Member Management"
                subtitle="Overview of all gym members — PowerWorld Kiribathgoda"
                action={
                    <LoadingButton icon={Plus} onClick={openAdd} size="md">
                        Add Member
                    </LoadingButton>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Members', value: members.length, color: 'text-white' },
                    { label: 'Active', value: members.filter(m => m.status === 'active').length, color: 'text-emerald-400' },
                    { label: 'Inactive / Suspended', value: members.filter(m => m.status !== 'active').length, color: 'text-amber-400' },
                ].map(s => (
                    <Card key={s.label} padding="md" className="text-center hover:border-zinc-700/50 transition-colors">
                        <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-zinc-500 text-xs mt-1">{s.label}</p>
                    </Card>
                ))}
            </div>

            {/* Search + filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Search by name or ID..."
                    className="flex-1 min-w-0"
                />
                <div className="flex gap-2 flex-wrap">
                    {(['all', 'active', 'inactive', 'suspended'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${filter === f
                                ? 'bg-red-600 text-white border border-red-500'
                                : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <Card padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase">
                                <th className="px-5 py-3 text-left">Member</th>
                                <th className="px-5 py-3 text-left">Plan</th>
                                <th className="px-5 py-3 text-left">Joined</th>
                                <th className="px-5 py-3 text-left">Trainer</th>
                                <th className="px-5 py-3 text-center">Check-ins</th>
                                <th className="px-5 py-3 text-center">Status</th>
                                <th className="px-5 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((m, i) => (
                                <tr key={m.id} className={`border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors ${i === filtered.length - 1 ? 'border-none' : ''}`}>
                                    <td className="px-5 py-4">
                                        <p className="text-white text-sm font-semibold">{m.name}</p>
                                        <p className="text-zinc-500 text-xs">{m.id}</p>
                                    </td>
                                    <td className="px-5 py-4 text-zinc-300 text-sm">{m.plan}</td>
                                    <td className="px-5 py-4 text-zinc-400 text-sm">{m.joined}</td>
                                    <td className="px-5 py-4 text-zinc-400 text-sm">{m.trainerName}</td>
                                    <td className="px-5 py-4 text-center text-zinc-300 text-sm font-semibold">{m.checkins}</td>
                                    <td className="px-5 py-4 text-center">
                                        <Badge variant={statusVariant[m.status]}>{m.status}</Badge>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <button
                                            onClick={() => openEdit(m)}
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
                    <div className="py-12 text-center text-zinc-500 text-sm">No members found.</div>
                )}
            </Card>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingMember ? 'Edit Member' : 'Add Member'}
                description={editingMember ? `Editing ${editingMember.name}` : 'Add a new gym member'}
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
                    <Select
                        label="Plan"
                        options={PLAN_OPTIONS}
                        value={formData.plan}
                        onChange={e => setFormData(prev => ({ ...prev, plan: e.target.value }))}
                    />
                    <Select
                        label="Status"
                        options={STATUS_OPTIONS}
                        value={formData.status}
                        onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as MemberStatus }))}
                    />
                    <Select
                        label="Assigned Trainer"
                        options={TRAINER_OPTIONS}
                        value={formData.trainerName}
                        onChange={e => setFormData(prev => ({ ...prev, trainerName: e.target.value }))}
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </LoadingButton>
                        <LoadingButton loading={submitLoading} onClick={handleSubmit}>
                            {editingMember ? 'Save Changes' : 'Add Member'}
                        </LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
