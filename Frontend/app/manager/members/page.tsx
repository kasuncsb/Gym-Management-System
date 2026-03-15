'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { getErrorMessage, opsAPI } from '@/lib/api';

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

const statusVariant: Record<MemberStatus, 'success' | 'error' | 'warning' | 'default'> = {
    active: 'success',
    inactive: 'warning',
    suspended: 'error',
};


const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
];

export default function ManagerMembersPage() {
    const toast = useToast();
    const [members, setMembers] = useState<Member[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<MemberStatus | 'all'>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [planOptions, setPlanOptions] = useState<Array<{ value: string; label: string }>>([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        planId: '',
        status: 'active' as MemberStatus,
        trainerId: '',
    });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [trainerOptions, setTrainerOptions] = useState<Array<{ value: string; label: string }>>([{ value: '', label: 'No trainer' }]);

    const loadMembers = async () => {
        const [rows, visits, trainers, plans] = await Promise.all([
            opsAPI.members(),
            opsAPI.visits(500),
            opsAPI.trainers(),
            opsAPI.plans(),
        ]);
        const byPerson = new Map<string, number>();
        (visits ?? []).forEach((v: any) => byPerson.set(v.personId, (byPerson.get(v.personId) ?? 0) + 1));
        const trainerMap = new Map((trainers ?? []).map((t: any) => [t.id, t.fullName]));
        setTrainerOptions([{ value: '', label: 'No trainer' }, ...(trainers ?? []).map((t: any) => ({ value: t.id, label: t.fullName }))]);
        setPlanOptions((plans ?? []).map((p: any) => ({ value: p.id, label: p.name })));
        setMembers((rows ?? []).map((m: any) => ({
            id: m.id,
            name: m.fullName,
            plan: m.currentPlanName ?? 'Unassigned',
            joined: m.joinDate ? String(m.joinDate).slice(0, 10) : String(m.createdAt).slice(0, 10),
            status: (m.memberStatus ?? 'inactive') as MemberStatus,
            checkins: byPerson.get(m.id) ?? 0,
            trainerName: trainerMap.get(m.assignedTrainerId) ?? '—',
        })));
    };

    useEffect(() => {
        loadMembers().catch((err) => toast.error('Failed to load members', getErrorMessage(err)));
    }, []);

    const filtered = members.filter(m => {
        const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.id.includes(search);
        const matchStatus = filter === 'all' || m.status === filter;
        return matchSearch && matchStatus;
    });

    const openAdd = () => {
        setEditingMember(null);
        setFormData({ name: '', email: '', planId: planOptions[0]?.value ?? '', status: 'active', trainerId: '' });
        setModalOpen(true);
    };

    const openEdit = (m: Member) => {
        setEditingMember(m);
        setFormData({ name: m.name, email: '', planId: '', status: m.status, trainerId: '' });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error('Validation Error', 'Member name is required');
            return;
        }
        setSubmitLoading(true);
        try {
            if (editingMember) {
                await opsAPI.updateUser(editingMember.id, {
                    fullName: formData.name.trim(),
                    memberStatus: formData.status,
                    ...(formData.trainerId ? { assignedTrainerId: formData.trainerId } : {}),
                });
                toast.success('Member Updated', `${formData.name} has been updated successfully`);
            } else {
                if (!formData.email.trim() || !formData.email.includes('@')) {
                    toast.error('Validation Error', 'A valid email is required');
                    setSubmitLoading(false);
                    return;
                }
                await opsAPI.createUser({
                    fullName: formData.name.trim(),
                    email: formData.email.trim(),
                    role: 'member',
                    password: 'TempPass123!',
                });
                toast.success('Member Added', `${formData.name} has been added. Default password: TempPass123!`);
            }
            await loadMembers();
            setModalOpen(false);
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
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
                    id="manager-members-search"
                    value={search}
                    onChange={setSearch}
                    placeholder="Search by name or ID..."
                    className="flex-1 min-w-0"
                    aria-label="Search by name or ID"
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
                    {!editingMember && (
                        <Input
                            label="Email"
                            type="email"
                            placeholder="member@email.com"
                            value={formData.email}
                            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            required
                        />
                    )}
                    <Select
                        label="Status"
                        options={STATUS_OPTIONS}
                        value={formData.status}
                        onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as MemberStatus }))}
                    />
                    <Select
                        label="Assigned Trainer"
                        options={trainerOptions}
                        value={formData.trainerId}
                        onChange={e => setFormData(prev => ({ ...prev, trainerId: e.target.value }))}
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
