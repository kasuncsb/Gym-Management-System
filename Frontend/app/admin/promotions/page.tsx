'use client';

import { useEffect, useState } from 'react';
import { Tag, Plus, Pencil } from 'lucide-react';
import { PageHeader, Card, Modal, Input, Select, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

interface Promotion {
    id: string;
    code: string;
    name: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    validFrom: string;
    validUntil: string;
    usageLimit: number | null;
    usageCount: number;
    active: boolean;
}

export default function AdminPromotionsPage() {
    const toast = useToast();
    const [promos, setPromos] = useState<Promotion[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Promotion | null>(null);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        code: '',
        name: '',
        discountType: 'percentage' as 'percentage' | 'fixed',
        discountValue: '',
        validFrom: '',
        validUntil: '',
        usageLimit: '',
    });

    const persistPromos = async (next: Promotion[]) => {
        await opsAPI.updateConfig({ promotions_json: JSON.stringify(next) });
        setPromos(next);
    };

    useEffect(() => {
        opsAPI.config()
            .then((rows) => {
                const raw = (rows ?? []).find((r) => r.key === 'promotions_json')?.value;
                if (!raw) return;
                try {
                    const parsed = JSON.parse(raw) as Promotion[];
                    if (Array.isArray(parsed)) setPromos(parsed);
                } catch {
                    // keep empty state if malformed
                }
            })
            .catch((err) => toast.error('Failed to load promotions', getErrorMessage(err)));
    }, []);

    const openAdd = () => {
        setEditing(null);
        setForm({ code: '', name: '', discountType: 'percentage', discountValue: '', validFrom: '', validUntil: '', usageLimit: '' });
        setModalOpen(true);
    };

    const openEdit = (p: Promotion) => {
        setEditing(p);
        setForm({
            code: p.code,
            name: p.name,
            discountType: p.discountType,
            discountValue: String(p.discountValue),
            validFrom: p.validFrom,
            validUntil: p.validUntil,
            usageLimit: p.usageLimit != null ? String(p.usageLimit) : '',
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.code.trim() || !form.name.trim() || !form.discountValue || !form.validFrom || !form.validUntil) {
            toast.error('Validation Error', 'Code, name, discount, and dates are required');
            return;
        }
        setLoading(true);
        try {
            let next: Promotion[];
            if (editing) {
                next = promos.map(p => p.id === editing.id
                    ? { ...p, ...form, discountValue: Number(form.discountValue), usageLimit: form.usageLimit ? Number(form.usageLimit) : null }
                    : p);
                toast.success('Promotion Updated', `${form.code} has been updated`);
            } else {
                next = [{
                    id: String(Date.now()),
                    code: form.code,
                    name: form.name,
                    discountType: form.discountType,
                    discountValue: Number(form.discountValue),
                    validFrom: form.validFrom,
                    validUntil: form.validUntil,
                    usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
                    usageCount: 0,
                    active: true,
                }, ...promos];
                toast.success('Promotion Added', `${form.code} has been added`);
            }
            await persistPromos(next);
            setModalOpen(false);
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const toggleActive = (p: Promotion) => {
        const next = promos.map((x) => x.id === p.id ? { ...x, active: !x.active } : x);
        persistPromos(next)
            .then(() => toast.success(p.active ? 'Disabled' : 'Enabled', `${p.code} has been ${p.active ? 'disabled' : 'enabled'}`))
            .catch((err) => toast.error('Error', getErrorMessage(err)));
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="Promotions"
                subtitle="Manage promo codes and discounts"
                action={
                    <LoadingButton icon={Plus} onClick={openAdd} size="md">
                        Add Promotion
                    </LoadingButton>
                }
            />

            <Card padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-700">
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Code</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Name</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Discount</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Valid</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Usage</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Status</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {promos.map(p => (
                                <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                    <td className="px-6 py-4 text-white font-mono font-semibold">{p.code}</td>
                                    <td className="px-6 py-4 text-zinc-400">{p.name}</td>
                                    <td className="px-6 py-4 text-zinc-400">
                                        {p.discountType === 'percentage' ? `${p.discountValue}%` : `Rs.${p.discountValue}`}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-400">{p.validFrom} – {p.validUntil}</td>
                                    <td className="px-6 py-4 text-zinc-400">{p.usageCount}{p.usageLimit != null ? ` / ${p.usageLimit}` : ''}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                                            {p.active ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex gap-2">
                                        <button onClick={() => openEdit(p)} className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-1">
                                            <Pencil size={14} /> Edit
                                        </button>
                                        <button onClick={() => toggleActive(p)} className="text-zinc-400 hover:text-white text-sm font-medium">
                                            {p.active ? 'Disable' : 'Enable'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Promotion' : 'Add Promotion'} size="md">
                <div className="space-y-4">
                    <Input id="promotions-code" label="Code" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="NEWYEAR25" required />
                    <Input id="promotions-name" label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="New Year 25% Off" required />
                    <Select
                        id="promotions-discount-type"
                        label="Discount Type"
                        options={[{ value: 'percentage', label: 'Percentage' }, { value: 'fixed', label: 'Fixed Amount' }]}
                        value={form.discountType}
                        onChange={e => setForm(f => ({ ...f, discountType: e.target.value as 'percentage' | 'fixed' }))}
                    />
                    <Input id="promotions-discount-value" label={form.discountType === 'percentage' ? 'Discount %' : 'Discount (Rs.)'} type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} required />
                    <Input id="promotions-valid-from" label="Valid From" type="date" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} required />
                    <Input id="promotions-valid-until" label="Valid Until" type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} required />
                    <Input id="promotions-usage-limit" label="Usage Limit (optional)" type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} placeholder="Leave empty for unlimited" />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setModalOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleSave}>{editing ? 'Save' : 'Add'}</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
