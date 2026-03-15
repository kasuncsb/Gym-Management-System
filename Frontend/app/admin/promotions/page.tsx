'use client';

import { useEffect, useState } from 'react';
import { Tag, Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { PageHeader, Card, Modal, Input, Select, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

interface Promotion {
    id: string;
    code: string;
    name: string;
    discountType: 'percentage' | 'fixed';
    discountValue: string | number;
    validFrom: string;
    validUntil: string | null;
    isActive: boolean;
    usedCount: number;
}

const emptyForm = {
    code: '',
    name: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    validFrom: '',
    validUntil: '',
};

export default function AdminPromotionsPage() {
    const toast = useToast();
    const [promos, setPromos] = useState<Promotion[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Promotion | null>(null);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [form, setForm] = useState(emptyForm);

    const loadPromos = () =>
        opsAPI.promotions()
            .then(data => setPromos(data as Promotion[]))
            .catch(err => toast.error('Failed to load promotions', getErrorMessage(err)))
            .finally(() => setPageLoading(false));

    useEffect(() => { loadPromos(); }, []);

    const openAdd = () => {
        setEditing(null);
        setForm(emptyForm);
        setModalOpen(true);
    };

    const openEdit = (p: Promotion) => {
        setEditing(p);
        setForm({
            code: p.code,
            name: p.name,
            discountType: p.discountType,
            discountValue: String(p.discountValue),
            validFrom: p.validFrom ? String(p.validFrom).slice(0, 10) : '',
            validUntil: p.validUntil ? String(p.validUntil).slice(0, 10) : '',
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.code.trim() || !form.name.trim() || !form.discountValue || !form.validFrom) {
            toast.error('Validation Error', 'Code, name, discount, and valid-from date are required');
            return;
        }
        setLoading(true);
        try {
            const payload = {
                code: form.code.toUpperCase().trim(),
                name: form.name,
                discountType: form.discountType,
                discountValue: Number(form.discountValue),
                validFrom: form.validFrom,
                validUntil: form.validUntil || undefined,
            };
            if (editing) {
                await opsAPI.updatePromotion(editing.id, payload);
                toast.success('Promotion Updated', `${payload.code} has been updated`);
            } else {
                await opsAPI.createPromotion(payload);
                toast.success('Promotion Added', `${payload.code} has been created`);
            }
            await loadPromos();
            setModalOpen(false);
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const toggleActive = async (p: Promotion) => {
        try {
            if (p.isActive) {
                await opsAPI.deactivatePromotion(p.id);
                toast.success('Disabled', `${p.code} has been deactivated`);
            } else {
                await opsAPI.updatePromotion(p.id, { isActive: true });
                toast.success('Enabled', `${p.code} has been activated`);
            }
            await loadPromos();
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        }
    };

    const formatDiscount = (p: Promotion) =>
        p.discountType === 'percentage' ? `${Number(p.discountValue)}%` : `Rs. ${Number(p.discountValue).toLocaleString()}`;

    const formatDate = (d: string | null) => d ? String(d).slice(0, 10) : '—';

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
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Valid From</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Valid Until</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Used</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Status</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageLoading ? (
                                <tr><td colSpan={8} className="px-6 py-12 text-center text-zinc-500">Loading promotions…</td></tr>
                            ) : promos.length === 0 ? (
                                <tr><td colSpan={8} className="px-6 py-12 text-center text-zinc-500">No promotions found. Add one to get started.</td></tr>
                            ) : promos.map(p => (
                                <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Tag size={14} className="text-red-400" />
                                            <span className="text-white font-mono font-semibold">{p.code}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-300">{p.name}</td>
                                    <td className="px-6 py-4 text-zinc-300 font-medium">{formatDiscount(p)}</td>
                                    <td className="px-6 py-4 text-zinc-400 text-sm">{formatDate(p.validFrom)}</td>
                                    <td className="px-6 py-4 text-zinc-400 text-sm">{formatDate(p.validUntil)}</td>
                                    <td className="px-6 py-4 text-zinc-400 text-sm">{p.usedCount ?? 0}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                                            {p.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => openEdit(p)} className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-1">
                                                <Pencil size={13} /> Edit
                                            </button>
                                            <button onClick={() => toggleActive(p)} className="text-zinc-400 hover:text-white text-sm font-medium flex items-center gap-1">
                                                {p.isActive
                                                    ? <><ToggleLeft size={14} /> Disable</>
                                                    : <><ToggleRight size={14} className="text-emerald-400" /> Enable</>
                                                }
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Promotion' : 'Add Promotion'} size="md">
                <div className="space-y-4">
                    <Input
                        id="promo-code"
                        label="Promo Code"
                        value={form.code}
                        onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                        placeholder="SUMMER25"
                        required
                        disabled={!!editing}
                    />
                    <Input
                        id="promo-name"
                        label="Name"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Summer 25% Off"
                        required
                    />
                    <Select
                        id="promo-discount-type"
                        label="Discount Type"
                        options={[
                            { value: 'percentage', label: 'Percentage (%)' },
                            { value: 'fixed', label: 'Fixed Amount (Rs.)' },
                        ]}
                        value={form.discountType}
                        onChange={e => setForm(f => ({ ...f, discountType: e.target.value as 'percentage' | 'fixed' }))}
                    />
                    <Input
                        id="promo-discount-value"
                        label={form.discountType === 'percentage' ? 'Discount %' : 'Discount Amount (Rs.)'}
                        type="number"
                        value={form.discountValue}
                        onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                        required
                        min="0"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            id="promo-valid-from"
                            label="Valid From"
                            type="date"
                            value={form.validFrom}
                            onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))}
                            required
                        />
                        <Input
                            id="promo-valid-until"
                            label="Valid Until (optional)"
                            type="date"
                            value={form.validUntil}
                            onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setModalOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleSave}>{editing ? 'Save Changes' : 'Add Promotion'}</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
